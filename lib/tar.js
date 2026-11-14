/**
 * Minimal USTAR reader/writer.
 *
 * A sync bundle is a gzip-compressed tarball. Using a tiny local implementation
 * keeps the plugin dependency-free while still preserving file names and byte
 * contents exactly; the reader only accepts regular files written by the
 * writer and rejects absolute or traversal paths.
 */
import { sanitizeRepositoryPath } from './util.js';

const BLOCK = 512;
const ZERO_BLOCK = Buffer.alloc(BLOCK);

function writeString(buffer, offset, length, value) {
  const text = Buffer.from(String(value), 'utf8');
  text.copy(buffer, offset, 0, Math.min(text.length, length));
}

function writeOctal(buffer, offset, length, value) {
  const text = Math.max(0, Math.floor(Number(value) || 0)).toString(8);
  const padded = `${'0'.repeat(Math.max(0, length - 1 - text.length))}${text}\0`;
  writeString(buffer, offset, length, padded.slice(0, length));
}

function splitName(name) {
  const text = sanitizeRepositoryPath(name);
  if (Buffer.byteLength(text) <= 100) return { name: text, prefix: '' };
  const slash = text.lastIndexOf('/', 155);
  if (slash <= 0) throw new Error(`tar path is too long: ${text}`);
  const prefix = text.slice(0, slash);
  const local = text.slice(slash + 1);
  if (Buffer.byteLength(prefix) > 155 || Buffer.byteLength(local) > 100) {
    throw new Error(`tar path is too long: ${text}`);
  }
  return { name: local, prefix };
}

function headerFor(name, size, mtimeMs) {
  const header = Buffer.alloc(BLOCK);
  const { name: local, prefix } = splitName(name);
  writeString(header, 0, 100, local);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, Math.floor(Number(mtimeMs || Date.now()) / 1000));
  header.fill(0x20, 148, 156);
  header[156] = '0'.charCodeAt(0);
  writeString(header, 257, 6, 'ustar\0');
  writeString(header, 263, 2, '00');
  writeString(header, 265, 32, 'dsh');
  writeString(header, 297, 32, 'dsh');
  writeString(header, 345, 155, prefix);

  let checksum = 0;
  for (const byte of header) checksum += byte;
  const octal = checksum.toString(8).padStart(6, '0');
  writeString(header, 148, 8, `${octal}\0 `);
  return header;
}

/**
 * Build a USTAR archive.
 * @param {{path: string, data: Buffer, mtimeMs?: number}[]} entries
 * @returns {Buffer}
 */
export function createTar(entries) {
  const chunks = [];
  for (const entry of entries) {
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const name = sanitizeRepositoryPath(entry.path);
    chunks.push(headerFor(name, data.length, entry.mtimeMs));
    chunks.push(data);
    const padding = (BLOCK - (data.length % BLOCK)) % BLOCK;
    if (padding > 0) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(ZERO_BLOCK, ZERO_BLOCK);
  return Buffer.concat(chunks);
}

function readString(buffer, offset, length) {
  const slice = buffer.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? slice.length : end).toString('utf8');
}

function readOctal(buffer, offset, length) {
  const text = readString(buffer, offset, length).trim();
  if (text === '') return 0;
  if (!/^[0-7]+$/.test(text)) return 0;
  return Number.parseInt(text, 8);
}

function checksumOf(block) {
  let sum = 0;
  for (let index = 0; index < BLOCK; index += 1) {
    sum += index >= 148 && index < 156 ? 0x20 : block[index];
  }
  return sum;
}

/**
 * Read a USTAR archive into a Map keyed by path.
 * @param {Buffer} buffer
 * @returns {Map<string, Buffer>}
 */
export function readTar(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new Error('tar input must be a buffer');
  const files = new Map();
  let offset = 0;
  while (offset + BLOCK <= buffer.length) {
    const header = buffer.subarray(offset, offset + BLOCK);
    offset += BLOCK;
    if (header.equals(ZERO_BLOCK)) break;

    const expected = readOctal(header, 148, 8);
    if (expected !== 0 && checksumOf(header) !== expected) {
      throw new Error('tar header checksum mismatch');
    }
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const fullName = sanitizeRepositoryPath(prefix ? `${prefix}/${name}` : name);
    const size = readOctal(header, 124, 12);
    if (size < 0 || offset + size > buffer.length) throw new Error('truncated tar entry');
    const type = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
    if (type === '0') {
      if (files.has(fullName)) throw new Error(`duplicate tar entry: ${fullName}`);
      files.set(fullName, Buffer.from(buffer.subarray(offset, offset + size)));
    } else if (type === '5') {
      // Directories carry no bytes and are created implicitly by file paths.
    } else if (type === 'L') {
      throw new Error('GNU long tar names are not supported');
    } else {
      throw new Error(`unsupported tar entry type: ${type}`);
    }
    offset += size + ((BLOCK - (size % BLOCK)) % BLOCK);
  }
  return files;
}
