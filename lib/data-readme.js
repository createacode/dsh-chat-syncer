/**
 * The README written into the user's own data repository when it is created.
 * It is intentionally in Chinese because the plugin's primary audience is
 * mainland-China Gitee users; the plugin README links here for details.
 */
export function dataRepoReadme() {
  return `# DSH 多端会话同步助手数据仓库

> 本仓库由 [dsh-chat-syncer](https://gitee.com/user_gitee/dsh-chat-sync) 创建，用于保存当前账号自愿上传的 DeepSeek Harness（DSH）会话快照。
>
> **请保持仓库为私有。** 插件在检查、推送、拉取前都会验证仓库可见性；公开仓库会被拒绝同步。仓库内容一旦公开，等同于公开你的会话记录。

## 这是什么

DSH 多端会话同步助手插件把本机会话日志打包后，通过 Gitee / GitHub 的 Contents API 写入这个仓库；另一台设备登录同一账号后，可以读取同一个公共快照并拉取。

- 插件不运营云端存储，不收集会话内容，也不掌握你的账号密码。
- 访问令牌只保存在本机；仓库里只有你主动上传的会话数据、账号资料、协议记录和设备记录。
- 推荐使用 Gitee；也可以使用 GitHub。两个平台的账号数据分别存放在不同目录。
- 不需要安装 Git，也不需要把仓库 clone 到本机。

## 快速开始

1. 在 DSH 中安装并启用 **dsh-chat-syncer**。
2. 打开「多端会话同步助手」，选择 Gitee 或 GitHub，粘贴有仓库读写权限的个人访问令牌。
3. 登录后插件会自动创建或复用私有仓库 **dsh-chat-syncer-data**（旧名的 dsh-chat-sync-data 会继续复用）。
4. 首次上传前阅读并签署《数据上传同意书》。
5. 点击「检查会话更新」查看仓库最新值；点击「提交最新记录」选择要上传的会话。

## 目录结构

~~~text
users/
  <provider>-<login>/
    account.json                 # 账号公开资料（不含令牌）
    agreement.json               # 已签署的数据上传协议记录
    common/
      HEAD.json                  # 所有设备共享的最新同步值
      manifest.json              # 明文包的会话清单（加密时会被移除）
      data/
        latest-<dataSha256 前 12 位>.dsync
        latest-<dataSha256 前 12 位>.dsync.enc
    devices/
      <deviceId>/
        device.json              # 设备身份、最后推送值、统计
        manifest.json            # 该设备最近一次快照清单
    recovery.json                # 可选的加密口令找回信封
    memo/
      memo.json                  # 备忘录时间线（按天分组的数据源）
~~~

同一个账号在同一平台只有一个用户目录；不同设备在 devices 下各自独立；所有设备通过 common 下的公共快照同步。

## 关键文件说明

### common/HEAD.json

所有设备比较同步状态时读取这个文件。主要字段：

| 字段 | 说明 |
|---|---|
| revision | 公共同步值，格式为 SYNC-<UTC 时间戳>-<6 位数字>，例如 SYNC-20261109145500-042317 |
| dataFile | 当前快照包在仓库中的路径 |
| dataSha256 | 快照包字节的 SHA-256，用于下载后完整性校验 |
| bytes | 快照包大小 |
| encrypted | 当前包是否加密 |
| encryption.wrap | 加密时用账号身份包装的数据密钥；不是明文口令 |
| manifestHash | 会话清单内容哈希 |
| sessionSetHash | 仅由会话路径、哈希和大小计算出的集合哈希，用于判断“有没有变化” |
| sessionCount / workspaceCount | 会话数和工作区数 |
| updatedAt / updatedBy | 最后更新时间与设备信息 |
| user | 账号公开资料 |

### 数据包（data/latest-*.dsync 或 .dsync.enc）

- 明文包是 gzip 压缩的 tar，包含 manifest.json 和会话日志。
- 加密包是整个 tar 再用 AES-256-GCM 加密，内部文件名也不会以明文出现在仓库里。
- 包文件名使用 dataSha256 的前 12 位，不使用会话名。
- 单包上限约 100 MB；超大时请减少选中的会话。

### devices/<deviceId>/device.json

记录这台设备的显示名、平台、架构、最后推送同步值和统计。设备记录用于审计和隔离，不会覆盖其他设备的目录。

### agreement.json

保存协议版本、哈希和签署时间。上传前必须有有效签署记录；本机也保留一份。

### recovery.json

仅在开启加密且生成找回信息时存在。它用当前 Gitee / GitHub 账号身份包装数据密钥，让同一账号在另一台设备上可以恢复口令；能访问该仓库的人也可能恢复，所以仓库必须保持私有。

### memo/memo.json

备忘录页面按天展示的时间线数据。每条记录包含 id、正文、创建/更新时间、作者和撤回状态；支持编辑、删除、撤回、复制和批量删除。数据与仓库一起由 Git 提交管理。

## 同步规则

- **覆盖（默认）**：推送时用本次选中的会话替换公共最新快照；拉取时用远端包覆盖本机同路径会话。覆盖前会备份，正在使用的会话会跳过。
- **增量**：推送时读取远端当前包，保留其中其他会话，再合并本次选中的会话；拉取时只补缺失或远端较新的文件，保留本机其他会话。
- **会话完成提交**：每次 turn/end 后约 5 秒自动排队提交，可关闭。
- **定时提交**：可选 10 / 20 / 30 分钟或 1 / 3 / 6 / 12 / 24 小时，默认 3 小时；内容没有变化时不会产生提交。
- **智能同步（默认）**：连续两次定时检查没有变化后暂停定时同步，直到下次打开 DSH 或会话完成；可在设置中关闭。
- **首次授权同步**：首次签署协议且仓库为空时，自动全量提交一次。
- **冲突保护**：如果仓库 HEAD 的 revision 与本机上次确认值不同，默认拒绝提交，提示先检查更新；确认后可以强制覆盖。

当前的“增量”是会话集合层面的增量合并，底层仍上传一个完整快照包；按对象只传变化会话的调研方案见插件仓库的 docs/INCREMENTAL.md。

## 安全与隐私

- 仓库必须是私有；插件会拒绝向公开仓库同步。
- 访问令牌不会写入这个仓库，也不会写入会话记录。
- 同步包默认不加密；开启加密后，整个包是 AES-256-GCM 密文。
- 导出包始终强制加密，必须输入至少 8 位口令；导入需要同一口令。
- 拉取正在使用的会话会被跳过，避免写坏当前日志。
- 本地备份位于 DSH 数据目录的 dsh-chat-syncer/backups/ 下。
- 不要在这个仓库里放密码、私钥或其他与本插件无关的敏感文件。

## 常见操作

- **检查更新**：读取 HEAD.json，与本地 lastSeenRevision 比较。
- **提交**：可全选或只选一个/部分会话；默认全选。
- **拉取**：下载并校验 dataSha256，解密后按同步方式写入本机。
- **重命名**：只改变用户显示名，不移动仓库中的用户目录。
- **导出/导入**：导出为强制加密的 .dsync.enc；导入需要导出口令。
- **删除用户数据**：可只删本机、只删仓库或两者都删；操作不可撤销。
- **备忘录**：在「备忘录」标签页按天记录、编辑、撤回或批量删除；内容写入用户的 memo 文件夹。
- **卸载插件**：移除本机插件和入口，并清空本机插件数据（登录、设置、备份、备忘录）；不会删除这个仓库中的数据，也不会删除现有聊天。

## 故障排查

| 现象 | 可能原因与处理 |
|---|---|
| 仓库为空，无法拉取 | 还没有任何设备提交过；先点击「提交最新记录」，或等待首次授权同步 |
| 提示公开仓库 | 到 Gitee/GitHub 仓库设置中把仓库改为私有，再重新检查 |
| 提示 remote-ahead | 其他设备已经提交了新版本；先检查更新，确认后再强制覆盖 |
| 加密包无法打开 | 输入正确口令；忘记口令时用同一账号的恢复文件，或重新登录后恢复 |
| 单包过大 | 减少选中的会话；单包上限约 100 MB |
| 会话被跳过 | 该会话正在当前 DSH 实例中使用；结束会话后再拉取 |
| 令牌权限不足 | 重新创建令牌，Gitee 至少勾选 projects，GitHub Classic 至少 repo |

## 限制

- 保存的是 DSH 原始会话日志，不做事件级合并。
- 不会重写或清理 Git 历史；删除文件只会产生新的删除提交。
- 不同设备同时修改同一会话时，以最后推送/拉取策略为准，可能产生冲突提示。
- 工作区路径按原样保存，不保证跨机器路径完全一致。
- 插件只负责本机打包、上传、下载和恢复；仓库的访问控制由平台账号负责。

## 相关链接

- 插件仓库与安装说明：<https://gitee.com/user_gitee/dsh-chat-sync>
- 增量同步设计调研：<https://gitee.com/user_gitee/dsh-chat-sync/blob/master/docs/INCREMENTAL.md>
- Gitee 个人访问令牌：<https://gitee.com/profile/personal_access_tokens>
- GitHub 个人访问令牌：<https://github.com/settings/tokens>

---

最后更新：由 dsh-chat-syncer 自动写入。你可以手动编辑此 README；插件只会在新建仓库或 README 缺失时补写。
`;
}
