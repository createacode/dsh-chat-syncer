# DSH 多端会话同步助手 · 开发者项目说明

> 面向开发者、贡献者和二次集成者的项目级说明。实现细节、接口和数据格式见 [develop-readme.md](develop-readme.md)。

## 项目定位

DSH 多端会话同步助手（包名 `dsh-chat-syncer`）是运行在 DeepSeek Harness（DSH）中的同步插件。

它解决一个问题：

> 本机产生的 DSH 会话，如何安全地备份到用户自己的私有仓库，并在另一台设备上比较、拉取和恢复。

项目坚持三个边界：

1. **用户拥有仓库**：数据写入用户自己的 Gitee / GitHub 私有仓库，插件作者不运营云端存储。
2. **插件只做传输**：打包、加密、上传、下载、恢复；不分析、不画像、不转售会话内容。
3. **本机优先**：令牌、明文口令、设备信息留在本机；浏览器端永远拿不到令牌。

当前版本：**0.15.0** · 作者：**XAF** · License：**AGPL-3.0-only**

## 功能范围

| 领域 | 能力 |
|---|---|
| 账号 | Gitee / GitHub PAT 登录；多账号保存、切换、退出、切回、删除历史记录 |
| 仓库 | 自动创建或复用 `dsh-chat-syncer-data` 私有仓库（旧名存在时复用）；公开仓库拒绝同步 |
| 会话同步 | 覆盖 / 增量；单会话或部分会话提交；首次授权同步；手动检查与拉取 |
| 自动同步 | `turn/end` 后防抖提交；10 分钟到 24 小时定时提交；智能同步暂停/恢复 |
| 版本比较 | HEAD revision、会话集合哈希、本机扫描哈希、更新时间综合判断哪边最新 |
| 安全 | AES-256-GCM 整包加密；账号恢复信封；覆盖前备份；强制加密导出 |
| 备忘录 | 按天时间线；新增、编辑、删除、撤回、复制、批量删除、全部删除；写入仓库 `memo/` |
| 运维 | 检查插件更新、自动更新、清空数据、初始化（保留登录）、一键卸载 |
| 协议 | 版本化协议、签署记录、查看已签协议、撤回协议并退出登录 |
| 身份 | 当前 DSH 本机用户 vs Gitee/GitHub 账号；12 位 MAC 唯一标识 + 辅助标识 |

## 架构概览

```text
DSH Browser (client.js)
        │  same-origin authenticated JSON
        ▼
Host route (/dsh-chat-syncer/api/action)
        │
        ▼
SyncService (lib/service.js)
  ├─ RepoClient (lib/provider.js) ── Gitee / GitHub Contents API
  ├─ Bundle (lib/bundle.js) ── tar.gz + optional AES
  ├─ Sessions (lib/sessions.js) ── DSH session logs
  ├─ Agreement (lib/agreement.js)
  └─ Update (lib/update.js) ── Gitee self-update
```

关键设计：

- 浏览器不接触令牌、仓库 URL 的认证信息或绝对本机路径。
- 所有仓库操作在 Host 进程完成。
- 每次仓库写入都形成一个 Git 提交； HEAD 最后写入，保证包和清单先就绪。
- 覆盖拉取先备份再替换；正在使用的会话始终跳过。

## 仓库数据模型

```text
users/<provider>-<login>/
  account.json
  agreement.json
  recovery.json
  memo/memo.json
  common/
    HEAD.json
    manifest.json
    data/latest-<dataSha256 前 12 位>.dsync[.enc]
  devices/<deviceId>/
    device.json
    manifest.json
```

- `common/HEAD.json`：所有设备共享的最新同步值。
- `common/data/`：不可变快照包；文件名使用内容哈希。
- `devices/<id>/`：设备侧的审计和隔离记录。
- `memo/`：按天存储的备忘录数据。

## 同步模型

### 推送：覆盖 / 增量

- 全选推送默认覆盖：本次选中的会话替换公共最新快照，只在远端存在的会话会从最新值里消失。
- 也可选增量：读取远端当前快照，保留其他会话，再合并选中会话；底层仍上传一个完整包。
- 未全选时只能增量，界面会自动切换并提示（`modeAdjusted`）。

### 拉取：增量 / 强制

- 增量（默认）：只补缺失或远端较新的文件，保留本机其他/较新会话。
- 强制：用远端快照覆盖本机同路径会话；先备份，正在使用的会话仍然跳过。

### 增量直连

- 增量推送会下载云端包、合并远端独有会话与其附件，再上传，所以远端有新版本也不阻塞。
- 增量拉取只补缺失与远端更新，不会删除本地。
- 只有 `mode: force` 的推送要求 `lastSeenRevision === remoteHead.revision`，避免替换云端快照时丢掉别的设备内容。

### 先拉后推

仓库版本与本机记录不一致时，推送一律被拒绝（`pull-required`），必须先做一次增量拉取。原先的「仍然覆盖提交」旁路已移除：它会把其他设备刚写进去的会话静默冲掉。

### 会话登记修复

- 会话文件存在 ≠ 侧栏可见：DSH 的工作区注册表（`<DSH_HOME>/storages/workspace.json`）必须把会话 id 列在 `cwd` 对应的工作区下。
- `repair-registrations`：扫描会话头，按 `cwd` 比对注册表，`dryRun` 只返回未登记/缺工作区数量；实跑调用工作区注册表 `create(cwd).attachSession(id)`，并调用 `clearProjectionCache()` 把 `session_projcache/sessions/<id>.json` 改名留档，强制 DSH 重建投影。
- 缓存若是在日志损坏时生成的，不清掉会一直显示空会话——这是 demo14 事故的第二层原因。

### 选择性下载

- `remote-sessions` 读仓库 `common/manifest.json`（加密包没有明文清单时返回 `encrypted: true`，界面提示只能整包下载），按 `<project>` 分组。
- `pull` 与 `pull-version` 接受 `sessionRelPaths`：只写回选中的会话文件，附件仍然整包校验。

### 历史版本

- 只保留最新快照在工作树，旧快照仍在 Git 历史里；`versions` 动作按 `common/HEAD.json` 的提交筛选最近 3 个版本（`listCommits(path)` + `readJson(path, sha)`）。
- `pull-version` 按 commit 取回 `HEAD.json` 与快照包，校验 sha256 后写回会话；同步位置（`lastSeenRevision`）保持不变，成功后 `lastRelation` 标为 `diverged`。

### 附件

- 推送时解析会话日志里引用的 `sha256:` 附件 id，把本机附件库（`<DSH_HOME>/attachments/v1/objects/<前两位>/<sha>`）中存在的文件一起打包（单文件 ≤ 20 MB，总计 ≤ 48 MB）。
- 拉取时写回同一个对象库；已存在的对象不重复写。
- 发送端自己也缺失的附件会列进 `manifest.missingAttachments`；接收端把这些引用替换成占位文本（原会话文件先备份到 `backups/`），避免续聊时在请求准备阶段报 `DeepSeek Messages transport failed`。
- 「修改会话」标签页对已经下载过的历史会话做同样的处理：先扫描（`dryRun`）列出缺失数量，确认后改写并备份。

真正的对象级增量（按会话哈希只传变化）设计见 [INCREMENTAL.md](INCREMENTAL.md)。

## 智能同步

- 默认开启。
- 定时提交默认 3 小时；支持 10 / 20 / 30 分钟，1 / 3 / 6 / 12 / 24 小时。
- 连续两次定时提交返回 `noop` 后暂停定时器。
- 下次打开 DSH、会话完成、手动提交实际变更或修改同步设置时恢复。
- 关闭智能同步后，按固定间隔持续检查。

## 安全与隐私

- 仓库必须私有；检查、推送、拉取前都会验证。
- 令牌优先存储在 DSH 凭据服务，退回权限受限的本地文件。
- 同步包默认不加密；可选 AES-256-GCM。
- 导出包始终强制加密；导入必须输入口令。
- 覆盖前备份旧文件；备份可在设置中恢复。
- 删除文件不会自动清理 Git 历史；敏感数据应使用加密。
- 卸载会清理本机插件数据，但不删除仓库数据，也不动现有聊天。

## 安装

```powershell
# 安装包（推荐）：下载 dist/dsh-chat-syncer-0.15.0.tgz 后安装，不需要 git、不需要 Gitee 账号
dsh plugin --profile desktop add "file:C:\Users\<you>\Downloads\dsh-chat-syncer-0.15.0.tgz"

# 或者让 DSH 直接拉安装包（HTTPS，不经过 git）
dsh plugin --profile desktop add "https://gitee.com/user_gitee/dsh-chat-sync/raw/master/dist/dsh-chat-syncer-0.15.0.tgz"

# 本地源码目录（开发调试）
dsh plugin --profile desktop add "file:<path-to-this-repo>"
```

以 git 依赖安装（`dsh plugin add https://gitee.com/user_gitee/dsh-chat-sync.git`）仍然可行，但需要本机先装 git，且 Gitee 的 git 通道可能返回 401 并要求登录，因此不再作为推荐方式。

重启 DSH 后，在左侧栏打开 **多端会话同步助手**。

## 令牌最低权限

| 平台 | 最低权限 |
|---|---|
| Gitee | `projects` |
| GitHub Classic | `repo` |
| GitHub Fine-grained | Contents 读写 + Administration 读写 |

## 项目结构

```text
index.js              Host 入口：认证路由、session/event 钩子
client.js             Web 客户端：页面、弹窗、设置、备忘录
lib/service.js        同步服务：状态机、推送/拉取、账号、维护
lib/provider.js       Gitee/GitHub REST 适配器
lib/bundle.js         .dsync 包
lib/crypto.js         AES-256-GCM / scrypt
lib/sessions.js       DSH 会话扫描与写入
lib/agreement.js      协议文本、版本、哈希
lib/data-readme.js    数据仓库 README 模板
lib/update.js         Gitee 插件自更新
docs/                 项目文档
test/                 Node 内置测试
```

## 已知限制

- 只使用 PAT，不内置 OAuth App。
- 单包约 100 MB，单会话文件约 64 MB。
- 直接搬运 DSH 会话日志，跨大版本格式可能不兼容。
- 不合并同一会话的并发事件分支。
- 不自动清理 Git 历史。
- 平台限流由 Gitee / GitHub 决定。
- 设备 MAC 地址可能因网卡/虚拟网卡变化而变化。

## 进一步阅读

- [开发文档](develop-readme.md)
- [开发入口](../develop/README.md)
- [插件语言规范](../develop/language-spec.md)
- [增量同步设计](INCREMENTAL.md)
- [项目首页](../README.md)
- [许可证](../LICENSE)
