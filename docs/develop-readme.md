# DSH 多端会话同步助手 · 开发文档

> 面向维护者、贡献者和二次开发者的实现文档。项目定位、功能和安全边界见 [readme.md](readme.md)，语言与文案规范见 [language-spec.md](../develop/language-spec.md)。

当前版本：**0.10.2**  
包名：`dsh-chat-syncer`  
License：AGPL-3.0-only

## 1. 运行模型

DSH 加载一个 Cordis 插件 bundle：

```text
cordis.patch.yml   → 声明 Host 入口
index.js           → Host 注册认证路由、监听 session/event
client.js          → 浏览器端 UI，使用 window.__ModuleLoader__.load
lib/service.js     → 所有同步业务逻辑
lib/provider.js    → Gitee / GitHub REST
```

安全边界：

- 浏览器端不持有平台访问令牌（PAT）。
- 浏览器端只调用同源、已认证的 `/dsh-chat-syncer/api/*`。
- 绝对本机路径只在 Host 侧使用；界面展示 `~/.dsh/...`。
- 令牌优先写入 DSH credentials；凭据服务不可用时退回 `secrets.json`（0600）。

## 2. 源码结构

```text
index.js              Host 路由、action 分发、会话事件
client.js             Web 客户端：登录、同步、设置、备忘录、弹窗
lib/service.js        SyncService：状态机 / 推送 / 拉取 / 账号 / 维护
lib/provider.js       RepoClient：Gitee v5 / GitHub REST
lib/bundle.js         .dsync 包：manifest + tar.gz；可选 AES
lib/crypto.js         AES-256-GCM、scrypt、口令/账号包装
lib/tar.js            最小 USTAR 实现（无第三方依赖）
lib/sessions.js       DSH 会话扫描、读取、写入、备份
lib/agreement.js      协议文本、版本、哈希
lib/data-readme.js    用户数据仓库 README 模板
lib/update.js         Gitee 插件自更新：检查、下载、写文件、回滚
test/                 Node 内置测试
```

## 3. HTTP 接口

所有接口都要求 DSH 本机会话认证；远程请求会被拒绝。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/dsh-chat-syncer/api/state` | 当前公开状态，不含令牌 |
| POST | `/dsh-chat-syncer/api/action` | 业务动作 |
| GET | `/dsh-chat-syncer/api/health` | 健康检查 |

请求体上限约 180 MB；单包上限 100 MB。

### Action 列表

| Action | 说明 |
|---|---|
| `login` | 校验 PAT、解析账号、确保私有仓库、写账号资料、首次检查 |
| `check-token` | 检查令牌 scope / 仓库读取能力 |
| `logout` | 退出当前活动账号，保留历史账号 |
| `switch-user` | 切换本机历史账号 |
| `delete-account` | 删除本机历史登录记录 |
| `clear-data` | 清空本机插件数据（含登录） |
| `initialize` | 初始化插件设置，保留登录 |
| `uninstall-cleanup` | 清理本机数据、profile dependency/bundles、node_modules |
| `withdraw-agreement` | 撤回协议、退出登录 |
| `check` | 读取 HEAD，比较本机会话集合 |
| `sessions` | 列出本机会话供选择 |
| `history` | 列出仓库 Git 提交 |
| `backups` | 列出本地覆盖备份 |
| `restore-backup` | 恢复指定备份 |
| `memo-list` | 读取备忘录并合并远端 |
| `memo-add/update/delete/withdraw/clear` | 备忘录写入 |
| `push` | 打包并推送选中会话 |
| `pull` | 下载、校验、解密并应用快照，并把会话登记到侧栏工作区 |
| `workspace-repair` | 重试登记上一条拉取未能归类的会话（通常用于补建缺失目录后） |
| `accept-agreement` | 记录协议接受 |
| `settings` | 保存同步/设备/智能同步设置 |
| `update-check` | 检查插件版本 |
| `update-apply` | 下载并应用插件更新 |
| `rename` | 修改用户显示名 |
| `encryption` | 开启/关闭加密 |
| `unlock` | 口令解锁 |
| `recover` | 账号恢复信封找回 |
| `change-passphrase` | 更换口令 |
| `export` | 导出强制加密包 |
| `import` | 导入加密包 |
| `delete` | 删除本机/仓库/两者数据 |

## 4. 账号与仓库

登录流程：

1. `RepoClient.getUser()` 解析 PAT 对应账号。
2. `RepoClient.ensureRepo(name)` 查找或创建私有仓库 `dsh-chat-syncer-data`（旧名 dsh-chat-sync-data 存在时复用）。
3. 验证仓库私有；公开仓库抛 `repo-public`。
4. 写入 `users/<provider>-<login>/account.json`。
5. 更新本机 `config.json`、`users` 快照和凭据记录。
6. 首次 `check`，有远端更新时提示。

令牌存储：

- 凭据记录：`dsh-chat-syncer/acct-<sha256(userKey) 前 20 位>`。
- 旧版本回退：`dsh-chat-syncer/account`。
- 本地回退：`secrets.json` 的 `tokens[userKey]`。
- `logout` 保留令牌，支持切换回来；`delete-account` / `clear-data` 删除。
- 令牌不进入 `config.json`，不进入同步包。

## 5. 数据格式

### HEAD.json

```text
revision          SYNC-<UTC yyyyMMddHHmmss>-<6 digits>
dataFile          users/<user>/common/data/latest-<hash>.dsync[.enc]
dataSha256        包字节 SHA-256
bytes             包大小
encrypted         是否加密
encryption.wrap   加密时：口令包装的数据密钥
manifestHash      会话清单内容哈希
sessionSetHash    会话路径/哈希/大小集合哈希
sessionCount      会话数
workspaceCount    工作区数
updatedAt         最后更新时间
updatedBy         设备信息
user              账号公开资料
```

### 同步包

- `manifest.json` + 会话日志打包为 tar。
- 明文：gzip。
- 加密：整个 tar 用 AES-256-GCM 加密。
- `revision` 是同步值，`dataSha256` 是完整性校验，两者分离。
- 文件名使用 `dataSha256` 前 12 位，不使用会话名。

### 本机数据

```text
<DSH_HOME>/dsh-chat-syncer/
  config.json
  secrets.json
  users/<key>/profile.json
  users/<key>/agreement.json
  users/<key>/memo/memo.json
  backups/<时间>/...
```

## 6. 同步流程

### 登录 / 检查

`checkInternal()`：

1. 确认仓库私有。
2. 读取 `common/HEAD.json`。
3. 扫描本机会话，计算 `localSetHash` 和最新 `mtime`。
4. 比较：
   - 远端 `sessionSetHash == localSetHash` → `same`
   - 远端 revision 变化且本机无变化 → `remote-newer`
   - 远端无变化且本机变化 → `local-newer`
   - 两边都变化且本机更新 → `diverged`
5. 返回 `relation`、`localRevision`、`remoteRevision`、`head` 和公开状态。

### 推送

1. 检查登录、协议、加密解锁、仓库私有。
2. 读取远端 HEAD；若远端 revision 不在本机确认值，阻止并返回 `remote-ahead`。
3. 增量模式：下载并解密远端包，保留远端其他会话。
4. 扫描本机选中会话，合并。
5. 构建 tar.gz；可选加密；计算 `dataSha256` 和 `revision`。
6. 上传不可变包。
7. 写 manifest、账号、协议、设备文件。
8. 最后写 HEAD，完成指针切换。
9. 删除旧包（HEAD 写入后）。
10. 更新本机 lastSeen/lastPush。

### 拉取

1. 读取 HEAD。
2. 下载包并校验 `dataSha256`。
3. 解密。
4. `applySessionFiles()`：
   - 覆盖：同路径覆盖，先备份；正在使用的会话跳过。
   - 增量：只新增或远端较新的文件；本机较新则保留并记录冲突。
5. 更新 lastSeen，返回新增/更新/跳过/冲突。
6. 提示刷新 DSH 会话列表。

### 备份

- 路径：`backups/<ISO 时间>/<project>/<session>/<file>`。
- 覆盖写入前备份旧文件。
- `listBackups()` 读取批次；`restoreBackup()` 校验路径、跳过活动会话、写回本机。

### 智能同步

- `smartSync` 默认 true。
- `runScheduledPush()` 每次定时调用 `push({reason:'scheduled'})`。
- 返回 `noop` 时 `unchangedScheduledCount++`。
- 达到 2 次：`scheduledPaused = true`，清空定时器。
- 恢复：`init()`、`turn/end`、真实推送成功、修改同步设置。
- 关闭智能同步后，固定间隔持续检查。

## 7. 加密

- 算法：AES-256-GCM。
- KDF：scrypt（N=2^15, r=8, p=1），随机 16 字节 salt。
- 包：随机 12 字节 IV + 16 字节认证标签。
- 数据密钥：随机 32 字节。
- 口令包装：`HEAD.encryption.wrap`。
- 账号恢复：`recovery.json` 用账号身份派生 KEK 包装数据密钥。
- 明文口令不落盘。

## 8. 备忘录

- 远端：`users/<key>/memo/memo.json`。
- 本机：`users/<key>/memo/memo.json`。
- 读取时合并本机与远端，按 `updatedAt` 保留较新版本。
- 写入时先写本机，再通过 Contents API 写入仓库。
- 记录字段：`id`、`text`、`createdAt`、`updatedAt`、`withdrawn`、`withdrawnAt`、`author`、`dshUser`。
- 撤回是软撤回；删除是硬删除；全部删除写入空数组。

## 9. 插件更新与维护

- 更新源：`https://gitee.com/user_gitee/dsh-chat-sync`。
- 允许文件：`package.json`、`index.js`、`client.js`、`cordis.patch.yml`、`icon.svg`、`lib/*`。
- 写入临时文件，原子替换；失败回滚。
- Host 更新后需重启 DSH。
- 卸载：
  1. 插件管理器移除 bundle；
  2. `uninstall-cleanup` 清理本机数据；
  3. 编辑 `DSH_PROFILE_DIR/package.json` 删除 dependency/bundle；
  4. 删除 `node_modules/dsh-chat-syncer`；
  5. 延迟二次清理数据目录，避免运行中的服务重新写回。

## 10. 测试与开发

```powershell
npm test        # Node 内置测试
npm run check   # 语法检查
```

测试覆盖：

- tar 读写；
- 包构建、加解密、强制导出加密；
- Gitee / GitHub 模拟 HTTP；
- 登录、检查、推送、拉取；
- 增量合并；
- 备份/恢复；
- 备忘录；
- 智能同步暂停/恢复；
- 清空/初始化；
- 私有仓库拒绝；
- 更新版本比较。

测试不访问真实 Gitee / GitHub。

## 11. 调试

- Host 日志：DSH 控制台 / crash log。
- Web 端：浏览器控制台。
- 状态：`GET /dsh-chat-syncer/api/state`。
- 插件操作历史：`<DSH_HOME>/profiles/<profile>/.plugin-manager/`。
- 本机配置：`<DSH_HOME>/dsh-chat-syncer/config.json`（不含令牌）。
- 仓库路径不要打印令牌或完整凭据。

## 12. 发布清单

1. 更新 `package.json` 版本。
2. 更新 `lib/service.js` 中 `PLUGIN_VERSION`。
3. 更新 `client.js` 中 `VERSION`。
4. 更新 README / 文档。
5. `npm test`。
6. `git commit` + `git push origin master`。
7. 确认 `https://gitee.com/user_gitee/dsh-chat-sync/raw/master/package.json` 版本。
8. 插件更新功能会读取该文件。

## 13. 约束

- 不依赖本机 Git；使用 Contents API。
- 单包 100 MB；单文件 64 MB；请求体 180 MB。
- Gitee contents 接口的内联内容上限 10 MiB，超过上限必须走 `/git/blobs/{sha}`（0.8.8 起）。
- 不做 Git 历史清理。
- 不做事件级会话合并。
- 不内置 OAuth；只使用 PAT。
- AGPL-3.0-only；二次分发请遵守许可证。

## 14. 侧栏可见性与工作区登记

DSH 的会话列表按工作区分组：`workspace.json` 里每个工作区记录一列 `sessionIds`，会话头里的 `cwd` 必须解析到本机真实目录，会话才会出现在侧栏。该注册表只在首次启动做一次历史 bootstrap，之后不会自动收编新落盘的文件——只复制会话文件，界面里什么都不会出现。

因此拉取分两步：

1. `applySessionFiles()` 写会话文件（原有逻辑）。
2. `reconcilePulledWorkspaces()` 解析包内每个会话头的首条记录（`lib/sessions.js#parseSessionHeader`，支持明文 JSONL 与 Zstandard `session.v4.jsonl.zstd`），按 `cwd` 分组，再通过可选的 `workspaceRegistry` 服务做 `create(cwd)` + `attachSession(id)`。结果作为 `pull.workspace` 返回：`attached / already / created / missing / failed / unreadable`。

边界：

- 没有侧栏的 profile（headless / sdk）取不到 `workspaceRegistry`，整段登记跳过（`available: false`），拉取结果不受影响。
- `cwd` 目录不存在时**先补建再登记**：`autoCreateWorkspaceDirs`（默认开）控制开关，`mkdir -p` 成功后记入 `created`。`isCreatableWorkspacePath()` 只放行绝对路径，并拒绝盘符根、`%SystemRoot%`、`%ProgramFiles%`、`%ProgramData%` 等受保护位置；被拒绝的进入 `missing`，写入 `config.pendingWorkspaces`，由「重新登记」（`workspace-repair`）重试。
- 建目录失败（权限、只读盘、路径不可写）只让该组会话进入 `failed`，不影响其余会话，也不影响拉取结果。
- 单条会话登记失败（目录被删、会话正在使用、注册表拒绝）同样只影响那一条。
- `missing` 会把绝对路径返回给页面，用于提示该建哪个目录；除此之外不返回任何会话内容。

测试覆盖：`test/sessions.test.js`（明文 / zstd 头解析）、`test/workspaces.test.js`（分组、缺失、单条失败、无注册表降级）、`test/provider.test.js`（内联截断回退 blob）。

### Gitee 内联内容上限

Gitee 的 contents 接口对单文件内联 `content` 有 10 MiB 截断，且 `size` 仍报告真实字节数。`RepoClient.getFile()` 因此只在「解码后字节数 == `size`」时采用内联内容，否则回退 `/git/blobs/{sha}`，并再次校验长度。缺这层校验时，超过 10 MiB 的同步包会以 `package-corrupt`（sha256 不一致）失败；0.8.8 起修复。工作区自动补建与登记自 0.8.9 起默认开启。
