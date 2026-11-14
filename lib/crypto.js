/**
 * AES-256-GCM package encryption and passphrase/account key wrapping.
 *
 * The repository always receives a self-describing binary package. Metadata
 * (salt, IV, auth tag) is inside that package, so a package can be decrypted
 * without any local state as long as the user knows the passphrase.
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

export const MAGIC = Buffer.from('DSHSYNC1', 'ascii');
export const FORMAT_VERSION = 1;
const ALGORITHM = 0x01;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const SCRYPT_OPTIONS = Object.freeze({
  N: 1 << 15,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
});
const CHECK_TEXT = Buffer.from('dsh-chat-sync/key-check/v1', 'utf8');

export class CryptoError extends Error {
  constructor(message, code = 'crypto') {
    super(message);
    this.name = 'CryptoError';
    this.code = code;
  }
}

export function deriveKey(passphrase, salt) {
  const text = String(passphrase ?? '');
  if (text.length < 1) throw new CryptoError('口令不能为空', 'empty-passphrase');
  return scryptSync(text.normalize('NFKC'), salt, KEY_BYTES, SCRYPT_OPTIONS);
}

function seal(key, plaintext, aad) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  if (aad) cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, ciphertext };
}

function open(key, envelope, aad) {
  const decipher = createDecipheriv('aes-256-gcm', key, envelope.iv);
  if (aad) decipher.setAAD(aad);
  decipher.setAuthTag(envelope.tag);
  return Buffer.concat([decipher.update(envelope.ciphertext), decipher.final()]);
}

export function newDataKey() {
  return randomBytes(KEY_BYTES);
}

export function isEncryptedPackage(buffer) {
  return Buffer.isBuffer(buffer)
    && buffer.length >= 56
    && buffer.subarray(0, MAGIC.length).equals(MAGIC);
}

/**
 * Encrypt a payload with an already-derived 32-byte data key.
 * @param {Buffer} dataKey
 * @param {Buffer} plaintext
 * @returns {Buffer}
 */
export function encryptWithKey(dataKey, plaintext, headerSalt) {
  if (!Buffer.isBuffer(dataKey) || dataKey.length !== KEY_BYTES) {
    throw new CryptoError('数据密钥长度无效');
  }
  const salt = Buffer.isBuffer(headerSalt) && headerSalt.length === SALT_BYTES
    ? Buffer.from(headerSalt)
    : randomBytes(SALT_BYTES);
  const body = seal(dataKey, plaintext, MAGIC);
  const header = Buffer.alloc(56);
  MAGIC.copy(header, 0);
  header[8] = FORMAT_VERSION;
  header[9] = ALGORITHM;
  header[10] = 0;
  header[11] = 0;
  salt.copy(header, 12);
  body.iv.copy(header, 28);
  body.tag.copy(header, 40);
  return Buffer.concat([header, body.ciphertext]);
}

/**
 * Decrypt a package produced by {@link encryptWithKey}.
 * @param {Buffer} dataKey
 * @param {Buffer} packageBytes
 * @returns {Buffer}
 */
export function decryptWithKey(dataKey, packageBytes) {
  if (!isEncryptedPackage(packageBytes)) throw new CryptoError('不是有效的加密同步包');
  if (!Buffer.isBuffer(dataKey) || dataKey.length !== KEY_BYTES) {
    throw new CryptoError('数据密钥长度无效');
  }
  const version = packageBytes[8];
  const algorithm = packageBytes[9];
  if (version !== FORMAT_VERSION) throw new CryptoError(`unsupported package version ${version}`, 'version');
  if (algorithm !== ALGORITHM) throw new CryptoError(`unsupported package algorithm ${algorithm}`, 'algorithm');
  const header = packageBytes.subarray(0, 56);
  const envelope = {
    iv: packageBytes.subarray(28, 40),
    tag: packageBytes.subarray(40, 56),
    ciphertext: packageBytes.subarray(56),
  };
  try {
    return open(dataKey, envelope, MAGIC);
  } catch {
    throw new CryptoError('口令错误或加密包已损坏', 'bad-key');
  }
}

/**
 * Encrypt a payload with a user passphrase. A fresh key and salt are generated
 * on every call.
 * @param {string} passphrase
 * @param {Buffer} plaintext
 * @returns {{bytes: Buffer, dataKey: Buffer, salt: Buffer}}
 */
export function encryptWithPassphrase(passphrase, plaintext) {
  const salt = randomBytes(SALT_BYTES);
  const dataKey = deriveKey(passphrase, salt);
  return { bytes: encryptWithKey(dataKey, plaintext, salt), dataKey, salt };
}

/**
 * Decrypt a package with a passphrase, recovering the salt from the package.
 * @param {string} passphrase
 * @param {Buffer} packageBytes
 * @returns {Buffer}
 */
export function decryptWithPassphrase(passphrase, packageBytes) {
  if (!isEncryptedPackage(packageBytes)) throw new CryptoError('不是有效的加密同步包');
  const salt = packageBytes.subarray(12, 28);
  const dataKey = deriveKey(passphrase, salt);
  return decryptWithKey(dataKey, packageBytes);
}

/**
 * Wrap a data key under a passphrase-derived key and attach a verifier.
 * @param {string} passphrase
 * @param {Buffer} dataKey
 */
export function wrapForPassphrase(passphrase, dataKey) {
  const salt = randomBytes(SALT_BYTES);
  const kek = deriveKey(passphrase, salt);
  const wrapped = seal(kek, dataKey, Buffer.from('dsh-chat-sync/wrap/passphrase/v1'));
  const check = seal(dataKey, CHECK_TEXT, Buffer.from('dsh-chat-sync/check/v1'));
  return {
    salt: salt.toString('base64'),
    iv: wrapped.iv.toString('base64'),
    tag: wrapped.tag.toString('base64'),
    wrappedKey: wrapped.ciphertext.toString('base64'),
    checkIv: check.iv.toString('base64'),
    checkTag: check.tag.toString('base64'),
    checkCipher: check.ciphertext.toString('base64'),
  };
}

/** Unwrap a data key using the passphrase metadata from {@link wrapForPassphrase}. */
export function unwrapForPassphrase(passphrase, meta) {
  const salt = Buffer.from(meta.salt, 'base64');
  const kek = deriveKey(passphrase, salt);
  let dataKey;
  try {
    dataKey = open(kek, {
      iv: Buffer.from(meta.iv, 'base64'),
      tag: Buffer.from(meta.tag, 'base64'),
      ciphertext: Buffer.from(meta.wrappedKey, 'base64'),
    }, Buffer.from('dsh-chat-sync/wrap/passphrase/v1'));
  } catch {
    throw new CryptoError('口令错误', 'bad-passphrase');
  }
  verifyCheck(dataKey, meta);
  return dataKey;
}

function verifyCheck(dataKey, meta) {
  try {
    const plain = open(dataKey, {
      iv: Buffer.from(meta.checkIv, 'base64'),
      tag: Buffer.from(meta.checkTag, 'base64'),
      ciphertext: Buffer.from(meta.checkCipher, 'base64'),
    }, Buffer.from('dsh-chat-sync/check/v1'));
    if (!timingSafeEqual(plain, CHECK_TEXT)) throw new Error('mismatch');
  } catch {
    throw new CryptoError('密钥校验失败', 'bad-key');
  }
}

/**
 * The account recovery envelope deliberately lives in the user's private
 * repository. Anyone who can read that repository can recover the package, by
 * design: repository access is the account proof.
 */
export function wrapForAccount(account, dataKey) {
  const salt = randomBytes(SALT_BYTES);
  const kek = deriveKey(accountKekText(account), salt);
  const wrapped = seal(kek, dataKey, Buffer.from('dsh-chat-sync/wrap/account/v1'));
  return {
    version: 1,
    provider: account.provider,
    accountId: String(account.id ?? ''),
    login: account.login,
    salt: salt.toString('base64'),
    iv: wrapped.iv.toString('base64'),
    tag: wrapped.tag.toString('base64'),
    wrappedKey: wrapped.ciphertext.toString('base64'),
  };
}

function accountKekText(account) {
  return `dsh-chat-sync/account/${account.provider}/${account.id ?? ''}/${account.login}`;
}

export function unwrapForAccount(account, recovery) {
  if (!recovery || recovery.provider !== account.provider) {
    throw new CryptoError('恢复文件属于另一个账号', 'bad-recovery');
  }
  const salt = Buffer.from(recovery.salt, 'base64');
  const kek = deriveKey(accountKekText(account), salt);
  try {
    return open(kek, {
      iv: Buffer.from(recovery.iv, 'base64'),
      tag: Buffer.from(recovery.tag, 'base64'),
      ciphertext: Buffer.from(recovery.wrappedKey, 'base64'),
    }, Buffer.from('dsh-chat-sync/wrap/account/v1'));
  } catch {
    throw new CryptoError('无法用当前账号恢复数据密钥', 'bad-recovery');
  }
}

/** Hex-encode a key for display-free diagnostics (never send the actual key). */
export function keyFingerprint(dataKey) {
  return dataKey.subarray(0, 8).toString('hex');
}

