window.__ModuleLoader__.load({
  id: 'dsh-chat-syncer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'dsh-chat-syncer';
    const PANEL_ID = 'dsh-chat-syncer';
    const PACKAGE_NAME = 'dsh-chat-syncer';
    const API = '/dsh-chat-syncer/api';
    const VERSION = '0.15.0';

    /* ------------------------------------------------------------------ */
    /* Copy                                                               */
    /* ------------------------------------------------------------------ */

    const zh = {
      'panel.label': '多端会话同步助手',
      'page.eyebrow': 'DSH · 私有仓库同步',
      'page.title': '多端会话同步助手',
      'page.subtitle': '把会话备份到你自己的 Gitee / GitHub 私有仓库，在另一台设备上按同一份共享快照比较、拉取。插件只负责传输，不掌握内容。',
      'page.version': 'v{version}',
      'login.title': '连接你的仓库账号',
      'login.subtitle': '使用平台个人访问令牌登录。令牌只保存在本机，不会发送给插件作者或任何第三方。',
      'login.provider': '仓库平台',
      'login.gitee': 'Gitee',
      'login.github': 'GitHub',
      'login.giteeNote': '国内网络推荐首选，访问更稳定。',
      'login.githubNote': '需要能创建私有仓库的令牌；部分网络环境下可能较慢。',
      'login.giteeRecommend': '国内推荐',
      'login.networkHint': '国内网络建议优先使用 Gitee；如果你所在网络访问 GitHub 较慢，请直接选 Gitee。',
      'login.permissionsTitle': '令牌至少需要这些权限',
      'login.permissionsGitee': 'Gitee：projects（仓库读写 + 创建私有仓库）',
      'login.permissionsGithub': 'GitHub Classic：repo；Fine-grained：Contents 读写 + Administration 读写',
      'login.permissionChecking': '正在检查令牌权限…',
      'login.token': '访问令牌',
      'login.tokenPlaceholder': '粘贴访问令牌',
      'login.show': '显示',
      'login.hide': '隐藏',
      'login.tokenLink': '去创建令牌',
      'login.tokenStepTitle': '先创建访问令牌',
      'login.tokenStepDesc': '前往 {provider} 创建一个有仓库权限的令牌；创建后复制，回到这里粘贴。',
      'login.createToken': '去 {provider} 创建令牌',
      'login.tokenPasteLabel': '粘贴刚刚创建的令牌',
      'login.tokenHint': '{hint}',
      'login.repo': '仓库名',
      'login.repoPlaceholder': 'dsh-chat-syncer-data',
      'login.repoHint': '默认创建 dsh-chat-syncer-data 私有仓库；如果已存在且为私有，会直接使用，旧名的 dsh-chat-sync-data 也会继续复用。',
      'login.submit': '登录并创建私有仓库',
      'login.working': '正在连接…',
      'login.legal': '登录只连接仓库；上传会话前会单独展示数据上传协议并请你勾选同意，不签署不会上传。',
      'login.error': '登录失败',
      'login.success': '已连接 {repo}',
      'login.repoCreated': '已自动创建私有仓库 {repo}',
      'login.tokenRequired': '请先粘贴访问令牌',
      'login.privacy': '令牌保存在本机凭据存储或权限受限的本地文件中，不会写入会话记录。',
      'status.synced': '已同步',
      'status.behind': '仓库有更新',
      'status.localAhead': '本机有更新',
      'status.localAheadDesc': '本机会话有未提交的变更；可以点“提交最新记录”推送到仓库。',
      'status.divergedDesc': '仓库和本机都有新变更；建议先检查仓库内容，再决定拉取或覆盖提交。',
      'status.diverged': '两边都有更新',
      'status.smartPaused': '智能同步已暂停',
      'status.smartPausedDesc': '连续两次定时提交没有变化，已暂停定时同步；下次打开 DSH 或会话完成后自动恢复。',
      'status.empty': '待首次提交',
      'status.syncing': '同步中…',
      'status.error': '需要注意',
      'status.local': '本机已连接',
      'status.offline': '未连接',
      'hero.account': '当前账号',
      'hero.device': '本机设备',
      'hero.repo': '私有仓库',
      'hero.openRepo': '打开仓库',
      'hero.syncValue': '共同同步值',
      'hero.lastCheck': '上次检查',
      'hero.lastPush': '上次提交',
      'hero.never': '尚未',
      'hero.private': '私有',
      'hero.branch': '分支 {branch}',
      'actions.check': '检查会话更新',
      'actions.push': '提交最新记录',
      'actions.downloadLatest': '下载最近记录',
      'actions.checking': '正在检查会话…',
      'actions.pushing': '提交中…',
      'actions.refresh': '刷新状态',
      'actions.later': '稍后',
      'actions.cancel': '取消',
      'actions.close': '关闭',
      'actions.confirm': '确认',
      'actions.save': '保存',
      'actions.saving': '保存中…',
      'actions.retry': '重试',
      'actions.reload': '刷新页面',
      'actions.open': '打开',
      'actions.manage': '管理',
      'actions.edit': '修改',
      'actions.unlock': '解锁',
      'actions.download': '导出',
      'actions.upload': '导入',
      'actions.delete': '删除',
      'actions.agree': '同意并继续',
      'actions.updateNow': '立即更新',
      'actions.overwrite': '仍然覆盖提交',
      'actions.forcePull': '强制重新拉取',
      'stats.title': '最近提交快照',
      'stats.sessions': '会话',
      'stats.workspaces': '工作区',
      'stats.sourceBytes': '原始大小',
      'stats.packageBytes': '包大小',
      'stats.unit': '个',
      'settings.title': '同步设置',
      'settings.subtitle': '会话完成（turn/end）后会自动排队提交；也可以随时手动提交。',
      'settings.auto': '会话完成后自动提交',
      'settings.autoDesc': '默认开启。每次会话结束约 5 秒后，把最新会话日志更新到公共目录并刷新共同同步值。',
      'settings.smart': '智能同步',
      'settings.smartDesc': '默认开启。定时提交连续两次没有变化后自动暂停，直到下次打开 DSH 或会话完成。关闭后按固定间隔一直检查。',
      'settings.scheduled': '定时提交',
      'settings.scheduledDesc': '默认开启。到达时间间隔后自动提交；没有变化时不会产生提交。',
      'settings.interval': '定时间隔',
      'settings.intervalDesc': '默认 3 小时；可选 10 分钟到 24 小时。',
      'interval.10m': '10 分钟',
      'interval.20m': '20 分钟',
      'interval.30m': '30 分钟',
      'interval.1h': '1 小时',
      'interval.3h': '3 小时（默认）',
      'interval.6h': '6 小时',
      'interval.12h': '12 小时',
      'interval.24h': '24 小时',
      'tabs.sync': '同步',
      'tabs.memo': '备忘录',
      'tabs.settings': '设置',
      'memo.title': '备忘录',
      'memo.subtitle': '按天记录想法和对话要点，数据同步到仓库的 memo 文件夹。',
      'memo.count': '条',
      'memo.loading': '正在读取备忘录…',
      'memo.empty': '还没有备忘录',
      'memo.emptyDesc': '在下面输入框写下第一条，按天自动分组。',
      'memo.placeholder': '写点什么… Ctrl+Enter 发送',
      'memo.add': '添加',
      'memo.added': '已添加备忘录',
      'memo.edit': '编辑',
      'memo.copy': '复制',
      'memo.copyFailed': '复制失败',
      'memo.delete': '删除',
      'memo.deleteSelected': '删除选中 {count} 条',
      'memo.cancelSelection': '取消选择',
      'memo.selectAll': '全选',
      'memo.withdraw': '撤回',
      'memo.restore': '恢复',
      'memo.withdrawn': '已撤回',
      'memo.withdrawnText': '这条内容已撤回',
      'memo.select': '选择备忘录',
      'memo.clear': '全部删除',
      'memo.clearTitle': '删除全部备忘录？',
      'memo.clearDesc': '会删除本机和仓库 memo 文件夹中的所有备忘录，不影响聊天记录。',
      'memo.clearConfirm': '全部删除',
      'memo.dayCount': '{count} 条',
      'memo.hint': '数据保存在 users/<账号>/memo/memo.json',
      'settings.nav.account': '账号与设备',
      'settings.nav.sync': '同步策略',
      'settings.nav.encryption': '加密与安全',
      'settings.nav.data': '数据管理',
      'settings.nav.legal': '协议与隐私',
      'settings.nav.maintenance': '版本与维护',
      'settings.nav.about': '关于',
      'settings.section.aboutDesc': '版本、本机用户、仓库用户和项目链接。',
      'about.tagline': '把会话、备忘录和版本记录放进你自己的私有仓库。',
      'about.desc': 'DSH 多端会话同步助手是一个本地优先的 Gitee / GitHub 私有仓库同步插件。会话和备忘录由你掌控，插件只负责传输。',
      'about.author': '作者',
      'about.authorDesc': 'XAF · 独立开发者，DSH 多端会话同步助手插件作者。',
      'about.version': '当前版本',
      'about.dshUser': '当前 DSH 本机用户',
      'about.repoUser': '当前仓库账号',
      'about.repo': '数据仓库',
      'about.pluginRepo': '插件仓库',
      'about.dataRepo': '打开数据仓库',
      'about.incremental': '增量设计',
      'about.license': 'AGPL-3.0 License · 会话与备忘录保存在你的仓库中，插件不运营云端存储。',
      'settings.section.accountDesc': '管理当前账号、显示名和本机设备名。',
      'settings.section.syncDesc': '选择覆盖或增量，并设置会话完成、定时提交。',
      'settings.section.encryptionDesc': '整包 AES-256 加密、解锁和账号找回。',
      'settings.section.dataDesc': '导出、导入和重命名用户数据。',
      'settings.section.legalDesc': '查看已签署协议和隐私说明。',
      'settings.section.maintenanceDesc': '插件版本、自动更新和卸载。',
      'actions.loading': '加载中…',
      'history.title': 'Git 提交记录',
      'history.subtitle': '云端版本由 Git 提交管理；这里对比本地同步值与最近提交。',
      'history.refresh': '刷新记录',
      'history.loading': '正在读取提交记录…',
      'history.empty': '还没有提交记录',
      'history.open': '打开',
      'backup.title': '本地备份与恢复',
      'backup.subtitle': '覆盖前会自动备份旧会话；这里可以查看并恢复最近备份。',
      'backup.empty': '还没有本地备份',
      'backup.refresh': '刷新备份',
      'backup.restore': '恢复',
      'backup.restoreTitle': '恢复这个备份？',
      'backup.restoreDesc': '会把备份中的会话文件写回本机；正在使用的会话会跳过。',
      'backup.restoreConfirm': '恢复备份',
      'backup.restored': '已恢复 {count} 个文件',
      'backup.count': '{count} 个文件',
      'maintenance.clear': '清空插件数据',
      'maintenance.clearDesc': '删除本机插件存储的登录状态、历史账号、设置、备份和备忘录；不会删除现有聊天或仓库数据。',
      'maintenance.clearAction': '清空数据',
      'maintenance.clearTitle': '清空本机插件数据？',
      'maintenance.cleared': '本机插件数据已清空',
      'maintenance.initialize': '初始化插件',
      'maintenance.initializeDesc': '恢复到新电脑刚安装的默认设置，但保留当前仓库登录状态；不会删除现有聊天或仓库数据。',
      'maintenance.initializeAction': '初始化',
      'maintenance.initializeTitle': '初始化插件？',
      'maintenance.initialized': '插件已初始化，登录状态已保留',
      'settings.section.danger': '危险操作',
      'settings.section.expand': '展开',
      'settings.section.collapse': '收起',
      'settings.syncMode': '同步方式',
      'settings.syncModeDesc': '推送和下载都默认增量：只补缺失与会更新的会话，保留双方其他记录。只有你明确点「强制覆盖」时才会用本机快照替换公共快照，或把本机同路径会话换成仓库版本。',
      'tabs.repair': '修改会话',
      'errors.unknownAction': '宿主进程还在运行旧版本（界面已是 {client}）。请完全退出 DSH 后再启动；只刷新页面不会更新宿主。',
      'versions.title': '历史版本',
      'picker.title': '选择要下载的会话',
      'picker.desc': '默认全选。取消勾选的会话不会写入本机；附件仍会完整校验。',
      'picker.all': '全选',
      'picker.none': '全不选',
      'picker.download': '下载 {count} 个会话',
      'picker.encrypted': '这个版本已加密，仓库里没有明文清单，只能整包下载。',
      'picker.empty': '仓库里没有可下载的会话清单',
      'picker.loading': '读取会话清单…',
      'picker.group': '{count} 个会话',
      'picker.noneSelected': '至少选择一个会话',
      'versions.desc': '仓库最近 3 次提交里的同步快照。下载会把当时的会话写回本机；同步位置保持不变，之后仍可正常推送。',
      'versions.load': '加载历史版本',
      'versions.loading': '加载中…',
      'versions.empty': '仓库里没有可下载的历史版本',
      'versions.incremental': '增量下载',
      'versions.force': '强制下载',
      'versions.done': '已恢复 {count} 个会话，请刷新会话列表',
      'versions.sessions': '{count} 个会话',
      'versions.forceTitle': '确认强制下载',
      'versions.forceBody': '强制下载会用这个版本的快照覆盖本机同路径会话（先备份），本机比它新的改动会丢。',
      'versionMismatch': '宿主运行的是 {host}，界面是 {client}。两者不一致时部分按钮会报“未知操作”，请完全退出 DSH 后重新启动。',
      'repair.title': '修复附件缺失',
      'repair.desc': '同步包现在会带上图片等附件；更早同步过来的会话可能引用本机没有的文件，续聊时会在请求准备阶段直接失败。先扫描看看有多少处，再决定是否修复。',
      'repair.scan': '扫描缺失附件',
      'repair.scanning': '扫描中…',
      'repair.repair': '修复缺失引用',
      'repair.repairing': '修复中…',
      'repair.summary': '扫描 {scanned} 个会话，发现 {sessions} 个会话共 {blocks} 处缺失引用',
      'repair.none': '扫描 {scanned} 个会话，没有发现缺失引用',
      'repair.item': '{count} 处',
      'repair.done': '已修复 {sessions} 个会话，替换 {blocks} 处引用，备份 {backups} 个文件',
      'repair.note': '修复会把缺失的图片引用替换成占位文本，原会话文件先备份到 backups 目录。修复后请重开该会话或重启 DSH。',
      'reg.title': '会话登记与缓存',
      'reg.desc': '会话文件在、但工作区注册表里没登记（或投影缓存是在文件损坏时生成的）时，侧栏里会看不到内容。修复会按会话头的工作目录重新登记，并清掉对应缓存。',
      'reg.scan': '扫描登记状态',
      'reg.scanning': '扫描中…',
      'reg.repair': '修复登记',
      'reg.repairing': '修复中…',
      'reg.summary': '共 {sessions} 个会话：{unregistered} 个未登记，{missing} 个工作区缺失',
      'reg.none': '共 {sessions} 个会话，登记完整',
      'reg.done': '已登记 {repaired} 个会话，清理缓存 {cleared} 个；重启 DSH 后生效',
      'reg.unavailable': '这个环境没有工作区注册表（宿主不可用），无法登记',
      'reg.confirmTitle': '确认修复会话登记',
      'reg.confirmBody': '将按会话头的工作目录重新登记 {count} 个会话，并清理它们的投影缓存；完成后需要重启 DSH。',
      'reg.note': '登记信息由 DSH 的工作区注册表维护；本操作只补登记和清缓存，不改写会话内容。',
      'repair.confirmTitle': '确认修复',
      'repair.confirmDesc': '这一步会改写本机的会话文件',
      'repair.confirmBody': '将改写 {sessions} 个会话、替换 {blocks} 处引用，原文件会先备份。',
      'repair.confirmRun': '开始修复',
      'forceGuard.title': '本机还有未推送的更新',
      'forceGuard.desc': '强制覆盖下载会用仓库版本替换本机同路径的会话',
      'forceGuard.hint': '建议先增量推送，把本机独有的会话合并到云端，再强制下载；否则这些更新会丢。',
      'forceGuard.pushFirst': '先增量推送，再强制下载',
      'forceGuard.overwrite': '直接强制覆盖',
      'forceGuard.done': '已先增量推送，再强制下载',
      'attachments.title': '修复附件缺失',
      'attachments.desc': '同步包现在会带上图片等附件；早期同步过来的会话可能引用本机没有的附件，续聊时会在请求准备阶段直接失败。这里把这类引用替换成占位文本（原会话文件先备份）。',
      'attachments.action': '检查并修复',
      'attachments.running': '修复中…',
      'attachments.repaired': '已修复 {sessions} 个会话，替换 {blocks} 处缺失引用',
      'attachments.none': '没有发现缺失的附件引用',
      'attachments.last': '上次检查：扫描 {scanned} 个会话，修复 {sessions} 个，替换 {blocks} 处',
      'settings.overwrite': '强制覆盖',
      'settings.incremental': '增量（默认）',
      'settings.name': '用户显示名',
      'settings.nameDesc': '只改变显示名称，不会移动仓库中的用户目录。',
      'settings.device': '本机设备名',
      'device.edit': '编辑',
      'device.details': '查看设备详情',
      'device.hideDetails': '收起设备详情',
      'device.user': '系统用户',
      'device.username': '用户名',
      'device.hostname': '主机名',
      'device.name': '设备名',
      'device.check': '保存这一项',
      'device.readOnly': '只读',
      'device.host': '主机名',
      'device.mac': 'MAC',
      'device.ip': 'IP',
      'device.os': '系统',
      'device.fingerprint': '设备指纹',
      'device.osVersion': '系统版本',
      'device.uniqueId': '唯一标识',
      'settings.deviceDesc': '默认显示系统用户、主机名和系统架构；MAC/IP 可在设备详情中查看。点击编辑可分别修改用户名、主机名和设备名。',
      'settings.saved': '设置已保存',
      'settings.agreementRequired': '协议未签署，自动提交已暂停。请先阅读并同意数据上传协议。',
      'encryption.title': '加密扩展',
      'encryption.subtitle': '默认不加密。开启后整个同步包使用 AES-256-GCM 加密，仓库中只有密文。',
      'encryption.on': '已开启',
      'encryption.off': '未开启',
      'encryption.locked': '已锁定',
      'encryption.unlocked': '已解锁',
      'encryption.algorithm': 'AES-256-GCM',
      'encryption.enable': '开启加密',
      'encryption.disable': '关闭加密',
      'encryption.change': '修改口令',
      'encryption.recover': '通过账号找回',
      'encryption.unlockAction': '输入口令解锁',
      'encryption.enableTitle': '开启 AES-256 加密',
      'encryption.enableDesc': '设置一个至少 8 位的口令。口令不会被保存；忘记后可通过当前仓库账号找回。',
      'encryption.passphrase': '加密口令',
      'encryption.confirm': '再次输入口令',
      'encryption.old': '当前口令',
      'encryption.new': '新口令',
      'encryption.recoverTitle': '通过账号找回口令',
      'encryption.recoverDesc': '插件会读取当前私有仓库中的账号恢复文件，用已登录账号解开数据密钥，然后让你设置新口令。',
      'encryption.recoveryNote': '恢复文件保存在你的私有仓库里；能访问该仓库的账号即可恢复。请不要把仓库改为公开。',
      'encryption.enabledToast': '加密已开启；下次提交会写入密文包',
      'encryption.disabledToast': '加密已关闭；下次提交会写入明文包',
      'encryption.unlockedToast': '已解锁，可以同步加密包',
      'encryption.changedToast': '口令已更新',
      'encryption.recoveredToast': '已通过账号恢复密钥，请使用新口令',
      'encryption.disableTitle': '关闭加密？',
      'encryption.disableDesc': '关闭后，下一次提交会写入明文包。仓库里已有的加密快照不会被自动删除。',
      'encryption.disableConfirm': '关闭加密',
      'encryption.lockedDesc': '同步已加密，需要口令才能拉取或自动提交。',
      'encryption.passphraseRequired': '请输入口令',
      'data.title': '用户数据',
      'data.subtitle': '导出、导入、重命名或删除保存在仓库中的用户数据。',
      'data.export': '导出数据',
      'data.exportDesc': '打包当前用户目录下的会话与账号资料，强制加密后保存。',
      'data.import': '导入数据',
      'data.importDesc': '从加密 .dsync.enc 包恢复会话；账号仍需要重新登录。',
      'data.rename': '重命名',
      'data.renameDesc': '修改本机与仓库中的用户显示名。',
      'data.delete': '删除用户数据',
      'data.deleteDesc': '可只删本机，或同时删除仓库中的用户目录。此操作不可撤销。',
      'data.exportTitle': '导出用户数据',
      'data.exportDescLong': '导出包含会话日志、用户资料和协议记录，不包含访问令牌。整个压缩包会强制使用 AES-256 加密。',
      'data.exportEncrypt': '使用 AES-256 加密导出',
      'data.exportPassphrase': '导出口令（至少 8 位）',
      'data.exportPassphraseShort': '导出口令至少需要 8 个字符',
      'data.exportEncryptedTitle': '导出包强制加密',
      'data.exportEncryptedDesc': '所有会话会先打成压缩包，再用 AES-256-GCM 加密整个包；文件名和内容都不会明文出现。口令不会保存，请自行牢记。',
      'data.importNeedsPassphrase': '请输入导出时设置的口令',
      'data.exportAction': '生成并下载',
      'data.exporting': '正在打包…',
      'data.importTitle': '导入用户数据',
      'data.importDescLong': '选择之前导出的 .dsync.enc 文件并输入导出时的口令。正在使用的会话不会被覆盖。',
      'data.chooseFile': '选择文件',
      'data.noFile': '尚未选择文件',
      'data.importPassphrase': '导出口令（必填）',
      'data.importAction': '导入',
      'data.importing': '正在导入…',
      'data.imported': '已导入 {count} 个变更',
      'data.importedNone': '没有新的会话需要导入',
      'data.importedProfile': '账号资料已写入本机用户目录',
      'data.deleteTitle': '删除用户数据',
      'data.deleteDescLong': '删除后无法撤销。建议先导出一份备份。',
      'data.deleteScope': '删除范围',
      'data.deleteLocal': '只删除本机数据',
      'data.deleteRemote': '只删除仓库中的用户目录',
      'data.deleteBoth': '本机与仓库都删除',
      'data.deleteConfirm': '请输入“删除”以确认',
      'data.deletePlaceholder': '删除',
      'data.deleteAction': '确认删除',
      'data.deleting': '正在删除…',
      'data.deleted': '用户数据已删除',
      'data.exported': '导出文件已开始下载',
      'data.fileTooLarge': '文件超过 100 MB 限制',
      'data.readError': '无法读取这个文件',
      'legal.title': '协议与隐私',
      'legal.signed': '已签署 · {date}',
      'legal.unsigned': '尚未签署',
      'legal.view': '查看协议',
      'legal.viewSigned': '查看已签协议',
      'legal.uploadGate': '签署前不会上传任何会话。',
      'legal.localOnly': '本插件不运营服务器，不收集会话内容；所有上传都发往你选择的仓库平台。',
      'legal.privateWarning': '请确认仓库是私有的。公开仓库会泄露你的会话内容。',
      'agreement.readOnlyTitle': '已签署的数据上传协议',
      'agreement.readOnlySubtitle': '签署于 {date}。以下是当时同意的版本化协议文本。',
      'agreement.signedRecord': '已签署 · 版本 {version} · {date}',
      'agreement.title': '数据上传同意书',
      'agreement.subtitle': '上传前请阅读并勾选同意。拒绝后不会上传任何会话。',
      'agreement.checkbox': '我已阅读并同意上述内容，自愿将本机会话上传到我自己的私有仓库。',
      'agreement.accept': '同意并继续',
      'agreement.decline': '暂不同意',
      'agreement.accepted': '协议已记录',
      'agreement.withdraw': '撤回协议',
      'agreement.withdrawTitle': '撤回数据上传协议？',
      'agreement.withdrawDesc': '撤回后会退出当前登录并回到未登录状态，同步、推送等功能将不可用。仓库中已上传的数据不会被删除。',
      'agreement.withdrawConfirm': '撤回并退出',
      'agreement.withdrawn': '协议已撤回，已退出登录',
      'agreement.requiredToast': '请先签署数据上传协议',
      'update.title': '有新的会话更新',
      'update.subtitle': '仓库里的会话同步值与本机记录不同。你可以立即更新，也可以暂不更新。',
      'update.remote': '仓库版本',
      'update.local': '本机已确认',
      'update.device': '来自设备',
      'update.sessions': '{count} 个会话',
      'update.encrypted': '加密包',
      'update.plain': '明文包',
      'update.when': '提交于 {time}',
      'update.pullAction': '立即更新',
      'update.pulling': '正在下载并应用…',
      'update.later': '暂不更新',
      'update.done': '已更新 {count} 个会话',
      'update.none': '没有需要更新的会话',
      'update.overwriteWarning': '覆盖模式会覆盖本机同路径会话',
      'update.overwriteBackup': '覆盖前，插件会把本机旧文件备份到本地 backups 目录，可在设置中恢复；正在使用的会话会跳过。',
      'update.overwriteConfirm': '我已知晓并同意覆盖本机同路径会话（覆盖前自动备份）',
      'update.passphrase': '这个快照已加密，请输入口令',
      'update.conflict': '有 {count} 个会话本机更新或正在使用，已保留本机版本；其余已与仓库对齐，可以直接推送。',
      'update.workspaceMissing': '{count} 个会话的原始工作区目录无法自动创建，侧栏无法显示：{paths}',
      'update.workspaceCreated': '已为 {count} 个会话新建工作区目录：{paths}',
      'update.workspaceRepair': '重新登记',
      'update.workspaceRepaired': '已把这 {count} 个会话登记到侧栏工作区',
      'update.workspaceStillMissing': '仍有 {count} 个会话的工作区目录不存在，建好目录后再点「重新登记」',
      'update.reloadHint': '会话文件已写入。刷新页面后，左侧会话列表才能看到新会话。',
      'update.upToDate': '会话已是最新',
      'update.emptyRepo': '仓库目前还没有会话快照。请先点击“提交最新记录”，把本机选中的会话提交上去。',
      'update.emptyRepoHint': '可以只勾选一个会话先做冒烟测试，确认链路正常后再全选提交。',
      'push.title': '选择要提交的会话',
      'push.subtitle': '默认全选。取消勾选即可只上传单个或部分会话。',
      'push.loading': '正在读取本机会话…',
      'push.selectAll': '全选',
      'push.selected': '已选 {count} 个会话',
      'push.live': '使用中',
      'push.none': '本机没有可提交的会话',
      'push.noneDesc': '先产生一个会话，再回来提交。',
      'push.submit': '提交选中的 {count} 个会话',
      'push.progress.prepare': '准备同步…',
      'push.progress.package': '打包并压缩会话…',
      'push.progress.upload': '上传到私有仓库…',
      'push.progress.head': '写入同步值并校验…',
      'push.progress.done': '同步完成',
      'push.progress.hint': '上传大包时进度会在 90% 停留，完成后自动跳到 100%。',
      'push.passphrase': '加密口令',
      'update.checkFailed': '检查更新失败',
      'overwrite.title': '仓库已有新版本',
      'overwrite.desc': '另一个设备先提交了。直接覆盖会把它写入公共目录的最新值替换为你的本机快照；建议先检查并更新。',
      'overwrite.force': '仍然覆盖提交',
      'overwrite.cancel': '先检查更新',
      'push.mode.label': '推送方式',
      'push.mode.force': '强制覆盖',
      'push.mode.forceDesc': '用选中的会话替换公共快照；仓库里独有、这次没选的会话会从最新值里消失。',
      'push.mode.incremental': '增量合并',
      'push.mode.incrementalDesc': '保留远端其他会话，只把这些选中的会话合并进去。',
      'push.mode.autoIncremental': '未全选，已自动切换为增量合并。',
      'push.pullRequired': '仓库已有其他设备提交的新版本。强制覆盖会替换云端快照，请先拉取到最新；直接改用「增量合并」则不需要。',
      'push.pullThenPush': '先增量拉取，再强制覆盖',
      'pull.incremental': '增量拉取',
      'pull.force': '强制覆盖本地',
      'pull.forceHint': '增量拉取只补缺失和远端更新的会话；强制覆盖会用仓库快照替换本机同路径会话（先自动备份）。',
      'busy.banner': '正在与仓库通信，请稍候…',
      'error.title': '操作失败',
      'error.loginRequired': '请先登录',
      'error.agreementRequired': '请先签署协议',
      'error.encryptionLocked': '加密已锁定',
      'error.remoteAhead': '仓库已有新版本',
      'error.noRecovery': '仓库中没有恢复文件',
      'error.network': '网络连接失败',
      'toast.copied': '已复制',
      'toast.closed': '已关闭',
      'toast.exported': '导出已生成',
      'toast.imported': '导入完成',
      'toast.updated': '已更新',
      'toast.pushed': '已提交到仓库',
      'toast.noChanges': '没有新的会话变更',
      'toast.upToDate': '已经是最新会话',
      'checkResult.title': '检查会话更新',
      'checkResult.subtitle': '已读取仓库最新同步值，并比较本机会话。',
      'checkResult.same': '本机会话与仓库快照一致，没有需要拉取的更新。',
      'checkResult.remoteDesc': '仓库有新的会话快照，可以下载最近记录。',
      'plugin.summaryOn': '已连接 · {repo}',
      'plugin.summaryOff': '未登录',
      'account.title': '账号',
      'account.subtitle': '本机保存多个 Gitee/GitHub 登录记录；退出后可随时切换回来。',
      'account.current': '当前登录',
      'account.dshUser': '当前 DSH 本机用户',
      'account.repoUser': '当前仓库账号',
      'account.others': '本机历史账号',
      'account.none': '暂无其他历史账号',
      'account.switch': '切换',
      'account.switched': '已切换到 {name}',
      'account.logout': '退出登录',
      'account.add': '退出后登录其他账号',
      'account.remove': '删除记录',
      'account.removeTitle': '删除历史登录用户？',
      'account.removeDesc': '只删除本机保存的登录令牌和用户资料，不会删除仓库中的同步数据。',
      'account.removeConfirm': '删除本机记录',
      'account.removed': '已删除本机登录记录',
      'account.keepData': '仓库数据不会被删除；如需删除请使用“删除用户数据”。',
      'account.hint': '退出登录只清除当前活动账号，本机仍保留历史账号，可切换回来。',
      'pluginUpdate.title': '版本与更新',
      'pluginUpdate.subtitle': '从 Gitee 仓库检查插件更新。默认不自动更新，可改为提醒或自动安装。',
      'pluginUpdate.current': '当前版本 v{version}',
      'pluginUpdate.check': '检查插件更新',
      'pluginUpdate.checking': '检查中…',
      'pluginUpdate.upToDate': '已是最新版本',
      'pluginUpdate.upToDateDetail': '当前版本 v{version}，已是最新版本。',
      'pluginUpdate.available': '发现新版本 v{version}',
      'pluginUpdate.auto': '自动更新',
      'pluginUpdate.autoDesc': '关闭时只在你点击时检查；提醒模式只弹窗；自动安装模式会直接下载并替换文件。',
      'pluginUpdate.autoOff': '不自动更新（默认）',
      'pluginUpdate.autoPrompt': '发现新版本时提醒我',
      'pluginUpdate.autoInstall': '自动下载并更新',
      'pluginUpdate.modalTitle': '插件有新版本 v{version}',
      'pluginUpdate.modalDesc': '当前 v{current}。更新会替换插件运行文件，不会动你的会话或用户数据。',
      'pluginUpdate.install': '立即更新',
      'pluginUpdate.installing': '正在下载并应用…',
      'pluginUpdate.installed': '已更新到 v{version}。请重启 DSH 让 Host 代码生效；页面刷新只能更新客户端界面。',
      'pluginUpdate.failed': '更新失败：{reason}',
      'pluginUpdate.later': '稍后',
      'pluginUpdate.restartNow': '立即重启 DSH',
      'pluginUpdate.restarting': '正在重启…',
      'pluginUpdate.restartFailed': '无法自动重启（{error}）。请手动完全退出 DSH（含托盘）后重新打开。',
      'pluginUpdate.restart': '新版本已写入磁盘，但宿主进程仍在跑旧代码：请完全退出 DSH（含托盘）再打开，或用菜单里的「重启应用宿主」。检测到新宿主后本页会自动刷新。',
      'pluginUpdate.repo': '打开 Gitee 仓库',
      'pluginUpdate.autoFailed': '自动更新检查失败',
      'uninstall.title': '插件维护',
      'uninstall.subtitle': '一键卸载多端会话同步助手，并检查插件清单里是否已清理干净。',
      'uninstall.warning': '卸载插件不会删除仓库数据',
      'uninstall.desc': '卸载只会移除本机插件与侧栏入口；你仓库中的用户目录、会话快照和恢复文件不会被删除。',
      'uninstall.button': '卸载插件',
      'uninstall.confirmTitle': '确定卸载多端会话同步助手？',
      'uninstall.confirmDesc': '卸载会移除本机插件和入口，并清空插件本地数据（登录状态、设置、备份、备忘录）；不会删除现有聊天或仓库数据。',
      'uninstall.confirm': '确认卸载',
      'uninstall.busy': '正在卸载…',
      'uninstall.cancelled': '卸载已取消。',
      'uninstall.done': '已卸载，正在刷新页面…',
      'uninstall.failedGeneric': '未知错误',
      'uninstall.restart': '卸载命令已执行，请重启 DSH 完成清理。',
      'uninstall.partial': '卸载后仍检测到插件条目',
      'uninstall.partialDesc': '可能需要在插件管理页手动移除，或重启 DSH 后再次检查。',
      'uninstall.opened': '已打开插件管理页，请在那里确认卸载。',
      'uninstall.noManager': '没有找到插件管理入口，请在左侧“插件”页手动卸载。',
      'uninstall.keepData': '本机聊天不受影响；仓库数据也不会被删除。',
      'pluginManager.open': '打开插件管理',
      'plugin.open': '打开多端会话同步助手',
      'plugin.title': '多端会话同步助手',
      'unit.seconds': ' 秒',
      'reload.title': '需要刷新页面',
      'reload.desc': '新的会话文件已经写入本机。刷新页面后，DSH 才会重新扫描会话列表。',
      'common.unknown': '未知',
      'common.loading': '加载中…',
      'common.never': '尚未',
      'common.justNow': '刚刚',
      'common.minutesAgo': '{count} 分钟前',
      'common.hoursAgo': '{count} 小时前',
      'common.daysAgo': '{count} 天前',
    };

    const en = {
      'panel.label': 'Multi-device session sync',
      'page.eyebrow': 'DSH · PRIVATE REPOSITORY SYNC',
      'page.title': 'Multi-device session sync',
      'page.subtitle': 'Back up sessions to your own private Gitee / GitHub repository, compare against one shared snapshot, and pull it on another device. The plugin only transports; it never owns your content.',
      'page.version': 'v{version}',
      'login.title': 'Connect your repository account',
      'login.subtitle': 'Sign in with a personal access token. The token stays on this machine and is never sent to the plugin author or a third party.',
      'login.provider': 'Repository platform',
      'login.gitee': 'Gitee',
      'login.github': 'GitHub',
      'login.giteeNote': 'Recommended for mainland China; usually the most reliable connection.',
      'login.githubNote': 'The token needs permission to create private repositories; connectivity can be slower in some networks.',
      'login.giteeRecommend': 'Recommended in China',
      'login.networkHint': 'For mainland China, prefer Gitee. If GitHub is slow on your network, choose Gitee.',
      'login.permissionsTitle': 'Minimum token permissions',
      'login.permissionsGitee': 'Gitee: projects (repository read/write + create private repos)',
      'login.permissionsGithub': 'GitHub Classic: repo; Fine-grained: Contents read/write + Administration read/write',
      'login.permissionChecking': 'Checking token permissions…',
      'login.token': 'Access token',
      'login.tokenPlaceholder': 'Paste an access token',
      'login.show': 'Show',
      'login.hide': 'Hide',
      'login.tokenLink': 'Create a token',
      'login.tokenStepTitle': 'Create an access token',
      'login.tokenStepDesc': 'Open {provider}, create a token with repository permissions, copy it, then paste it below.',
      'login.createToken': 'Create a {provider} token',
      'login.tokenPasteLabel': 'Paste the token you just created',
      'login.tokenHint': '{hint}',
      'login.repo': 'Repository name',
      'login.repoPlaceholder': 'dsh-chat-syncer',
      'login.repoHint': 'Creates the private repository dsh-chat-syncer-data by default; an existing private one is reused, including the legacy dsh-chat-sync-data.',
      'login.submit': 'Sign in and create private repo',
      'login.working': 'Connecting…',
      'login.legal': 'Signing in only connects the repository. Before any upload, the data-upload agreement is shown separately and requires your consent.',
      'login.error': 'Sign-in failed',
      'login.success': 'Connected to {repo}',
      'login.repoCreated': 'Created private repository {repo}',
      'login.tokenRequired': 'Paste an access token first',
      'login.privacy': 'The token is stored in the local credential store or a permission-restricted file, never in session logs.',
      'status.synced': 'Synced',
      'status.behind': 'Repository has updates',
      'status.localAhead': 'Local changes not pushed',
      'status.localAheadDesc': 'Local sessions have changes not pushed yet. Use “Push latest” to upload them.',
      'status.divergedDesc': 'Both the repository and this machine have new changes. Review the repository before pulling or forced push.',
      'status.diverged': 'Both sides have changes',
      'status.smartPaused': 'Smart sync paused',
      'status.smartPausedDesc': 'Two scheduled pushes had no changes; scheduled sync is paused until the next DSH start or session completion.',
      'status.empty': 'Ready for first push',
      'status.syncing': 'Syncing…',
      'status.error': 'Needs attention',
      'status.local': 'Connected',
      'status.offline': 'Not connected',
      'hero.account': 'Account',
      'hero.device': 'This device',
      'hero.repo': 'Private repository',
      'hero.openRepo': 'Open repository',
      'hero.syncValue': 'Shared sync value',
      'hero.lastCheck': 'Last checked',
      'hero.lastPush': 'Last pushed',
      'hero.never': 'Never',
      'hero.private': 'Private',
      'hero.branch': 'branch {branch}',
      'actions.check': 'Check session updates',
      'actions.push': 'Push latest records',
      'actions.checking': 'Checking sessions…',
      'actions.pushing': 'Pushing…',
      'actions.refresh': 'Refresh status',
      'actions.later': 'Later',
      'actions.cancel': 'Cancel',
      'actions.close': 'Close',
      'actions.confirm': 'Confirm',
      'actions.save': 'Save',
      'actions.saving': 'Saving…',
      'actions.retry': 'Retry',
      'actions.reload': 'Reload page',
      'actions.open': 'Open',
      'actions.manage': 'Manage',
      'actions.edit': 'Edit',
      'actions.unlock': 'Unlock',
      'actions.download': 'Export',
      'actions.upload': 'Import',
      'actions.delete': 'Delete',
      'actions.agree': 'Agree and continue',
      'actions.updateNow': 'Update now',
      'actions.overwrite': 'Overwrite anyway',
      'actions.forcePull': 'Pull again',
      'stats.title': 'Latest pushed snapshot',
      'stats.sessions': 'Sessions',
      'stats.workspaces': 'Workspaces',
      'stats.sourceBytes': 'Source size',
      'stats.packageBytes': 'Package size',
      'stats.unit': '',
      'settings.title': 'Sync settings',
      'settings.subtitle': 'A completed turn queues an automatic push; you can also push manually at any time.',
      'settings.auto': 'Push after a session turn ends',
      'settings.autoDesc': 'On by default. About 5 seconds after turn/end, the latest logs update the shared folder and sync value.',
      'settings.smart': 'Smart sync',
      'settings.smartDesc': 'On by default. Pauses scheduled pushes after two consecutive no-change runs, until the next DSH start or session completion. Turn off to keep checking at the fixed interval.',
      'settings.scheduled': 'Scheduled push',
      'settings.scheduledDesc': 'On by default. Pushes automatically at the chosen interval; no commit is created when nothing changed.',
      'settings.interval': 'Interval',
      'settings.intervalDesc': 'Defaults to 3 hours; choose from 10 minutes to 24 hours.',
      'interval.10m': '10 minutes',
      'interval.20m': '20 minutes',
      'interval.30m': '30 minutes',
      'interval.1h': '1 hour',
      'interval.3h': '3 hours (default)',
      'interval.6h': '6 hours',
      'interval.12h': '12 hours',
      'interval.24h': '24 hours',
      'tabs.sync': 'Sync',
      'tabs.memo': 'Memos',
      'tabs.settings': 'Settings',
      'memo.title': 'Memos',
      'memo.subtitle': 'A daily timeline of thoughts and conversation notes, stored in the repository memo folder.',
      'memo.count': 'items',
      'memo.loading': 'Loading memos…',
      'memo.empty': 'No memos yet',
      'memo.emptyDesc': 'Write the first one below; entries are grouped by day.',
      'memo.placeholder': 'Write something… Ctrl+Enter to add',
      'memo.add': 'Add',
      'memo.added': 'Memo added',
      'memo.edit': 'Edit',
      'memo.copy': 'Copy',
      'memo.copyFailed': 'Copy failed',
      'memo.delete': 'Delete',
      'memo.deleteSelected': 'Delete {count} selected',
      'memo.cancelSelection': 'Cancel selection',
      'memo.selectAll': 'Select all',
      'memo.withdraw': 'Withdraw',
      'memo.restore': 'Restore',
      'memo.withdrawn': 'Withdrawn',
      'memo.withdrawnText': 'This entry was withdrawn',
      'memo.select': 'Select memo',
      'memo.clear': 'Delete all',
      'memo.clearTitle': 'Delete all memos?',
      'memo.clearDesc': 'Deletes all memos from this machine and the repository memo folder; chats are untouched.',
      'memo.clearConfirm': 'Delete all',
      'memo.dayCount': '{count} items',
      'memo.hint': 'Stored at users/<account>/memo/memo.json',
      'settings.nav.account': 'Account & device',
      'settings.nav.sync': 'Sync policy',
      'settings.nav.encryption': 'Encryption',
      'settings.nav.data': 'Data',
      'settings.nav.legal': 'Agreement & privacy',
      'settings.nav.maintenance': 'Version & maintenance',
      'settings.nav.about': 'About',
      'settings.section.aboutDesc': 'Version, local user, repository user, and project links.',
      'about.tagline': 'Sessions, memos, and version records in your own private repository.',
      'about.desc': 'DSH Multi-device session sync is a local-first Gitee / GitHub private repository plugin. You own the sessions and memos; the plugin only transports them.',
      'about.author': 'Author',
      'about.authorDesc': 'XAF · independent developer and author of DSH Multi-device Session Sync.',
      'about.version': 'Version',
      'about.dshUser': 'Current DSH user',
      'about.repoUser': 'Repository account',
      'about.repo': 'Data repository',
      'about.pluginRepo': 'Plugin repository',
      'about.dataRepo': 'Open data repository',
      'about.incremental': 'Incremental design',
      'about.license': 'AGPL-3.0 License · Sessions and memos stay in your repository; the plugin runs no cloud storage.',
      'settings.section.accountDesc': 'Current account, display name, and this device name.',
      'settings.section.syncDesc': 'Overwrite or incremental, session-completion and scheduled pushes.',
      'settings.section.encryptionDesc': 'Whole-package AES-256 encryption, unlock, and recovery.',
      'settings.section.dataDesc': 'Export, import, and rename user data.',
      'settings.section.legalDesc': 'Signed agreement and privacy notes.',
      'settings.section.maintenanceDesc': 'Plugin version, auto-update, and uninstall.',
      'actions.loading': 'Loading…',
      'history.title': 'Git commit history',
      'history.subtitle': 'The cloud version is managed by Git commits; compare local sync values with recent commits.',
      'history.refresh': 'Refresh history',
      'history.loading': 'Loading commits…',
      'history.empty': 'No commits yet',
      'history.open': 'Open',
      'backup.title': 'Local backups and restore',
      'backup.subtitle': 'Old sessions are backed up before overwrite; recent backups can be restored here.',
      'backup.empty': 'No local backups yet',
      'backup.refresh': 'Refresh backups',
      'backup.restore': 'Restore',
      'backup.restoreTitle': 'Restore this backup?',
      'backup.restoreDesc': 'Writes the backed-up session files back to this machine; open sessions are skipped.',
      'backup.restoreConfirm': 'Restore backup',
      'backup.restored': 'Restored {count} file(s)',
      'backup.count': '{count} file(s)',
      'maintenance.clear': 'Clear plugin data',
      'maintenance.clearDesc': 'Deletes local plugin login state, saved accounts, settings, backups, and memos. Existing chats and repository data are untouched.',
      'maintenance.clearAction': 'Clear data',
      'maintenance.clearTitle': 'Clear local plugin data?',
      'maintenance.cleared': 'Local plugin data cleared',
      'maintenance.initialize': 'Initialize plugin',
      'maintenance.initializeDesc': 'Resets to a fresh install default while keeping the current repository login. Existing chats and repository data are untouched.',
      'maintenance.initializeAction': 'Initialize',
      'maintenance.initializeTitle': 'Initialize the plugin?',
      'maintenance.initialized': 'Plugin initialized; login preserved',
      'settings.section.danger': 'Danger zone',
      'settings.section.expand': 'Expand',
      'settings.section.collapse': 'Collapse',
      'settings.syncMode': 'Sync mode',
      'settings.syncModeDesc': 'Push and pull both default to incremental: only missing or updated sessions move, everything else is kept. The shared snapshot is replaced only when you explicitly choose “force overwrite”.',
      'tabs.repair': 'Sessions',
      'errors.unknownAction': 'The host process is still running an older build (the UI is {client}). Quit DSH completely and start it again; reloading the page does not reload the host.',
      'versions.title': 'Earlier versions',
      'picker.title': 'Choose sessions to download',
      'picker.desc': 'Everything is selected by default. Unchecked sessions are not written here; attachments are still verified.',
      'picker.all': 'Select all',
      'picker.none': 'Select none',
      'picker.download': 'Download {count} session(s)',
      'picker.encrypted': 'This version is encrypted, so the repository has no plain manifest; the whole package is downloaded.',
      'picker.empty': 'No session list available in the repository',
      'picker.loading': 'Reading the session list…',
      'picker.group': '{count} session(s)',
      'picker.noneSelected': 'Select at least one session',
      'versions.desc': 'Snapshots from the last three commits. Downloading writes those sessions back into this machine; the sync pointer stays where it is.',
      'versions.load': 'Load earlier versions',
      'versions.loading': 'Loading…',
      'versions.empty': 'No downloadable version in the repository',
      'versions.incremental': 'Download incrementally',
      'versions.force': 'Download by force',
      'versions.done': 'Restored {count} session(s); reload the session list',
      'versions.sessions': '{count} session(s)',
      'versions.forceTitle': 'Confirm forced download',
      'versions.forceBody': 'A forced download replaces same-path local sessions with this snapshot (backup first); anything newer locally is lost.',
      'versionMismatch': 'Host {host} / UI {client}. While they differ, some buttons answer “unknown action”; quit DSH completely and restart.',
      'repair.title': 'Repair missing attachments',
      'repair.desc': 'Packages now carry images and other attachments. Sessions synced earlier may reference files this machine does not have, which makes a request fail before it is ever sent. Scan first, then decide.',
      'repair.scan': 'Scan for missing attachments',
      'repair.scanning': 'Scanning…',
      'repair.repair': 'Replace missing references',
      'repair.repairing': 'Repairing…',
      'repair.summary': 'Scanned {scanned} session(s): {sessions} session(s) hold {blocks} missing reference(s)',
      'repair.none': 'Scanned {scanned} session(s): no missing references',
      'repair.item': '{count} ref(s)',
      'repair.done': 'Repaired {sessions} session(s), replaced {blocks} reference(s), backed up {backups} file(s)',
      'repair.note': 'Repair replaces missing image references with placeholder text; the original session file is backed up first. Reopen the session or restart DSH afterwards.',
      'reg.title': 'Workspace registration and cache',
      'reg.desc': 'When a session log exists but the workspace registry does not list it — or its projection cache was built while the log was unreadable — the sidebar shows nothing. Repair re-attaches it by the cwd in its header and drops that cache.',
      'reg.scan': 'Scan registration',
      'reg.scanning': 'Scanning…',
      'reg.repair': 'Repair registration',
      'reg.repairing': 'Repairing…',
      'reg.summary': '{sessions} session(s): {unregistered} unregistered, {missing} with no workspace',
      'reg.none': '{sessions} session(s), all registered',
      'reg.done': 'Registered {repaired} session(s), cleared {cleared} cache file(s); restart DSH to apply',
      'reg.unavailable': 'No workspace registry in this environment (host unavailable)',
      'reg.confirmTitle': 'Confirm registration repair',
      'reg.confirmBody': 'Re-attaches {count} session(s) by the cwd in their headers and clears their projection caches; restart DSH afterwards.',
      'reg.note': 'The registry belongs to DSH; this only adds the missing entries and clears caches — session content is not rewritten.',
      'repair.confirmTitle': 'Confirm repair',
      'repair.confirmDesc': 'This rewrites local session files',
      'repair.confirmBody': 'This rewrites {sessions} session(s) and replaces {blocks} reference(s); originals are backed up first.',
      'repair.confirmRun': 'Start repair',
      'forceGuard.title': 'This machine has unpushed changes',
      'forceGuard.desc': 'A forced download replaces same-path local sessions with the repository copy',
      'forceGuard.hint': 'Push incrementally first so local-only sessions reach the repository, then download by force; otherwise those updates are lost.',
      'forceGuard.pushFirst': 'Push first, then force download',
      'forceGuard.overwrite': 'Force download anyway',
      'forceGuard.done': 'Pushed incrementally, then downloaded by force',
      'attachments.title': 'Repair missing attachments',
      'attachments.desc': 'Packages now carry images and other attachments. Sessions synced earlier may reference files this machine does not have, which makes every request fail before it is sent. This replaces those references with placeholder text (the session file is backed up first).',
      'attachments.action': 'Check and repair',
      'attachments.running': 'Repairing…',
      'attachments.repaired': 'Repaired {sessions} session(s), replaced {blocks} missing reference(s)',
      'attachments.none': 'No missing attachment references found',
      'attachments.last': 'Last check: scanned {scanned} session(s), repaired {sessions}, replaced {blocks} reference(s)',
      'settings.overwrite': 'Force overwrite',
      'settings.incremental': 'Incremental (default)',
      'settings.name': 'Display name',
      'settings.nameDesc': 'Changes the label only; the repository user folder stays where it is.',
      'settings.device': 'This device name',
      'device.edit': 'Edit',
      'device.details': 'View device details',
      'device.hideDetails': 'Hide device details',
      'device.user': 'OS user',
      'device.username': 'Username',
      'device.hostname': 'Hostname',
      'device.name': 'Device name',
      'device.check': 'Save this field',
      'device.readOnly': 'Read-only',
      'device.host': 'Hostname',
      'device.mac': 'MAC',
      'device.ip': 'IP',
      'device.os': 'System',
      'device.fingerprint': 'Device fingerprint',
      'device.osVersion': 'OS version',
      'device.uniqueId': 'Unique ID',
      'settings.deviceDesc': 'Shows OS user, hostname, and architecture; MAC/IP are in device details. Use Edit to change each field separately.',
      'settings.saved': 'Settings saved',
      'settings.agreementRequired': 'The agreement is not signed, so automatic push is paused.',
      'encryption.title': 'Encryption extension',
      'encryption.subtitle': 'Off by default. When enabled the whole package is AES-256-GCM encrypted; the repository only holds ciphertext.',
      'encryption.on': 'On',
      'encryption.off': 'Off',
      'encryption.locked': 'Locked',
      'encryption.unlocked': 'Unlocked',
      'encryption.algorithm': 'AES-256-GCM',
      'encryption.enable': 'Enable encryption',
      'encryption.disable': 'Disable encryption',
      'encryption.change': 'Change passphrase',
      'encryption.recover': 'Recover via account',
      'encryption.unlockAction': 'Unlock with passphrase',
      'encryption.enableTitle': 'Enable AES-256 encryption',
      'encryption.enableDesc': 'Set a passphrase of at least 8 characters. It is never stored; the repository account can recover it.',
      'encryption.passphrase': 'Passphrase',
      'encryption.confirm': 'Repeat passphrase',
      'encryption.old': 'Current passphrase',
      'encryption.new': 'New passphrase',
      'encryption.recoverTitle': 'Recover passphrase via account',
      'encryption.recoverDesc': 'The plugin reads the recovery envelope from your private repository, unwraps the data key with the signed-in account, and lets you set a new passphrase.',
      'encryption.recoveryNote': 'The recovery envelope lives in your private repository. Anyone with access to that repository can recover. Keep it private.',
      'encryption.enabledToast': 'Encryption enabled; the next push writes a ciphertext package',
      'encryption.disabledToast': 'Encryption disabled; the next push writes a plaintext package',
      'encryption.unlockedToast': 'Unlocked; encrypted sync is available',
      'encryption.changedToast': 'Passphrase updated',
      'encryption.recoveredToast': 'Key recovered via account; use the new passphrase',
      'encryption.disableTitle': 'Disable encryption?',
      'encryption.disableDesc': 'The next push writes a plaintext package. Existing encrypted snapshots are not deleted automatically.',
      'encryption.disableConfirm': 'Disable encryption',
      'encryption.lockedDesc': 'This sync is encrypted. A passphrase is required to pull or auto-push.',
      'encryption.passphraseRequired': 'Enter a passphrase',
      'data.title': 'User data',
      'data.subtitle': 'Export, import, rename, or delete the user data stored in the repository.',
      'data.export': 'Export data',
      'data.exportDesc': 'Package this user’s sessions and profile; encryption is always applied.',
      'data.import': 'Import data',
      'data.importDesc': 'Restore sessions from an encrypted .dsync.enc package; you still sign in to the account.',
      'data.rename': 'Rename',
      'data.renameDesc': 'Change the display name locally and in the repository.',
      'data.delete': 'Delete user data',
      'data.deleteDesc': 'Delete locally, or also delete the user folder from the repository. Irreversible.',
      'data.exportTitle': 'Export user data',
      'data.exportDescLong': 'Includes session logs, profile, and consent record. Access tokens are never exported. The whole archive is always AES-256 encrypted.',
      'data.exportEncrypt': 'Encrypt this export with AES-256',
      'data.exportPassphrase': 'Export passphrase (8+ chars)',
      'data.exportPassphraseShort': 'The export passphrase must be at least 8 characters.',
      'data.exportEncryptedTitle': 'Exports are always encrypted',
      'data.exportEncryptedDesc': 'All sessions are packed into a compressed archive, then the whole archive is encrypted with AES-256-GCM. Filenames and content stay opaque. The passphrase is not stored; keep it safe.',
      'data.importNeedsPassphrase': 'Enter the passphrase used when exporting',
      'data.exportAction': 'Generate and download',
      'data.exporting': 'Packaging…',
      'data.importTitle': 'Import user data',
      'data.importDescLong': 'Choose a .dsync.enc file previously exported here and enter its passphrase. Open sessions are never overwritten.',
      'data.chooseFile': 'Choose file',
      'data.noFile': 'No file selected',
      'data.importPassphrase': 'Export passphrase (required)',
      'data.importAction': 'Import',
      'data.importing': 'Importing…',
      'data.imported': 'Imported {count} change(s)',
      'data.importedNone': 'No new sessions to import',
      'data.importedProfile': 'Profile written to the local user folder',
      'data.deleteTitle': 'Delete user data',
      'data.deleteDescLong': 'This cannot be undone. Export a backup first.',
      'data.deleteScope': 'Scope',
      'data.deleteLocal': 'Local data only',
      'data.deleteRemote': 'Repository user folder only',
      'data.deleteBoth': 'Local and repository',
      'data.deleteConfirm': 'Type “DELETE” to confirm',
      'data.deletePlaceholder': 'DELETE',
      'data.deleteAction': 'Delete permanently',
      'data.deleting': 'Deleting…',
      'data.deleted': 'User data deleted',
      'data.exported': 'Export download started',
      'data.fileTooLarge': 'File exceeds the 100 MB limit',
      'data.readError': 'Could not read this file',
      'legal.title': 'Agreement and privacy',
      'legal.signed': 'Signed · {date}',
      'legal.unsigned': 'Not signed',
      'legal.view': 'View agreement',
      'legal.viewSigned': 'View signed agreement',
      'legal.uploadGate': 'Nothing is uploaded before you sign.',
      'legal.localOnly': 'The plugin runs no server and collects no content; every upload goes to the repository platform you choose.',
      'legal.privateWarning': 'Keep the repository private. A public repository would expose your sessions.',
      'agreement.readOnlyTitle': 'Signed data-upload agreement',
      'agreement.readOnlySubtitle': 'Signed on {date}. This is the versioned text you accepted.',
      'agreement.signedRecord': 'Signed · version {version} · {date}',
      'agreement.title': 'Data-upload agreement',
      'agreement.subtitle': 'Read and accept before the first upload. Declining uploads nothing.',
      'agreement.checkbox': 'I have read and agree to upload this machine’s sessions to my own private repository.',
      'agreement.accept': 'Agree and continue',
      'agreement.decline': 'Not now',
      'agreement.accepted': 'Consent recorded',
      'agreement.withdraw': 'Withdraw agreement',
      'agreement.withdrawTitle': 'Withdraw the data-upload agreement?',
      'agreement.withdrawDesc': 'Withdrawing signs you out and returns to the unauthenticated state; sync and push will be unavailable. Data already in the repository is not deleted.',
      'agreement.withdrawConfirm': 'Withdraw and sign out',
      'agreement.withdrawn': 'Agreement withdrawn; signed out',
      'agreement.requiredToast': 'Sign the data-upload agreement first',
      'update.title': 'New session updates are available',
      'update.subtitle': 'The repository session value differs from this device. Update now or decline for now.',
      'update.remote': 'Repository value',
      'update.local': 'Acknowledged here',
      'update.device': 'From device',
      'update.sessions': '{count} sessions',
      'update.encrypted': 'Encrypted package',
      'update.plain': 'Plain package',
      'update.when': 'Pushed {time}',
      'update.pullAction': 'Update now',
      'update.pulling': 'Downloading and applying…',
      'update.later': 'Not now',
      'update.done': 'Updated {count} session(s)',
      'update.none': 'No sessions need updating',
      'update.overwriteWarning': 'Overwrite mode will replace local files at the same paths',
      'update.overwriteBackup': 'Before replacing, the old local files are backed up under the local backups folder and can be restored from Settings. Open sessions are skipped.',
      'update.overwriteConfirm': 'I understand and agree to overwrite local same-path sessions (backup is automatic)',
      'update.passphrase': 'This snapshot is encrypted. Enter its passphrase.',
      'update.conflict': 'Kept the newer local copy of {count} session(s) (or ones in use); everything else now matches the repository, so you can push again.',
      'update.workspaceMissing': '{count} session(s) belong to workspace folders that could not be created, so the sidebar cannot show them: {paths}',
      'update.workspaceCreated': 'Created {count} workspace folder(s) for the restored sessions: {paths}',
      'update.workspaceRepair': 'Register again',
      'update.workspaceRepaired': 'Registered {count} session(s) to sidebar workspaces',
      'update.workspaceStillMissing': '{count} session(s) still have missing workspace folders; create them and press "Register again"',
      'update.reloadHint': 'Session files were written. Reload the page so the session list sees them.',
      'update.upToDate': 'Sessions are up to date',
      'update.emptyRepo': 'The repository has no session snapshot yet. Select sessions and click “Push latest records” first.',
      'update.emptyRepoHint': 'Select just one session for a smoke test, then select all after the path works.',
      'push.title': 'Choose sessions to push',
      'push.subtitle': 'All sessions are selected by default. Uncheck to push one or a subset.',
      'push.loading': 'Reading local sessions…',
      'push.selectAll': 'Select all',
      'push.selected': '{count} session(s) selected',
      'push.live': 'Open now',
      'push.none': 'No local sessions to push',
      'push.noneDesc': 'Create a session first, then come back.',
      'push.submit': 'Push {count} selected session(s)',
      'push.progress.prepare': 'Preparing…',
      'push.progress.package': 'Packaging sessions…',
      'push.progress.upload': 'Uploading to private repository…',
      'push.progress.head': 'Updating sync value…',
      'push.progress.done': 'Sync complete',
      'push.progress.hint': 'Large uploads pause at 90% and jump to 100% when the repository confirms.',
      'push.passphrase': 'Encryption passphrase',
      'update.checkFailed': 'Update check failed',
      'overwrite.title': 'The repository is ahead',
      'overwrite.desc': 'Another device pushed first. Overwriting replaces the shared latest value with this device’s snapshot. Check for updates first.',
      'overwrite.force': 'Overwrite anyway',
      'overwrite.cancel': 'Check first',
      'push.mode.label': 'Push mode',
      'push.mode.force': 'Force overwrite',
      'push.mode.forceDesc': 'The selected sessions replace the shared snapshot; remote-only sessions that are not selected drop out of the latest revision.',
      'push.mode.incremental': 'Merge',
      'push.mode.incrementalDesc': 'Keep the other remote sessions and merge only the selected ones.',
      'push.mode.autoIncremental': 'Partial selection — switched to incremental merge.',
      'push.pullRequired': 'Another device pushed a newer revision. A forced overwrite replaces the remote snapshot, so pull first; plain incremental merge needs no pull.',
      'push.pullThenPush': 'Pull first, then force',
      'pull.incremental': 'Pull incrementally',
      'pull.force': 'Overwrite local',
      'pull.forceHint': 'Incremental pull only adds missing or newer sessions; overwrite replaces same-path local sessions with the repository copy (backed up first).',
      'busy.banner': 'Talking to the repository; please wait…',
      'error.title': 'Something went wrong',
      'error.loginRequired': 'Sign in first',
      'error.agreementRequired': 'Sign the agreement first',
      'error.encryptionLocked': 'Encryption is locked',
      'error.remoteAhead': 'The repository is ahead',
      'error.noRecovery': 'No recovery envelope found',
      'error.network': 'Network request failed',
      'toast.copied': 'Copied',
      'toast.closed': 'Closed',
      'toast.exported': 'Export generated',
      'toast.imported': 'Import complete',
      'toast.updated': 'Updated',
      'toast.pushed': 'Pushed to the repository',
      'toast.noChanges': 'No session changes to push',
      'toast.upToDate': 'Already up to date',
      'checkResult.title': 'Session update check',
      'checkResult.subtitle': 'The latest repository value was read and compared with local sessions.',
      'checkResult.same': 'Local sessions match the repository snapshot; nothing to pull.',
      'checkResult.remoteDesc': 'The repository has a newer snapshot. You can download the latest record.',
      'plugin.summaryOn': 'Connected · {repo}',
      'plugin.summaryOff': 'Not signed in',
      'account.title': 'Accounts',
      'account.subtitle': 'Multiple Gitee/GitHub sign-ins are kept on this machine; log out and switch back anytime.',
      'account.current': 'Signed in',
      'account.dshUser': 'Current DSH user',
      'account.repoUser': 'Repository account',
      'account.others': 'Saved accounts',
      'account.none': 'No other saved accounts',
      'account.switch': 'Switch',
      'account.switched': 'Switched to {name}',
      'account.logout': 'Log out',
      'account.add': 'Log out and add another account',
      'account.remove': 'Remove record',
      'account.removeTitle': 'Remove saved login?',
      'account.removeDesc': 'Removes the local token and profile only. Repository sync data is not deleted.',
      'account.removeConfirm': 'Remove local record',
      'account.removed': 'Saved login removed',
      'account.keepData': 'Repository data is untouched. Use “Delete user data” if that is intended.',
      'account.hint': 'Logging out only clears the active account; saved accounts can be switched back.',
      'pluginUpdate.title': 'Version and updates',
      'pluginUpdate.subtitle': 'Check the Gitee repository for plugin updates. Auto-update is off by default; use prompt or install mode.',
      'pluginUpdate.current': 'Current v{version}',
      'pluginUpdate.check': 'Check plugin updates',
      'pluginUpdate.checking': 'Checking…',
      'pluginUpdate.upToDate': 'Already up to date',
      'pluginUpdate.upToDateDetail': 'Version v{version} is already up to date.',
      'pluginUpdate.available': 'Version v{version} is available',
      'pluginUpdate.auto': 'Auto-update',
      'pluginUpdate.autoDesc': 'Off checks only on demand; prompt shows a dialog; install downloads and replaces files automatically.',
      'pluginUpdate.autoOff': 'Do not auto-update (default)',
      'pluginUpdate.autoPrompt': 'Tell me when a new version is available',
      'pluginUpdate.autoInstall': 'Download and install automatically',
      'pluginUpdate.modalTitle': 'Plugin version v{version} is available',
      'pluginUpdate.modalDesc': 'Current v{current}. Updating replaces runtime files; sessions and user data are untouched.',
      'pluginUpdate.install': 'Update now',
      'pluginUpdate.installing': 'Downloading and applying…',
      'pluginUpdate.installed': 'Updated to v{version}. Restart DSH for host changes; a page reload only updates the client UI.',
      'pluginUpdate.failed': 'Update failed: {reason}',
      'pluginUpdate.later': 'Later',
      'pluginUpdate.restartNow': 'Restart DSH now',
      'pluginUpdate.restarting': 'Restarting…',
      'pluginUpdate.restartFailed': 'Could not restart automatically ({error}). Quit DSH completely (tray too) and start it again.',
      'pluginUpdate.restart': 'The files are on disk but the host still runs the old code. Quit DSH completely (tray too) and reopen it, or use “Restart app host” in the menu. This page reloads once the new host answers.',
      'pluginUpdate.repo': 'Open Gitee repository',
      'pluginUpdate.autoFailed': 'Automatic update check failed',
      'uninstall.title': 'Plugin maintenance',
      'uninstall.subtitle': 'Uninstall Multi-device session sync and verify the plugin inventory is clean.',
      'uninstall.warning': 'Uninstalling does not delete repository data',
      'uninstall.desc': 'This removes the local plugin and sidebar entry only. User folders, snapshots, and recovery files in your repository are untouched.',
      'uninstall.button': 'Uninstall plugin',
      'uninstall.confirmTitle': 'Uninstall Multi-device session sync?',
      'uninstall.confirmDesc': 'Removes the local plugin and entry, and clears local plugin data (login, settings, backups, memos). Existing chats and repository data are not deleted.',
      'uninstall.confirm': 'Uninstall',
      'uninstall.busy': 'Uninstalling…',
      'uninstall.cancelled': 'Uninstall cancelled.',
      'uninstall.done': 'Uninstalled. Reloading…',
      'uninstall.failedGeneric': 'Unknown error',
      'uninstall.restart': 'The uninstall command ran. Restart DSH to finish cleanup.',
      'uninstall.partial': 'The plugin entry is still present',
      'uninstall.partialDesc': 'Remove it from the plugin manager manually, or restart DSH and check again.',
      'uninstall.opened': 'Opened the plugin manager; confirm the uninstall there.',
      'uninstall.noManager': 'No plugin manager entry found. Use the Plugins page in the sidebar.',
      'uninstall.keepData': 'Existing chats and repository data are untouched.',
      'pluginManager.open': 'Open plugin manager',
      'plugin.open': 'Open multi-device session sync',
      'plugin.title': 'Multi-device session sync',
      'unit.seconds': 's',
      'reload.title': 'Reload needed',
      'reload.desc': 'New session files were written locally. Reload the page so DSH rescans the session list.',
      'common.unknown': 'Unknown',
      'common.loading': 'Loading…',
      'common.never': 'Never',
      'common.justNow': 'just now',
      'common.minutesAgo': '{count} min ago',
      'common.hoursAgo': '{count} h ago',
      'common.daysAgo': '{count} d ago',
    };

    let localeT = null;
    let translate = (key, params) => formatText(zh[key] ?? key, params);

    function formatText(text, params) {
      return String(text ?? '').replace(/\{(\w+)\}/g, (_, name) => {
        const value = params && params[name];
        return value === undefined || value === null ? '' : String(value);
      });
    }

    function tr(key, params) {
      let text = null;
      if (typeof localeT === 'function') {
        try {
          text = localeT(key, params);
        } catch {
          text = null;
        }
      }
      if (!text || text === key) text = zh[key] ?? en[key] ?? key;
      return formatText(text, params);
    }

    /* ------------------------------------------------------------------ */
    /* Shared store                                                       */
    /* ------------------------------------------------------------------ */

    const store = {
      state: null,
      loading: true,
      busy: false,
      error: '',
      modal: null,
      toast: null,
      notice: null,
      pendingUpdate: null,
      agreementPrompted: false,
      reloadHint: false,
      listeners: new Set(),
    };
    let toastTimer = null;
    let noticeTimer = null;

    function subscribe(listener) {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    }

    function notify() {
      for (const listener of [...store.listeners]) {
        try {
          listener();
        } catch {
          /* A disposed component must not break the store. */
        }
      }
    }

    function setStore(patch) {
      Object.assign(store, patch);
      notify();
    }

    function useStore() {
      const [snapshot, setSnapshot] = React.useState(store);
      React.useEffect(() => subscribe(() => setSnapshot({ ...store })), []);
      return snapshot;
    }

    function showNotice(text, kind = 'info') {
      if (noticeTimer) clearTimeout(noticeTimer);
      setStore({ notice: { id: Date.now(), text, kind } });
      noticeTimer = setTimeout(() => {
        if (store.notice) setStore({ notice: null });
      }, 20000);
    }

    function showToast(text, kind = 'info', action = null) {
      if (toastTimer) clearTimeout(toastTimer);
      setStore({ toast: { id: Date.now(), text, kind, action } });
      toastTimer = setTimeout(() => {
        if (store.toast) setStore({ toast: null });
      }, action ? 9000 : 4200);
    }

    class ApiError extends Error {
      constructor(message, code, details) {
        super(message);
        this.name = 'ApiError';
        this.code = code || 'api';
        this.details = details || null;
      }
    }

    async function api(action, payload = {}) {
      let response;
      try {
        response = await fetch(`${API}/action`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ action, ...payload }),
        });
      } catch (error) {
        throw new ApiError(tr('error.network'), 'network');
      }
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.ok !== true) {
        throw new ApiError(
          (data && data.error) || `HTTP ${response.status}`,
          (data && data.code) || 'api',
          data && data.details,
        );
      }
      return data;
    }

    async function loadState(options = {}) {
      if (store.loading && !options.force) return;
      setStore({ loading: true });
      try {
        const response = await fetch(`${API}/state`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.ok !== true || !data.state) {
          throw new ApiError((data && data.error) || `HTTP ${response.status}`, (data && data.code) || 'state');
        }
        setStore({ state: data.state, loading: false, error: '' });
        maybePromptAgreement(data.state);
      } catch (error) {
        setStore({ loading: false, error: error instanceof Error ? error.message : String(error) });
      }
    }

    function maybePromptAgreement(state) {
      if (!state || !state.loggedIn || !state.agreement?.required) return;
      if (store.agreementPrompted) return;
      store.agreementPrompted = true;
      setStore({ modal: { kind: 'agreement' } });
    }

    async function perform(action, payload = {}, options = {}) {
      setStore({ busy: true, error: '' });
      try {
        const result = await api(action, payload);
        if (result.state) setStore({ state: result.state });
        if (options.toast) showToast(options.toast);
        return result;
      } catch (error) {
        const apiError = error instanceof ApiError ? error : new ApiError(String(error), 'internal');
        const message = apiError.code === 'unknown-action'
          ? tr('errors.unknownAction', { client: VERSION })
          : apiError.message;
        setStore({ error: message });
        if (options.silent !== true) showToast(message, 'error');
        throw new ApiError(message, apiError.code, apiError.details);
      } finally {
        setStore({ busy: false });
      }
    }

    /* ------------------------------------------------------------------ */
    /* Formatting helpers                                                 */
    /* ------------------------------------------------------------------ */

    function formatBytes(value) {
      const bytes = Number(value) || 0;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    function formatMac(value) {
      const hex = String(value || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
      if (hex.length !== 12) return hex || '—';
      return hex.match(/.{1,2}/g).join(':');
    }

    function formatTime(value, short = true) {
      if (!value) return tr('common.never');
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return tr('common.unknown');
      try {
        return new Intl.DateTimeFormat('zh-CN', short
          ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
          : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
      } catch {
        return date.toLocaleString();
      }
    }

    function relativeTime(value) {
      if (!value) return tr('common.never');
      const then = new Date(value).getTime();
      if (!Number.isFinite(then)) return tr('common.unknown');
      const delta = Date.now() - then;
      if (delta < 60_000) return tr('common.justNow');
      if (delta < 3_600_000) return tr('common.minutesAgo', { count: Math.floor(delta / 60_000) });
      if (delta < 86_400_000) return tr('common.hoursAgo', { count: Math.floor(delta / 3_600_000) });
      return tr('common.daysAgo', { count: Math.floor(delta / 86_400_000) });
    }

    function displayNameOf(state) {
      return state?.displayName || state?.account?.displayName || state?.account?.login || '';
    }

    function initialsOf(value) {
      const text = String(value || '?').trim();
      return text.slice(0, 2).toUpperCase();
    }

    function bufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      const chunk = 0x8000;
      let binary = '';
      for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
      }
      return btoa(binary);
    }

    function base64ToBytes(base64) {
      const binary = atob(String(base64 || ''));
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return bytes;
    }

    function downloadBase64(fileName, data, mime = 'application/octet-stream') {
      const bytes = base64ToBytes(data);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.style.display = 'none';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /* ------------------------------------------------------------------ */
    /* Icons                                                              */
    /* ------------------------------------------------------------------ */

    function Svg({ size = 18, viewBox = '0 0 24 24', children, className = '', ...rest }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        'aria-hidden': 'true',
        focusable: 'false',
        ...rest,
      }, children);
    }

    function SyncIcon({ size = 18 }) {
      return h(Svg, { size },
        h('path', { d: 'M20 7h-5V3' }),
        h('path', { d: 'M20 7a8 8 0 0 0-14.7 3' }),
        h('path', { d: 'M4 17h5v4' }),
        h('path', { d: 'M4 17a8 8 0 0 0 14.7-3' }),
      );
    }

    function CloudIcon({ size = 18 }) {
      return h(Svg, { size },
        h('path', { d: 'M17.5 19H6.8A4.3 4.3 0 0 1 6 10.5a6 6 0 0 1 11.7 1.8A3.4 3.4 0 0 1 17.5 19Z' }),
        h('path', { d: 'M12 12v5' }),
        h('path', { d: 'm9.8 14.2 2.2-2.2 2.2 2.2' }),
      );
    }

    function ShieldIcon({ size = 18 }) {
      return h(Svg, { size },
        h('path', { d: 'M12 3 4.8 6v5.3c0 4.4 3 7.7 7.2 9.7 4.2-2 7.2-5.3 7.2-9.7V6L12 3Z' }),
        h('path', { d: 'm9.2 12 1.8 1.8 3.8-4' }),
      );
    }

    function DatabaseIcon({ size = 18 }) {
      return h(Svg, { size },
        h('ellipse', { cx: 12, cy: 5.5, rx: 7.5, ry: 3 }),
        h('path', { d: 'M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6' }),
        h('path', { d: 'M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6' }),
      );
    }

    function LockIcon({ size = 18 }) {
      return h(Svg, { size },
        h('rect', { x: 4.5, y: 10, width: 15, height: 10, rx: 2.5 }),
        h('path', { d: 'M8 10V7.5a4 4 0 0 1 8 0V10' }),
        h('path', { d: 'M12 14v2.5' }),
      );
    }

    function UploadIcon({ size = 18 }) {
      return h(Svg, { size },
        h('path', { d: 'M12 16V4' }),
        h('path', { d: 'm7.5 8.5 4.5-4.5 4.5 4.5' }),
        h('path', { d: 'M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15' }),
      );
    }

    function DownloadIcon({ size = 18 }) {
      return h(Svg, { size },
        h('path', { d: 'M12 4v12' }),
        h('path', { d: 'm7.5 11.5 4.5 4.5 4.5-4.5' }),
        h('path', { d: 'M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15' }),
      );
    }

    function CheckIcon({ size = 18 }) {
      return h(Svg, { size }, h('path', { d: 'm5 12.5 4.2 4.2L19 7' }));
    }

    function AlertIcon({ size = 18 }) {
      return h(Svg, { size },
        h('path', { d: 'M12 4 3.8 19h16.4L12 4Z' }),
        h('path', { d: 'M12 9v4.5' }),
        h('path', { d: 'M12 17h.01' }),
      );
    }

    function UserIcon({ size = 18 }) {
      return h(Svg, { size },
        h('circle', { cx: 12, cy: 8, r: 3.4 }),
        h('path', { d: 'M5 20a7 7 0 0 1 14 0' }),
      );
    }

    function LinkIcon({ size = 16 }) {
      return h(Svg, { size },
        h('path', { d: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2' }),
        h('path', { d: 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2' }),
      );
    }

    function EyeIcon({ size = 16, off = false }) {
      return h(Svg, { size },
        h('path', { d: off ? 'M3 3l18 18' : 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z' }),
        off ? null : h('circle', { cx: 12, cy: 12, r: 3 }),
      );
    }

    function ChevronIcon({ size = 16 }) {
      return h(Svg, { size }, h('path', { d: 'm8 10 4 4 4-4' }));
    }

    function TrashIcon({ size = 16 }) {
      return h(Svg, { size },
        h('path', { d: 'M4 7h16' }),
        h('path', { d: 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7' }),
        h('path', { d: 'M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7' }),
        h('path', { d: 'M10 11v5M14 11v5' }),
      );
    }

    function EditIcon({ size = 16 }) {
      return h(Svg, { size },
        h('path', { d: 'M4 20h4.2L19 9.2a2 2 0 0 0-2.8-2.8L5.4 17.2 4 20Z' }),
        h('path', { d: 'm13.8 7.8 2.8 2.8' }),
      );
    }

    function RefreshCwIcon({ size = 16 }) {
      return h(Svg, { size },
        h('path', { d: 'M20 11a8 8 0 0 0-14.6-4.5L4 8' }),
        h('path', { d: 'M4 3v5h5' }),
        h('path', { d: 'M4 13a8 8 0 0 0 14.6 4.5L20 16' }),
        h('path', { d: 'M20 21v-5h-5' }),
      );
    }

    function CloudDownloadIcon({ size = 16 }) {
      return h(Svg, { size },
        h('path', { d: 'M7 18a4 4 0 0 1-.7-7.94A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 6.96' }),
        h('path', { d: 'M12 12v6' }),
        h('path', { d: 'm9.5 15.5 2.5 2.5 2.5-2.5' }),
      );
    }

    function PackageXIcon({ size = 16 }) {
      return h(Svg, { size },
        h('path', { d: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z' }),
        h('path', { d: 'M4 7.5 12 12l8-4.5' }),
        h('path', { d: 'M12 12v9' }),
        h('path', { d: 'm9.5 9.5 5 5M14.5 9.5l-5 5' }),
      );
    }

    /* ------------------------------------------------------------------ */
    /* Primitive UI                                                       */
    /* ------------------------------------------------------------------ */

    function Badge({ tone = 'neutral', children, dot = false }) {
      return h('span', { className: `dcs-badge dcs-badge--${tone}` },
        dot ? h('span', { className: 'dcs-badge-dot', 'aria-hidden': 'true' }) : null,
        children);
    }

    function Toggle({ checked, onChange, label }) {
      return h('button', {
        type: 'button',
        className: 'dcs-toggle',
        role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': label,
        'data-on': checked ? 'true' : 'false',
        onClick: () => onChange(!checked),
      }, h('span', { className: 'dcs-toggle-knob' }));
    }

    function Field({ label, hint, children, className = '' }) {
      return h('label', { className: `dcs-field ${className}` },
        h('span', { className: 'dcs-field-label' }, label),
        children,
        hint ? h('span', { className: 'dcs-field-hint' }, hint) : null);
    }

    function PassphraseInput({ value, onChange, placeholder, autoFocus = false, id }) {
      const [visible, setVisible] = React.useState(false);
      return h('div', { className: 'dcs-pass-wrap' },
        h('input', {
          id,
          className: 'dcs-input',
          type: visible ? 'text' : 'password',
          value,
          placeholder: placeholder || tr('encryption.passphrase'),
          autoFocus,
          autoComplete: 'new-password',
          spellCheck: false,
          onChange: (event) => onChange(event.target.value),
        }),
        h('button', {
          type: 'button',
          className: 'dcs-pass-toggle',
          title: visible ? tr('login.hide') : tr('login.show'),
          'aria-label': visible ? tr('login.hide') : tr('login.show'),
          onClick: () => setVisible(!visible),
        }, h(EyeIcon, { off: visible })),
      );
    }

    /* Dialogs are mounted into a body-level host. The plugin page has its own tab
     * bar and sticky bars; keeping modals inside that tree lets page chrome paint
     * over the dialog, which is what made the update dialog look clipped. */
    const ReactDOM = (() => {
      try {
        return require('react-dom');
      } catch {
        return null;
      }
    })();
    let portalHost = null;
    function portalTarget() {
      if (typeof document === 'undefined' || !document.body) return null;
      if (!portalHost || !portalHost.isConnected) {
        portalHost = document.createElement('div');
        portalHost.className = 'dcs-portal-host';
        document.body.append(portalHost);
      }
      return portalHost;
    }
    function renderPortal(node) {
      const host = portalTarget();
      if (!host || !ReactDOM || typeof ReactDOM.createPortal !== 'function') return node;
      return ReactDOM.createPortal(node, host);
    }

    function Modal({ title, subtitle, children, footer, onClose, wide = false, className = '' }) {
      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape' && onClose) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [onClose]);
      return renderPortal(h('div', {
        className: 'dcs-modal-backdrop',
        role: 'presentation',
        onMouseDown: (event) => {
          if (event.target === event.currentTarget && onClose) onClose();
        },
      },
        h('section', {
          className: `dcs-modal${wide ? ' dcs-modal--wide' : ''}${className ? ` ${className}` : ''}`,
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': title,
          onMouseDown: (event) => event.stopPropagation(),
        },
          h('header', { className: 'dcs-modal-head' },
            h('div', { className: 'dcs-modal-head-copy' },
              h('h2', { className: 'dcs-modal-title' }, title),
              subtitle ? h('p', { className: 'dcs-modal-subtitle' }, subtitle) : null,
            ),
            onClose ? h('button', {
              type: 'button',
              className: 'dcs-icon-btn',
              'aria-label': tr('actions.close'),
              title: tr('actions.close'),
              onClick: onClose,
            }, h('span', { className: 'dcs-x', 'aria-hidden': 'true' }, '×')) : null,
          ),
          h('div', { className: 'dcs-modal-body' }, children),
          footer ? h('footer', { className: 'dcs-modal-foot' }, footer) : null,
        ),
      ));
    }

    function EmptyState({ icon, title, desc, action }) {
      return h('div', { className: 'dcs-empty' },
        icon ? h('div', { className: 'dcs-empty-icon' }, icon) : null,
        h('h3', { className: 'dcs-empty-title' }, title),
        desc ? h('p', { className: 'dcs-empty-desc' }, desc) : null,
        action || null,
      );
    }

    function ErrorLine({ children }) {
      if (!children) return null;
      return h('div', { className: 'dcs-error-line', role: 'alert' },
        h(AlertIcon, { size: 15 }),
        h('span', null, children));
    }

    /* ------------------------------------------------------------------ */
    /* Global overlays                                                    */
    /* ------------------------------------------------------------------ */

    function GlobalOverlays() {
      const snapshot = useStore();
      const autoUpdateTried = React.useRef(false);
      React.useEffect(() => {
        loadState({ force: true });
        const timer = setInterval(() => {
          if (!document.hidden) loadState({ force: true });
        }, 30_000);
        const onFocus = () => loadState({ force: true });
        window.addEventListener('focus', onFocus);
        return () => {
          clearInterval(timer);
          window.removeEventListener('focus', onFocus);
        };
      }, []);

      React.useEffect(() => {
        const mode = snapshot.state?.autoUpdateMode;
        if (!snapshot.state || autoUpdateTried.current || mode === 'off') return;
        const key = 'dsh-chat-syncer.update-check.v1';
        let last = 0;
        try {
          last = Number(globalThis.localStorage?.getItem(key) || 0);
        } catch {
          last = 0;
        }
        if (Number.isFinite(last) && Date.now() - last < 24 * 60 * 60 * 1000) return;
        autoUpdateTried.current = true;
        void (async () => {
          try {
            const result = await api('update-check');
            try {
              globalThis.localStorage?.setItem(key, String(Date.now()));
            } catch {
              /* storage is optional */
            }
            if (!result.available) return;
            if (mode === 'install') {
              setStore({ modal: { kind: 'plugin-update', update: result } });
              const applied = await api('update-apply', { version: result.latestVersion });
              setStore({ modal: { kind: 'plugin-update', update: { ...result, ...applied, applied: true } } });
            } else {
              setStore({ modal: { kind: 'plugin-update', update: result } });
            }
          } catch {
            /* Automatic checks stay quiet; manual checks report errors. */
          }
        })();
      }, [snapshot.state?.autoUpdateMode]);

      const modal = snapshot.modal;
      return h(React.Fragment, null,
        modal?.kind === 'agreement'
          ? h(AgreementModal, {
            state: snapshot.state,
            readOnly: Boolean(modal.readOnly),
            onClose: () => setStore({ modal: null }),
          })
          : null,
        modal?.kind === 'update'
          ? h(UpdateModal, {
            state: snapshot.state,
            update: modal.update,
            onClose: () => setStore({ modal: null }),
          })
          : null,
        modal?.kind === 'plugin-update'
          ? h(PluginUpdateModal, {
            update: modal.update,
            onClose: () => setStore({ modal: null }),
          })
          : null,
        modal?.kind === 'unlock'
          ? h(UnlockModal, { onClose: () => setStore({ modal: null }) })
          : null,
        modal?.kind === 'uninstall'
          ? h(UninstallDialog, { onClose: () => setStore({ modal: null }) })
          : null,
        modal?.kind === 'check-result'
          ? h(CheckResultModal, { result: modal.result, onClose: () => setStore({ modal: null }) })
          : null,
        snapshot.toast ? h(Toast, { toast: snapshot.toast }) : null,
        h(Notice, { notice: snapshot.notice }),
      );
    }

    function Notice({ notice }) {
      const ref = React.useRef(null);
      React.useEffect(() => {
        if (!notice) return undefined;
        const onPointerDown = (event) => {
          if (ref.current && !ref.current.contains(event.target)) {
            setStore({ notice: null });
          }
        };
        window.addEventListener('pointerdown', onPointerDown, true);
        return () => window.removeEventListener('pointerdown', onPointerDown, true);
      }, [notice?.id]);
      if (!notice) return null;
      return h('div', { className: `dcs-notice dcs-notice--${notice.kind || 'info'}`, ref, role: 'status' },
        notice.kind === 'error' ? h(AlertIcon, { size: 15 }) : notice.kind === 'success' ? h(CheckIcon, { size: 15 }) : h(SyncIcon, { size: 15 }),
        h('span', { className: 'dcs-notice-text' }, notice.text),
        h('button', {
          type: 'button',
          className: 'dcs-notice-close',
          'aria-label': tr('actions.close'),
          onClick: () => setStore({ notice: null }),
        }, '×'),
      );
    }

    function Toast({ toast }) {
      const action = toast.action;
      return h('div', { className: `dcs-toast dcs-toast--${toast.kind || 'info'}`, role: 'status' },
        toast.kind === 'error' ? h(AlertIcon, { size: 16 })
          : toast.kind === 'success' ? h(CheckIcon, { size: 16 })
            : h(SyncIcon, { size: 16 }),
        h('span', { className: 'dcs-toast-text' }, toast.text),
        action ? h('button', {
          type: 'button',
          className: 'dcs-toast-action',
          onClick: () => {
            setStore({ toast: null });
            action.onClick();
          },
        }, action.label) : null,
      );
    }

    function CheckResultModal({ result, onClose }) {
      const relation = result?.relation || (result?.available ? 'remote-newer' : 'same');
      const label = relation === 'diverged'
        ? tr('status.diverged')
        : relation === 'remote-newer'
          ? tr('status.behind')
          : relation === 'local-newer'
            ? tr('status.localAhead')
            : tr('status.synced');
      const tone = relation === 'same' ? 'success' : 'warning';
      return h(Modal, {
        title: tr('checkResult.title'),
        subtitle: tr('checkResult.subtitle'),
        onClose,
        footer: h(React.Fragment, null,
          result?.head
            ? h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--soft',
              onClick: () => setStore({ modal: { kind: 'update', update: result } }),
            }, tr('actions.downloadLatest'))
            : null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: onClose }, tr('actions.close'))),
      },
        h('div', { className: 'dcs-check-result' },
          h(Badge, { tone, dot: true }, label),
          h('p', { className: 'dcs-check-result-desc' }, relation === 'same'
            ? tr('checkResult.same')
            : relation === 'local-newer'
              ? tr('status.localAheadDesc')
              : relation === 'diverged'
                ? tr('status.divergedDesc')
                : tr('checkResult.remoteDesc')),
          h('div', { className: 'dcs-update-grid' },
            h('div', { className: 'dcs-update-item' },
              h('span', { className: 'dcs-update-label' }, tr('update.local')),
              h('code', { className: 'dcs-code' }, result?.localRevision || '—'),
            ),
            h('div', { className: 'dcs-update-item' },
              h('span', { className: 'dcs-update-label' }, tr('update.remote')),
              h('code', { className: 'dcs-code' }, result?.remoteRevision || result?.head?.revision || '—'),
            ),
            h('div', { className: 'dcs-update-item' },
              h('span', { className: 'dcs-update-label' }, tr('update.sessions', { count: result?.head?.sessionCount || 0 })),
              h('span', null, result?.head?.updatedBy?.deviceName || tr('common.unknown')),
            ),
          ),
        ),
      );
    }


    function AgreementModal({ state, onClose, readOnly = false }) {
      const [checked, setChecked] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);
      const [error, setError] = React.useState('');
      const agreement = state?.agreement;
      if (!agreement) return null;
      const agreementText = String(agreement.text || '')
        .replace(/本协议不构成法律意见。[^\n]*\n?/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      const accept = async () => {
        if (!checked || busy) return;
        setBusy(true);
        setError('');
        try {
          const result = await perform('accept-agreement', { version: agreement.version });
          showToast(result.warning || tr('agreement.accepted'), result.warning ? 'info' : 'success');
          setStore({ agreementPrompted: true });
          const pending = store.pendingUpdate;
          const nextState = result.state || state;
          if (pending?.available) {
            setStore({ modal: { kind: 'update', update: pending }, pendingUpdate: null });
            return;
          }
          /* First consent: if the repository has no snapshot yet, seed it once
           * with the current sessions so the very first check has something to
           * compare. If the repository already has data, leave that decision
           * to the normal check/update flow. */
          if (nextState?.loggedIn && !nextState.sync?.lastPushAt && !nextState.sync?.remoteHead) {
            setStore({ modal: null, pendingUpdate: null });
            try {
              await perform('push', { reason: 'first-consent' });
              showToast(tr('toast.pushed'), 'success');
            } catch (caught) {
              showToast(caught.message, 'info');
            }
          } else {
            setStore({ modal: null, pendingUpdate: null });
          }
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: readOnly ? tr('agreement.readOnlyTitle') : tr('agreement.title'),
        subtitle: readOnly
          ? tr('agreement.readOnlySubtitle', { date: formatTime(agreement.acceptedAt) })
          : tr('agreement.subtitle'),
        onClose,
        wide: true,
        className: 'dcs-agreement-modal',
        footer: readOnly
          ? h(React.Fragment, null,
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger-ghost', onClick: () => setConfirmWithdraw(true) }, tr('agreement.withdraw')),
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: onClose }, tr('actions.close')))
          : h(React.Fragment, null,
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: onClose, disabled: busy }, tr('agreement.decline')),
            h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--primary',
              disabled: !checked || busy,
              onClick: accept,
            }, busy ? tr('actions.saving') : tr('agreement.accept'))),
      },
        h('div', { className: 'dcs-agreement-scroll' }, h('pre', { className: 'dcs-agreement-text' }, agreementText)),
        readOnly
          ? h('div', { className: 'dcs-agreement-signed' },
            h(CheckIcon, { size: 15 }),
            h('span', null, tr('agreement.signedRecord', {
              version: agreement.version || '—',
              date: formatTime(agreement.acceptedAt),
            })))
          : h('label', { className: 'dcs-check-row' },
            h('input', {
              type: 'checkbox',
              checked,
              onChange: (event) => setChecked(event.target.checked),
            }),
            h('span', null, tr('agreement.checkbox'))),
        error ? h(ErrorLine, null, error) : null,
        confirmWithdraw ? h(ConfirmDialog, {
          title: tr('agreement.withdrawTitle'),
          message: tr('agreement.withdrawDesc'),
          confirmLabel: tr('agreement.withdrawConfirm'),
          danger: true,
          onClose: () => setConfirmWithdraw(false),
          onConfirm: async () => {
            const result = await perform('withdraw-agreement');
            setConfirmWithdraw(false);
            setStore({ state: result.state, modal: null });
            showToast(tr('agreement.withdrawn'), 'success');
          },
        }) : null,
      );
    }

    function UpdateModal({ state, update, onClose }) {
      const [passphrase, setPassphrase] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [overwriteAccepted, setOverwriteAccepted] = React.useState(false);
      /* A forced download can drop local-only sessions; ask before it does. */
      const [forceGuard, setForceGuard] = React.useState(null);
      const [pickerMode, setPickerMode] = React.useState(null);
      const head = update?.head;
      const needsPassphrase = Boolean(head?.encrypted && (state?.encryption?.locked || !state?.encryption?.enabled));
      const requiresOverwriteConfirm = !overwriteAccepted;
      if (!head) return null;
      const repairWorkspaces = async () => {
        try {
          const repaired = await perform('workspace-repair', {}, { silent: true });
          const workspace = repaired.workspace || null;
          const missing = workspace && Array.isArray(workspace.missing) ? workspace.missing : [];
          const missingCount = missing.reduce((total, item) => total + (Number(item.sessions) || 0), 0);
          if (missingCount > 0) {
            showToast(tr('update.workspaceStillMissing', { count: missingCount }), 'warning');
            return;
          }
          const created = workspace && Array.isArray(workspace.created) ? workspace.created : [];
          const createdCount = created.reduce((total, item) => total + (Number(item.sessions) || 0), 0);
          const text = createdCount > 0
            ? `${tr('update.workspaceRepaired', { count: workspace?.attached || 0 })}。${tr('update.workspaceCreated', {
              count: createdCount,
              paths: created.slice(0, 3).map((item) => item.path).join(' / '),
            })}`
            : tr('update.workspaceRepaired', { count: workspace?.attached || 0 });
          showToast(text, 'success', {
            label: tr('actions.reload'),
            onClick: () => window.location.reload(),
          });
        } catch (caught) {
          showToast(caught.message, 'error');
        }
      };
      const pull = async (mode = 'incremental', sessionRelPaths) => {
        if (busy) return;
        if (needsPassphrase && !passphrase) {
          setError(tr('encryption.passphraseRequired'));
          return;
        }
        setBusy(true);
        setError('');
        try {
          const result = await perform('pull', {
            passphrase,
            mode,
            ...(Array.isArray(sessionRelPaths) ? { sessionRelPaths } : {}),
          });
          const workspace = result.workspace || null;
          const missing = workspace && Array.isArray(workspace.missing) ? workspace.missing : [];
          const missingCount = missing.reduce((total, item) => total + (Number(item.sessions) || 0), 0);
          if (result.requiresReload) setStore({ reloadHint: true });
          if (result.conflicts && result.conflicts.length > 0) {
            showToast(tr('update.conflict', { count: result.conflicts.length }), 'info');
          }
          if (result.requiresReload && missingCount > 0) {
            showToast(
              `${tr('update.done', { count: (result.added || 0) + (result.updated || 0) })}。${tr('update.workspaceMissing', {
                count: missingCount,
                paths: missing.slice(0, 3).map((item) => item.path).join(' / '),
              })}`,
              'warning',
              { label: tr('update.workspaceRepair'), onClick: () => repairWorkspaces() },
            );
          } else if (result.requiresReload) {
            const created = workspace && Array.isArray(workspace.created) ? workspace.created : [];
            const createdCount = created.reduce((total, item) => total + (Number(item.sessions) || 0), 0);
            showToast(
              createdCount > 0
                ? `${tr('update.done', { count: (result.added || 0) + (result.updated || 0) })}。${tr('update.workspaceCreated', {
                  count: createdCount,
                  paths: created.slice(0, 3).map((item) => item.path).join(' / '),
                })}`
                : tr('update.done', { count: (result.added || 0) + (result.updated || 0) }),
              'success',
              { label: tr('actions.reload'), onClick: () => window.location.reload() },
            );
          } else if (result.upToDate) {
            showToast(tr('update.upToDate'), 'info');
          } else {
            showToast(tr('update.none'), 'info');
          }
          setStore({ modal: null });
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      const pushThenForcePull = async () => {
        setForceGuard(null);
        setBusy(true);
        setError('');
        try {
          await perform('push', { mode: 'incremental', allSelected: true }, { silent: true });
          setBusy(false);
          setPickerMode('force');
          return;
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      const checkAndForcePull = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          const current = await perform('check', {}, { silent: true });
          setBusy(false);
          if (current.relation === 'local-newer' || current.relation === 'diverged') {
            setForceGuard({ relation: current.relation });
            return;
          }
          await pull('force');
        } catch (caught) {
          setBusy(false);
          setError(caught.message);
        }
      };

      return h(Modal, {
        title: tr('update.title'),
        subtitle: tr('update.subtitle'),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('update.later')),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--danger',
            disabled: busy || requiresOverwriteConfirm,
            onClick: checkAndForcePull,
          }, tr('pull.force')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy, onClick: () => pull('incremental') },
            busy ? tr('update.pulling') : tr('pull.incremental'))),
      },
        h('p', { className: 'dcs-muted' }, tr('pull.forceHint')),
        h('div', { className: 'dcs-update-grid' },
          h('div', { className: 'dcs-update-item' },
            h('span', { className: 'dcs-update-label' }, tr('update.remote')),
            h('code', { className: 'dcs-code' }, head.shortRevision || head.revision?.slice(0, 12)),
          ),
          h('div', { className: 'dcs-update-item' },
            h('span', { className: 'dcs-update-label' }, tr('update.local')),
            h('code', { className: 'dcs-code' }, state?.sync?.lastSeenShort || '—'),
          ),
          h('div', { className: 'dcs-update-item' },
            h('span', { className: 'dcs-update-label' }, tr('update.device')),
            h('span', null, head.updatedBy?.deviceName || head.updatedBy?.deviceId || tr('common.unknown')),
          ),
          h('div', { className: 'dcs-update-item' },
            h('span', { className: 'dcs-update-label' }, tr('update.sessions', { count: head.sessionCount || 0 })),
            h('span', null, head.encrypted ? tr('update.encrypted') : tr('update.plain')),
          ),
        ),
        h('div', { className: 'dcs-update-meta' },
          h('span', { className: 'dcs-muted' }, tr('update.when', { time: formatTime(head.updatedAt) })),
        ),
        needsPassphrase
          ? h(Field, { label: tr('update.passphrase') },
            h(PassphraseInput, { value: passphrase, onChange: setPassphrase, autoFocus: true }))
          : null,
        h('label', { className: 'dcs-check-row dcs-overwrite-check' },
          h('input', {
            type: 'checkbox',
            checked: overwriteAccepted,
            onChange: (event) => setOverwriteAccepted(event.target.checked),
          }),
          h('span', null, tr('update.overwriteConfirm'))),
        forceGuard
          ? h(Modal, {
            title: tr('forceGuard.title'),
            subtitle: tr('forceGuard.desc'),
            onClose: () => setForceGuard(null),
            footer: h(React.Fragment, null,
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: () => setForceGuard(null) }, tr('actions.cancel')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger', onClick: () => { setForceGuard(null); setPickerMode('force'); } }, tr('forceGuard.overwrite')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: pushThenForcePull }, tr('forceGuard.pushFirst'))),
          }, h('p', { className: 'dcs-muted' }, tr('forceGuard.hint')))
          : null,
        error ? h(ErrorLine, null, error) : null,
        pickerMode
          ? h(SessionPicker, {
            title: tr('picker.title'),
            subtitle: pickerMode === 'force' ? tr('versions.forceTitle') : tr('pull.incremental'),
            load: () => perform('remote-sessions', {}, { silent: true }),
            onClose: () => setPickerMode(null),
            onConfirm: (paths) => { const mode = pickerMode; setPickerMode(null); void pull(mode, paths); },
          })
          : null,
      );
    }

    function PluginUpdateModal({ update, onClose }) {
      const [busy, setBusy] = React.useState(false);
      const [result, setResult] = React.useState(update || {});
      const [error, setError] = React.useState('');
      const done = Boolean(result.applied);
      /* The plugin cannot relaunch DSH itself, but it can wait for the new
       * host and refresh the page the moment it answers. */
      React.useEffect(() => {
        if (!done) return undefined;
        let cancelled = false;
        const timer = setInterval(async () => {
          try {
            const next = await api('state');
            const hostVersion = next?.state?.version || next?.version;
            if (!cancelled && hostVersion && (!result.latestVersion || hostVersion === result.latestVersion)) {
              clearInterval(timer);
              window.location.reload();
            }
          } catch {
            /* the host is restarting; try again on the next tick */
          }
        }, 4000);
        return () => {
          cancelled = true;
          clearInterval(timer);
        };
      }, [done, result.latestVersion]);

      const [restarting, setRestarting] = React.useState(false);
      const restartNow = async () => {
        if (restarting) return;
        setRestarting(true);
        setError('');
        try {
          const result = await perform('restart-host', {}, { silent: true });
          if (!result.ok) {
            setRestarting(false);
            setError(tr('pluginUpdate.restartFailed', { error: result.error || result.code || '' }));
          }
        } catch (caught) {
          /* The app is going down, so the request may never answer. */
          if (caught && caught.code === 'network') return;
          setRestarting(false);
          setError(caught.message);
        }
      };

      const install = async () => {
        if (busy || done) return;
        setBusy(true);
        setError('');
        try {
          const applied = await api('update-apply', { version: result.latestVersion });
          setResult({ ...result, ...applied, applied: true });
          showToast(tr('pluginUpdate.installed', { version: applied.currentVersion || result.latestVersion }), 'success');
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: tr('pluginUpdate.modalTitle', { version: result.latestVersion || '?' }),
        subtitle: tr('pluginUpdate.modalDesc', { current: result.currentVersion || VERSION }),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          done
            ? h(React.Fragment, null,
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: onClose }, tr('actions.close')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft', onClick: () => window.location.reload() }, tr('actions.reload')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: restarting, onClick: restartNow },
                restarting ? tr('pluginUpdate.restarting') : tr('pluginUpdate.restartNow')))
            : h(React.Fragment, null,
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('pluginUpdate.later')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy, onClick: install },
                busy ? tr('pluginUpdate.installing') : tr('pluginUpdate.install')))),
      },
        done
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(SyncIcon, { size: 16 }),
            h('div', null,
              h('strong', null, tr('pluginUpdate.restart')),
              h('p', null, tr('pluginUpdate.installed', { version: result.currentVersion || result.latestVersion || '?' })),
            ))
          : h('div', { className: 'dcs-update-grid' },
            h('div', { className: 'dcs-update-item' },
              h('span', { className: 'dcs-update-label' }, tr('pluginUpdate.current', { version: result.currentVersion || VERSION })),
              h('code', { className: 'dcs-code' }, result.currentVersion || VERSION),
            ),
            h('div', { className: 'dcs-update-item' },
              h('span', { className: 'dcs-update-label' }, tr('pluginUpdate.available', { version: result.latestVersion || '?' })),
              h('code', { className: 'dcs-code' }, result.latestVersion || '?'),
            ),
          ),
        error ? h(ErrorLine, null, error) : null,
        h('div', { className: 'dcs-inline-links' },
          h('a', { className: 'dcs-link-btn', href: result.repoUrl || 'https://gitee.com/user_gitee/dsh-chat-sync', target: '_blank', rel: 'noreferrer' },
            tr('pluginUpdate.repo')),
        ),
      );
    }


    function UnlockModal({ onClose }) {
      const [passphrase, setPassphrase] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const unlock = async () => {
        if (!passphrase) {
          setError(tr('encryption.passphraseRequired'));
          return;
        }
        setBusy(true);
        setError('');
        try {
          await perform('unlock', { passphrase });
          showToast(tr('encryption.unlockedToast'), 'success');
          setStore({ modal: null });
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: tr('encryption.unlockAction'),
        subtitle: tr('encryption.lockedDesc'),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy, onClick: unlock }, busy ? tr('actions.saving') : tr('actions.unlock'))),
      },
        h(Field, { label: tr('encryption.passphrase') },
          h(PassphraseInput, { value: passphrase, onChange: setPassphrase, autoFocus: true })),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    /* ------------------------------------------------------------------ */
    /* Login                                                              */
    /* ------------------------------------------------------------------ */

    function ProviderSwitch({ value, onChange, providers }) {
      const options = ['gitee', 'github'];
      return h('div', { className: 'dcs-segment', role: 'radiogroup', 'aria-label': tr('login.provider') },
        options.map((id) => {
          const active = value === id;
          const info = providers?.[id];
          return h('button', {
            key: id,
            type: 'button',
            role: 'radio',
            'aria-checked': active ? 'true' : 'false',
            className: `dcs-segment-btn${active ? ' is-active' : ''}`,
            onClick: () => onChange(id),
          },
            h('span', { className: 'dcs-provider-mark dcs-provider-mark--' + id, 'aria-hidden': 'true' }, id === 'gitee' ? 'G' : 'GH'),
            h('span', { className: 'dcs-segment-copy' },
              h('span', { className: 'dcs-segment-title' },
                h('strong', null, info?.label || id),
                id === 'gitee'
                  ? h('span', { className: 'dcs-provider-recommend' }, tr('login.giteeRecommend'))
                  : null,
              ),
              h('span', null, id === 'gitee' ? tr('login.giteeNote') : tr('login.githubNote')),
            ),
          );
        }),
      );
    }

    function LoginView({ state }) {
      const providers = state?.providers || {};
      const [provider, setProvider] = React.useState(state?.provider || 'gitee');
      const [token, setToken] = React.useState('');
      const [repoName, setRepoName] = React.useState('dsh-chat-syncer-data');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [storedProvider, setStoredProvider] = React.useState(null);
      const [permission, setPermission] = React.useState(null);
      const [permissionBusy, setPermissionBusy] = React.useState(false);

      React.useEffect(() => {
        if (state?.provider && state.provider !== storedProvider) {
          setProvider(state.provider);
          setStoredProvider(state.provider);
        }
      }, [state?.provider, storedProvider]);

      React.useEffect(() => {
        setPermission(null);
        if (!token.trim() || token.trim().length < 20) return undefined;
        let cancelled = false;
        const timer = setTimeout(async () => {
          setPermissionBusy(true);
          try {
            const result = await api('check-token', { provider, token: token.trim() });
            if (!cancelled) setPermission(result);
          } catch (caught) {
            if (!cancelled) setPermission({ status: 'error', message: caught.message });
          } finally {
            if (!cancelled) setPermissionBusy(false);
          }
        }, 700);
        return () => {
          cancelled = true;
          clearTimeout(timer);
        };
      }, [provider, token]);

      const info = providers[provider] || {};
      const submit = async (event) => {
        event.preventDefault();
        if (busy) return;
        if (!token.trim()) {
          setError(tr('login.tokenRequired'));
          return;
        }
        if (permission?.status === 'missing') {
          setError(permission.message);
          return;
        }
        setBusy(true);
        setError('');
        try {
          const result = await api('login', { provider, token: token.trim(), repoName });
          setStore({ state: result.state, agreementPrompted: false });
          if (result.repoCreated) showToast(tr('login.repoCreated', { repo: result.state.repo?.name || repoName }), 'success');
          else showToast(tr('login.success', { repo: result.state.repo?.fullName || repoName }), 'success');
          if (result.update?.error) showToast(result.update.error, 'error');
          if (result.update?.empty) showToast(tr('update.emptyRepo'), 'info');
          if (result.state.agreement?.required) {
            setStore({ pendingUpdate: result.update?.available ? result.update : null, modal: { kind: 'agreement' } });
          } else if (result.update?.available) {
            setStore({ modal: { kind: 'update', update: result.update } });
          }
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };

      return h('div', { className: 'dcs-login' },
        h('section', { className: 'dcs-login-card' },
          h('div', { className: 'dcs-login-tools' }, h(AuthActions, null)),
          h('div', { className: 'dcs-login-head' },
            h('div', { className: 'dcs-login-icon' }, h(PanelIcon, { size: 32, active: true })),
            h('div', null,
              h('h2', { className: 'dcs-login-title' }, tr('login.title')),
              h('p', { className: 'dcs-login-subtitle' }, tr('login.subtitle')),
            ),
          ),
          h('form', { className: 'dcs-login-form', onSubmit: submit },
            h(Field, { label: tr('login.provider') },
              h(ProviderSwitch, { value: provider, onChange: setProvider, providers })),
            h('p', { className: 'dcs-network-hint' }, tr('login.networkHint')),
            h('div', { className: 'dcs-token-field' },
              h('span', { className: 'dcs-field-label' }, tr('login.token')),
              info.tokenUrl ? h('div', { className: 'dcs-token-guide' },
                h('span', { className: 'dcs-guide-step' }, '1'),
                h('div', { className: 'dcs-guide-copy' },
                  h('strong', null, tr('login.tokenStepTitle')),
                  h('p', null, tr('login.tokenStepDesc', { provider: info.label || provider })),
                ),
                h('a', {
                  className: 'dcs-btn dcs-btn--primary dcs-token-create',
                  href: info.tokenUrl,
                  target: '_blank',
                  rel: 'noreferrer',
                }, tr('login.createToken', { provider: info.label || provider }), h(LinkIcon, { size: 14 })),
              ) : null,
              h('div', { className: 'dcs-token-paste' },
                h('span', { className: 'dcs-guide-step dcs-guide-step--muted' }, '2'),
                h('div', { className: 'dcs-token-paste-body' },
                  h('label', { className: 'dcs-token-paste-label', htmlFor: 'dcs-token-input' }, tr('login.tokenPasteLabel')),
                  h('input', {
                    id: 'dcs-token-input',
                    className: 'dcs-input dcs-input--mono',
                    type: 'password',
                    value: token,
                    placeholder: tr('login.tokenPlaceholder'),
                    autoComplete: 'off',
                    spellCheck: false,
                    onChange: (event) => setToken(event.target.value),
                  }),
                ),
              ),
              info.tokenHint ? h('span', { className: 'dcs-field-hint' }, tr('login.tokenHint', { hint: info.tokenHint })) : null,
            ),
            h('div', { className: 'dcs-permission-box' },
              h('div', { className: 'dcs-permission-head' },
                h(ShieldIcon, { size: 15 }),
                h('strong', null, tr('login.permissionsTitle')),
              ),
              h('p', null, provider === 'gitee' ? tr('login.permissionsGitee') : tr('login.permissionsGithub')),
              permissionBusy
                ? h('span', { className: 'dcs-permission-status is-checking' },
                  h('span', { className: 'dcs-spinner dcs-spinner--small' }), tr('login.permissionChecking'))
                : permission
                  ? h('span', { className: `dcs-permission-status is-${permission.status}` },
                    permission.status === 'ok' ? h(CheckIcon, { size: 14 }) : h(AlertIcon, { size: 14 }),
                    h('span', null, permission.message))
                  : null,
            ),
            h(Field, { label: tr('login.repo'), hint: tr('login.repoHint') },
              h('input', {
                className: 'dcs-input',
                value: repoName,
                placeholder: tr('login.repoPlaceholder'),
                spellCheck: false,
                onChange: (event) => setRepoName(event.target.value.replace(/[^A-Za-z0-9._-]/g, '')),
              })),
            error ? h(ErrorLine, null, error) : null,
            h('button', { type: 'submit', className: 'dcs-btn dcs-btn--primary dcs-btn--wide', disabled: busy || permission?.status === 'missing' },
              busy ? tr('login.working') : tr('login.submit')),
            h('p', { className: 'dcs-fineprint' }, tr('login.legal')),
            h('p', { className: 'dcs-fineprint dcs-fineprint--muted' }, tr('login.privacy')),
          ),
          Array.isArray(state.accounts) && state.accounts.length > 0
            ? h('div', { className: 'dcs-login-history' },
              h('span', { className: 'dcs-label' }, tr('account.others')),
              state.accounts.map((account) => h('div', { className: 'dcs-login-history-row', key: account.userKey },
                h('div', { className: 'dcs-account-copy' },
                  h('strong', null, account.displayName || account.login),
                  h('span', null, `${account.provider === 'github' ? 'GitHub' : 'Gitee'} · ${account.login}`),
                ),
                h('button', {
                  type: 'button',
                  className: 'dcs-btn dcs-btn--soft dcs-btn--small',
                  onClick: async () => {
                    try {
                      const result = await api('switch-user', { userKey: account.userKey });
                      setStore({ state: result.state });
                      showToast(tr('account.switched', { name: account.displayName || account.login }), 'success');
                    } catch (caught) {
                      showToast(caught.message, 'error');
                    }
                  },
                }, tr('account.switch')),
                h('button', {
                  type: 'button',
                  className: 'dcs-icon-btn',
                  title: tr('account.remove'),
                  'aria-label': tr('account.remove'),
                  onClick: async () => {
                    if (!window.confirm(tr('account.removeDesc'))) return;
                    try {
                      const result = await api('delete-account', { userKey: account.userKey });
                      setStore({ state: result.state });
                      showToast(tr('account.removed'), 'success');
                    } catch (caught) {
                      showToast(caught.message, 'error');
                    }
                  },
                }, h(TrashIcon, { size: 14 })),
              )),
            )
            : null,
        ),
        h('aside', { className: 'dcs-login-aside' },
          h('div', { className: 'dcs-aside-item' },
            h('span', { className: 'dcs-aside-icon' }, h(ShieldIcon, { size: 18 })),
            h('div', null,
              h('strong', null, '私有仓库'),
              h('p', null, '所有会话只保存在你自己的私有仓库。插件不提供云端存储。'),
            ),
          ),
          h('div', { className: 'dcs-aside-item' },
            h('span', { className: 'dcs-aside-icon' }, h(DatabaseIcon, { size: 18 })),
            h('div', null,
              h('strong', null, '按用户与设备分目录'),
              h('p', null, 'users/<账号>/common 保存公共最新快照；devices/<设备> 相互隔离。'),
            ),
          ),
          h('div', { className: 'dcs-aside-item' },
            h('span', { className: 'dcs-aside-icon' }, h(LockIcon, { size: 18 })),
            h('div', null,
              h('strong', null, '可选 AES-256'),
              h('p', null, '默认明文；开启后整包加密，口令可用仓库账号找回。'),
            ),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------------ */
    /* Dashboard                                                          */
    /* ------------------------------------------------------------------ */

    function statusOf(state) {
      if (!state?.loggedIn) return { tone: 'neutral', label: tr('status.offline') };
      if (state.busy) return { tone: 'progress', label: tr('status.syncing') };
      if (state.sync?.lastError) return { tone: 'danger', label: tr('status.error') };
      if (state.sync?.scheduledPaused) return { tone: 'warning', label: tr('status.smartPaused') };
      const relation = state.sync?.relation;
      if (relation === 'diverged') return { tone: 'warning', label: tr('status.diverged') };
      if (relation === 'remote-newer') return { tone: 'warning', label: tr('status.behind') };
      if (relation === 'local-newer') return { tone: 'warning', label: tr('status.localAhead') };
      if (!state.stats?.sessions) return { tone: 'neutral', label: tr('status.empty') };
      return { tone: 'success', label: tr('status.synced') };
    }

    function Avatar({ account }) {
      const [failed, setFailed] = React.useState(false);
      const name = account?.displayName || account?.name || account?.login || '?';
      if (account?.avatarUrl && !failed) {
        return h('img', {
          className: 'dcs-avatar',
          src: account.avatarUrl,
          alt: name,
          referrerPolicy: 'no-referrer',
          onError: () => setFailed(true),
        });
      }
      return h('span', { className: 'dcs-avatar dcs-avatar--fallback' }, initialsOf(name));
    }

    function TopActions({ state }) {
      const [busy, setBusy] = React.useState('');
      const checkSession = async () => {
        if (busy) return;
        setBusy('check');
        try {
          const result = await perform('check');
          if (result.empty) showToast(tr('update.emptyRepo'), 'info');
          else if (result.available) setStore({ modal: { kind: 'update', update: result } });
          else setStore({ modal: { kind: 'check-result', result } });
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy('');
        }
      };
      const checkPlugin = async () => {
        if (busy) return;
        setBusy('update');
        try {
          const result = await perform('update-check');
          if (result.available) setStore({ modal: { kind: 'plugin-update', update: result } });
          else showNotice(tr('pluginUpdate.upToDateDetail', { version: result.currentVersion || VERSION }));
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy('');
        }
      };
      const openUninstall = () => {
        setStore({ modal: { kind: 'uninstall' } });
      };
      return h('div', { className: 'dcs-top-actions' },
        h('button', {
          type: 'button',
          className: 'dcs-icon-action',
          title: tr('pluginUpdate.check'),
          'aria-label': tr('pluginUpdate.check'),
          disabled: Boolean(busy),
          onClick: checkPlugin,
        }, busy === 'update' ? h('span', { className: 'dcs-spinner dcs-spinner--tiny' }) : h(RefreshCwIcon, { size: 16 })),
        h('button', {
          type: 'button',
          className: 'dcs-icon-action',
          title: tr('actions.check'),
          'aria-label': tr('actions.check'),
          disabled: Boolean(busy),
          onClick: checkSession,
        }, busy === 'check' ? h('span', { className: 'dcs-spinner dcs-spinner--tiny' }) : h(CloudDownloadIcon, { size: 16 })),
        h('button', {
          type: 'button',
          className: 'dcs-icon-action dcs-icon-action--danger',
          title: tr('uninstall.button'),
          'aria-label': tr('uninstall.button'),
          onClick: openUninstall,
        }, h(PackageXIcon, { size: 17 })),
      );
    }

    function AuthActions() {
      const [busy, setBusy] = React.useState(false);
      const checkPlugin = async () => {
        if (busy) return;
        setBusy(true);
        try {
          const result = await api('update-check');
          if (result.available) setStore({ modal: { kind: 'plugin-update', update: result } });
          else showNotice(tr('pluginUpdate.upToDateDetail', { version: result.currentVersion || VERSION }));
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy(false);
        }
      };
      return h('div', { className: 'dcs-auth-actions' },
        h('button', {
          type: 'button',
          className: 'dcs-icon-action',
          title: tr('pluginUpdate.check'),
          'aria-label': tr('pluginUpdate.check'),
          disabled: busy,
          onClick: checkPlugin,
        }, busy ? h('span', { className: 'dcs-spinner dcs-spinner--tiny' }) : h(RefreshCwIcon, { size: 16 })),
        h('button', {
          type: 'button',
          className: 'dcs-icon-action dcs-icon-action--danger',
          title: tr('uninstall.button'),
          'aria-label': tr('uninstall.button'),
          onClick: () => setStore({ modal: { kind: 'uninstall' } }),
        }, h(PackageXIcon, { size: 17 })),
      );
    }

    function Hero({ state }) {
      const status = statusOf(state);
      const account = state.account;
      const repo = state.repo;
      return h('section', { className: 'dcs-hero' },
        h('div', { className: 'dcs-hero-top' },
          h('div', { className: 'dcs-hero-identity' },
            h('div', { className: 'dcs-hero-mark' }, h(PanelIcon, { size: 42, active: true })),
            h('div', { className: 'dcs-hero-copy' },
              h('div', { className: 'dcs-eyebrow' }, tr('page.eyebrow')),
              h('h1', { className: 'dcs-title' }, tr('page.title')),
              h('p', { className: 'dcs-subtitle' }, tr('page.subtitle')),
            ),
          ),
          h('div', { className: 'dcs-hero-status' },
            h(Badge, { tone: status.tone, dot: true }, status.label),
            h('span', { className: 'dcs-hero-version' }, tr('page.version', { version: VERSION })),
            h(TopActions, { state }),
          ),
        ),
        h('div', { className: 'dcs-hero-meta' },
          h('div', { className: 'dcs-hero-meta-item' },
            h(Avatar, { account }),
            h('div', null,
              h('span', { className: 'dcs-meta-label' }, tr('hero.account')),
              h('strong', null, account?.displayName || account?.login || '—'),
            ),
          ),
          h('div', { className: 'dcs-hero-meta-item' },
            h('span', { className: 'dcs-meta-glyph' }, h(CloudIcon, { size: 17 })),
            h('div', null,
              h('span', { className: 'dcs-meta-label' }, tr('hero.device')),
              h('strong', null, state.device?.name || '—'),
            ),
          ),
          h('div', { className: 'dcs-hero-meta-item' },
            h('span', { className: 'dcs-meta-glyph' }, h(DatabaseIcon, { size: 17 })),
            h('div', null,
              h('span', { className: 'dcs-meta-label' }, tr('hero.repo')),
              repo?.htmlUrl
                ? h('a', { className: 'dcs-meta-link', href: repo.htmlUrl, target: '_blank', rel: 'noreferrer' },
                  repo.fullName, h(LinkIcon, { size: 13 }))
                : h('strong', null, repo?.fullName || '—'),
              h('span', { className: 'dcs-meta-sub' }, repo?.private ? tr('hero.private') : '', repo?.defaultBranch ? ` · ${tr('hero.branch', { branch: repo.defaultBranch })}` : ''),
            ),
          ),
          h('div', { className: 'dcs-hero-meta-item' },
            h('span', { className: 'dcs-meta-glyph' }, h(CheckIcon, { size: 17 })),
            h('div', null,
              h('span', { className: 'dcs-meta-label' }, tr('hero.syncValue')),
              h('code', { className: 'dcs-code' }, state.sync?.lastSeenShort || '—'),
            ),
          ),
        ),
      );
    }

    function SyncPanel({ state }) {
      const [checking, setChecking] = React.useState(false);
      const [error, setError] = React.useState('');
      const [pushOpen, setPushOpen] = React.useState(false);
      const [emptyRepo, setEmptyRepo] = React.useState(Boolean(
        state?.loggedIn && !state?.sync?.remoteHead && !state?.sync?.lastPushAt,
      ));
      const head = state.sync?.remoteHead;
      const relation = state.sync?.relation || 'same';
      const behind = relation === 'remote-newer' || relation === 'diverged';
      const localAhead = relation === 'local-newer';
      const relationLabel = relation === 'diverged'
        ? tr('status.diverged')
        : behind ? tr('status.behind') : localAhead ? tr('status.localAhead') : tr('status.synced');
      const relationTone = relation === 'same' ? 'success' : 'warning';
      React.useEffect(() => {
        if (state.sync?.remoteHead) setEmptyRepo(false);
      }, [state.sync?.remoteHead]);

      const check = async () => {
        if (checking) return;
        setChecking(true);
        setError('');
        try {
          const result = await perform('check');
          if (result.empty) {
            setEmptyRepo(true);
            showToast(tr('update.emptyRepo'), 'info');
          } else if (result.relation === 'local-newer') {
            setEmptyRepo(false);
            setStore({ modal: { kind: 'check-result', result } });
          } else if (result.relation === 'diverged') {
            setEmptyRepo(false);
            setStore({ modal: { kind: 'update', update: result } });
          } else if (result.available) {
            setEmptyRepo(false);
            setStore({ modal: { kind: 'update', update: result } });
          } else {
            setEmptyRepo(false);
            setStore({ modal: { kind: 'check-result', result } });
          }
        } catch (caught) {
          setError(caught.message);
        } finally {
          setChecking(false);
        }
      };

      const downloadLatest = async () => {
        if (checking || state.busy) return;
        setChecking(true);
        setError('');
        try {
          const result = await perform('check');
          if (result.head) setStore({ modal: { kind: 'update', update: result } });
          else showToast(tr('update.emptyRepo'), 'info');
        } catch (caught) {
          setError(caught.message);
        } finally {
          setChecking(false);
        }
      };

      return h('section', { className: 'dcs-card dcs-sync-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('actions.check')),
            h('p', { className: 'dcs-card-sub' }, relationLabel),
          ),
          h(Badge, { tone: relationTone, dot: true }, relationLabel),
        ),
        h('div', { className: 'dcs-sync-grid' },
          h('div', { className: 'dcs-sync-block' },
            h('span', { className: 'dcs-label' }, tr('hero.syncValue')),
            h('code', { className: 'dcs-code dcs-code--large' }, state.sync?.lastSeenShort || '—'),
            h('span', { className: 'dcs-muted' }, state.sync?.lastCheckAt ? formatTime(state.sync.lastCheckAt) : tr('hero.never')),
          ),
          h('div', { className: 'dcs-sync-block' },
            h('span', { className: 'dcs-label' }, tr('hero.lastPush')),
            h('strong', { className: 'dcs-strong' }, state.sync?.lastPushAt ? formatTime(state.sync.lastPushAt) : tr('hero.never')),
            h('span', { className: 'dcs-muted' }, state.stats?.packageBytes ? formatBytes(state.stats.packageBytes) : '—'),
          ),
        ),
        h('div', { className: 'dcs-action-row' },
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--primary',
            disabled: checking || state.busy,
            onClick: check,
          }, checking ? tr('actions.checking') : tr('actions.check'), h(DownloadIcon, { size: 16 })),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--soft',
            disabled: state.busy,
            onClick: () => setPushOpen(true),
          }, tr('actions.push'), h(UploadIcon, { size: 16 })),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--ghost',
            disabled: checking || state.busy,
            onClick: downloadLatest,
          }, tr('actions.downloadLatest'), h(CloudDownloadIcon, { size: 16 })),
        ),
        state.sync?.scheduledPaused
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(AlertIcon, { size: 16 }),
            h('div', null,
              h('strong', null, tr('status.smartPaused')),
              h('p', null, tr('status.smartPausedDesc')),
            ))
          : null,
        localAhead || relation === 'diverged'
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(AlertIcon, { size: 16 }),
            h('div', null,
              h('strong', null, relation === 'diverged' ? tr('status.diverged') : tr('status.localAhead')),
              h('p', null, relation === 'diverged' ? tr('status.divergedDesc') : tr('status.localAheadDesc')),
            ))
          : null,
        error ? h(ErrorLine, null, error) : null,
        emptyRepo
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(AlertIcon, { size: 16 }),
            h('div', null,
              h('strong', null, tr('update.emptyRepo')),
              h('p', null, tr('update.emptyRepoHint')),
            ),
            h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--soft dcs-btn--small',
              onClick: () => setPushOpen(true),
            }, tr('actions.push')),
          ) : null,
        state.agreement?.required
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(AlertIcon, { size: 16 }),
            h('div', null,
              h('strong', null, tr('legal.unsigned')),
              h('p', null, tr('settings.agreementRequired')),
            ),
            h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--soft dcs-btn--small',
              onClick: () => setStore({ modal: { kind: 'agreement' } }),
            }, tr('legal.view')),
          ) : null,
        state.encryption?.enabled && state.encryption?.locked
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(LockIcon, { size: 16 }),
            h('div', null,
              h('strong', null, tr('encryption.locked')),
              h('p', null, tr('encryption.lockedDesc')),
            ),
            h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--soft dcs-btn--small',
              onClick: () => setStore({ modal: { kind: 'unlock' } }),
            }, tr('actions.unlock')),
          ) : null,
        pushOpen ? h(PushDialog, {
          state,
          onClose: () => setPushOpen(false),
          onCommitted: () => setEmptyRepo(false),
        }) : null,
      );
    }

    function sessionDisplayName(record) {
      const workspace = String(record.project || '').replace(/^--|--$/g, '').replace(/-/g, ' / ');
      const id = String(record.id || '').replace(/^session-/, '');
      return workspace ? `${workspace} · ${id}` : id;
    }

    function PushDialog({ state, onClose, onCommitted }) {
      const [sessions, setSessions] = React.useState(null);
      const [selected, setSelected] = React.useState(() => new Set());
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState('');
      const [passphrase, setPassphrase] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [progress, setProgress] = React.useState(0);
      const [mode, setMode] = React.useState('incremental');
      const [pullRequired, setPullRequired] = React.useState(false);
      const progressTimer = React.useRef(null);
      const needsPassphrase = Boolean(state.encryption?.enabled && state.encryption?.locked);
      const allSelected = Boolean(sessions && sessions.length > 0 && selected.size === sessions.length);

      /* A partial selection cannot replace the shared snapshot, so the mode follows it. */
      React.useEffect(() => {
        if (!allSelected && mode === 'force') setMode('incremental');
      }, [allSelected, mode]);

      React.useEffect(() => () => {
        if (progressTimer.current) clearInterval(progressTimer.current);
      }, []);

      const progressStage = progress >= 100
        ? tr('push.progress.done')
        : progress >= 78
          ? tr('push.progress.head')
          : progress >= 45
            ? tr('push.progress.upload')
            : progress >= 16
              ? tr('push.progress.package')
              : tr('push.progress.prepare');

      React.useEffect(() => {
        let cancelled = false;
        api('sessions').then((result) => {
          if (cancelled) return;
          const list = Array.isArray(result.sessions) ? result.sessions : [];
          setSessions(list);
          setSelected(new Set(list.map((session) => session.relPath)));
        }).catch((caught) => {
          if (!cancelled) setError(caught.message);
        }).finally(() => {
          if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
      }, []);

      const toggle = (relPath) => {
        setSelected((previous) => {
          const next = new Set(previous);
          if (next.has(relPath)) next.delete(relPath);
          else next.add(relPath);
          return next;
        });
      };

      const toggleAll = () => {
        if (!sessions) return;
        setSelected(allSelected ? new Set() : new Set(sessions.map((session) => session.relPath)));
      };

      const submit = async () => {
        if (busy || !selected.size) return;
        if (needsPassphrase && !passphrase) {
          setError(tr('encryption.passphraseRequired'));
          return;
        }
        setBusy(true);
        setError('');
        setPullRequired(false);
        setProgress(8);
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = setInterval(() => {
          setProgress((value) => {
            if (value >= 90) return value;
            const step = value < 30 ? 7 : value < 65 ? 4 : 2;
            return Math.min(90, value + step);
          });
        }, 420);
        try {
          const result = await perform('push', {
            mode,
            allSelected,
            passphrase,
            sessionRelPaths: [...selected],
          });
          if (progressTimer.current) clearInterval(progressTimer.current);
          progressTimer.current = null;
          setProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 360));
          if (result.noop) showToast(tr('toast.noChanges'), 'info');
          else showToast(tr('toast.pushed'), 'success');
          onCommitted?.();
          onClose();
        } catch (caught) {
          if (progressTimer.current) clearInterval(progressTimer.current);
          progressTimer.current = null;
          setProgress(0);
          if (caught.code === 'pull-required' || caught.code === 'remote-ahead') setPullRequired(true);
          else setError(caught.message);
        } finally {
          setBusy(false);
        }
      };

      /* Both sides moved: merge the repository into this device first, then retry. */
      const pullThenPush = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          await perform('pull', { passphrase, mode: 'incremental' });
          setPullRequired(false);
          setBusy(false);
          await submit();
        } catch (caught) {
          setBusy(false);
          setError(caught.message);
        }
      };

      return h(Modal, {
        title: tr('push.title'),
        subtitle: tr('push.subtitle'),
        wide: true,
        onClose: busy ? null : onClose,
        className: 'dcs-push-modal',
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--primary',
            disabled: busy || loading || selected.size === 0,
            onClick: submit,
          }, busy ? tr('actions.pushing') : tr('push.submit', { count: selected.size }))),
      },
        busy
          ? h('div', { className: 'dcs-progress-card', role: 'status', 'aria-live': 'polite' },
            h('div', { className: 'dcs-progress-head' },
              h('span', { className: 'dcs-progress-stage' }, progressStage),
              h('strong', { className: 'dcs-progress-value' }, `${Math.min(100, Math.round(progress))}%`),
            ),
            h('div', { className: 'dcs-progress-track' },
              h('span', { className: 'dcs-progress-fill', style: { width: `${Math.min(100, progress)}%` } }),
            ),
            h('p', { className: 'dcs-progress-hint' }, tr('push.progress.hint')),
          )
          : null,
        loading
          ? h('div', { className: 'dcs-loading' }, h('span', { className: 'dcs-spinner dcs-spinner--small' }), tr('push.loading'))
          : sessions && sessions.length > 0
            ? h(React.Fragment, null,
              h('div', { className: 'dcs-session-toolbar' },
                h('label', { className: 'dcs-check-row' },
                  h('input', { type: 'checkbox', checked: allSelected, onChange: toggleAll }),
                  h('span', null, tr('push.selectAll'))),
                h('span', { className: 'dcs-muted' }, tr('push.selected', { count: selected.size })),
              ),
              h('fieldset', { className: 'dcs-push-mode' },
                h('legend', { className: 'dcs-push-mode-title' }, tr('push.mode.label')),
                h('label', {
                  className: `dcs-mode-option${mode === 'force' ? ' is-active' : ''}${allSelected ? '' : ' is-disabled'}`,
                },
                h('input', {
                  type: 'radio',
                  name: 'dcs-push-mode',
                  checked: mode === 'force',
                  disabled: !allSelected,
                  onChange: () => setMode('force'),
                }),
                h('span', { className: 'dcs-mode-copy' },
                  h('strong', { className: 'dcs-mode-name' }, tr('push.mode.force')),
                  h('span', { className: 'dcs-mode-desc' }, tr('push.mode.forceDesc')))),
                h('label', {
                  className: `dcs-mode-option${mode === 'incremental' ? ' is-active' : ''}`,
                },
                h('input', {
                  type: 'radio',
                  name: 'dcs-push-mode',
                  checked: mode === 'incremental',
                  onChange: () => setMode('incremental'),
                }),
                h('span', { className: 'dcs-mode-copy' },
                  h('strong', { className: 'dcs-mode-name' }, tr('push.mode.incremental')),
                  h('span', { className: 'dcs-mode-desc' }, tr('push.mode.incrementalDesc')))),
                !allSelected ? h('p', { className: 'dcs-mode-hint' }, tr('push.mode.autoIncremental')) : null,
              ),
              h('div', { className: 'dcs-session-list' },
                sessions.map((session) => h('label', { className: 'dcs-session-row', key: session.relPath },
                  h('input', {
                    type: 'checkbox',
                    checked: selected.has(session.relPath),
                    onChange: () => toggle(session.relPath),
                  }),
                  h('span', { className: 'dcs-session-main' },
                    h('strong', { className: 'dcs-session-name', title: sessionDisplayName(session) }, sessionDisplayName(session)),
                    h('span', { className: 'dcs-session-meta' },
                      h('span', null, formatTime(session.updatedAt)),
                      session.live ? h('span', { className: 'dcs-session-live' }, tr('push.live')) : null),
                  ),
                  h('span', { className: 'dcs-session-size' }, formatBytes(session.size)),
                )),
              ),
              needsPassphrase
                ? h(Field, { label: tr('push.passphrase') },
                  h(PassphraseInput, { value: passphrase, onChange: setPassphrase }))
                : null,
              pullRequired
                ? h('div', { className: 'dcs-inline-warning' },
                  h(AlertIcon, { size: 16 }),
                  h('div', null,
                    h('strong', null, tr('overwrite.title')),
                    h('p', null, tr('push.pullRequired')),
                  ),
                  h('button', {
                    type: 'button',
                    className: 'dcs-btn dcs-btn--soft dcs-btn--small',
                    disabled: busy,
                    onClick: pullThenPush,
                  },
                  tr('push.pullThenPush')),
                )
                : null,
            )
            : h(EmptyState, {
              icon: h(DatabaseIcon, { size: 22 }),
              title: tr('push.none'),
              desc: tr('push.noneDesc'),
            }),
        error ? h(ErrorLine, null, error) : null,
      );
    }


    function localizeCommitMessage(message) {
      // Repositories synced before 0.9.0 carry commit messages with the old package
      // name; normalise them so existing history keeps its Chinese labels.
      const text = String(message || '').trim().replace(/dsh-chat-sync(?![\w-])/g, 'dsh-chat-syncer');
      const exact = {
        'chore: remove superseded dsh-chat-syncer package': '移除旧同步包',
        'chore: update dsh-chat-syncer device': '更新设备信息',
        'chore: update dsh-chat-syncer device manifest': '更新设备清单',
        'chore: record dsh-chat-syncer consent': '记录数据上传协议',
        'chore: update dsh-chat-syncer account': '更新账号信息',
        'chore: remove plaintext manifest': '移除明文会话清单',
        'chore: update dsh-chat-syncer recovery envelope': '更新口令恢复文件',
        'chore: delete dsh-chat-syncer user data': '删除用户同步数据',
        'docs: add dsh-chat-syncer data README': '文档：新增数据仓库说明',
        'docs: initialize dsh-chat-syncer data README': '文档：初始化数据仓库说明',
        'docs: expand data repository README': '文档：完善数据仓库说明',
        'docs: withdraw dsh-chat-syncer consent': '撤回数据上传协议',
      };
      if (exact[text]) return exact[text];
      if (text.startsWith('chore: dsh-chat-syncer snapshot ')) {
        return `同步快照 ${text.slice('chore: dsh-chat-syncer snapshot '.length)}`;
      }
      if (text.startsWith('docs: ')) return `文档：${text.slice(6)}`;
      if (text.startsWith('chore: ')) return `维护：${text.slice(7)}`;
      if (text.startsWith('feat: ')) return `功能：${text.slice(6)}`;
      return text;
    }

    function SessionPicker({ title, subtitle, load, onClose, onConfirm }) {
      const [groups, setGroups] = React.useState(null);
      const [selected, setSelected] = React.useState(() => new Set());
      const [encrypted, setEncrypted] = React.useState(false);
      const [error, setError] = React.useState('');

      React.useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const result = await load();
            if (cancelled) return;
            const list = Array.isArray(result.groups) ? result.groups : [];
            if (result.encrypted || list.length === 0) { setEncrypted(Boolean(result.encrypted)); setGroups(list); return; }
            setGroups(list);
            setSelected(new Set(list.flatMap((group) => group.sessions.map((session) => session.relPath))));
          } catch (caught) {
            if (!cancelled) setError(caught.message);
          }
        })();
        return () => { cancelled = true; };
      }, []);

      const toggle = (relPath) => setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(relPath)) next.delete(relPath); else next.add(relPath);
        return next;
      });
      const toggleGroup = (group) => setSelected((previous) => {
        const next = new Set(previous);
        const paths = group.sessions.map((session) => session.relPath);
        const all = paths.every((relPath) => next.has(relPath));
        for (const relPath of paths) { if (all) next.delete(relPath); else next.add(relPath); }
        return next;
      });
      const allPaths = (groups || []).flatMap((group) => group.sessions.map((session) => session.relPath));
      const allSelected = allPaths.length > 0 && selected.size === allPaths.length;
      const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allPaths));

      return h(Modal, {
        title: title || tr('picker.title'),
        subtitle: subtitle || tr('picker.desc'),
        wide: true,
        onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: onClose }, tr('actions.cancel')),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--primary',
            disabled: !encrypted && selected.size === 0,
            onClick: () => onConfirm(encrypted ? undefined : [...selected]),
          }, encrypted ? tr('versions.incremental') : tr('picker.download', { count: selected.size }))),
      },
        encrypted ? h('p', { className: 'dcs-muted' }, tr('picker.encrypted')) : null,
        groups === null
          ? h('p', { className: 'dcs-muted' }, tr('picker.loading'))
          : groups.length === 0
            ? h('p', { className: 'dcs-muted' }, tr('picker.empty'))
            : h('div', { className: 'dcs-session-list' },
              h('div', { className: 'dcs-session-toolbar' },
                h('label', { className: 'dcs-check-row' },
                  h('input', { type: 'checkbox', checked: allSelected, onChange: toggleAll }),
                  h('span', null, tr('picker.all'))),
                h('span', { className: 'dcs-muted' }, tr('picker.download', { count: selected.size }))),
              groups.map((group) => h('div', { key: group.project },
                h('label', { className: 'dcs-check-row dcs-session-group' },
                  h('input', {
                    type: 'checkbox',
                    checked: group.sessions.every((session) => selected.has(session.relPath)),
                    onChange: () => toggleGroup(group),
                  }),
                  h('strong', null, group.project),
                  h('span', { className: 'dcs-muted' }, tr('picker.group', { count: group.sessions.length }))),
                group.sessions.map((session) => h('label', { className: 'dcs-session-row dcs-session-row--nested', key: session.relPath },
                  h('input', { type: 'checkbox', checked: selected.has(session.relPath), onChange: () => toggle(session.relPath) }),
                  h('span', { className: 'dcs-session-main' },
                    h('strong', { className: 'dcs-session-name' }, sessionDisplayName({ project: session.project, id: session.id })),
                    h('span', { className: 'dcs-session-meta' }, formatTime(session.updatedAt))),
                  h('span', { className: 'dcs-session-size' }, formatBytes(session.size))))))),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    function VersionsPanel({ state }) {
      const [busy, setBusy] = React.useState(false);
      const [versions, setVersions] = React.useState(null);
      const [error, setError] = React.useState('');
      const [target, setTarget] = React.useState(null);
      const [pending, setPending] = React.useState(null);

      const load = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          const result = await perform('versions', { limit: 3 }, { silent: true });
          setVersions(Array.isArray(result.versions) ? result.versions : []);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };

      const download = async (version, mode, sessionRelPaths) => {
        if (busy) return;
        setBusy(true);
        setError('');
        setTarget(null);
        setPending(null);
        try {
          const result = await perform('pull-version', {
            sha: version.sha,
            mode,
            ...(Array.isArray(sessionRelPaths) ? { sessionRelPaths } : {}),
          }, { silent: true });
          showToast(tr('versions.done', { count: (result.added || 0) + (result.updated || 0) }), 'success', {
            label: tr('actions.reload'),
            onClick: () => window.location.reload(),
          });
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };

      return h('section', { className: 'dcs-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h3', { className: 'dcs-card-title' }, tr('versions.title')),
            h('p', { className: 'dcs-card-sub' }, tr('versions.desc')),
          ),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft', disabled: busy, onClick: load },
            busy ? tr('versions.loading') : tr('versions.load')),
        ),
        versions && versions.length === 0
          ? h('p', { className: 'dcs-muted' }, tr('versions.empty'))
          : null,
        versions && versions.length > 0
          ? h('div', { className: 'dcs-versions' },
            versions.map((version) => h('div', { className: 'dcs-version-row', key: version.sha },
              h('div', { className: 'dcs-version-main' },
                h('strong', null, version.revision),
                h('span', { className: 'dcs-muted' },
                  `${version.deviceName ? `${version.deviceName} · ` : ''}${formatTime(version.updatedAt || version.date)} · ${tr('versions.sessions', { count: version.sessionCount || 0 })}`)),
              h('div', { className: 'dcs-version-actions' },
                h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft dcs-btn--small', disabled: busy, onClick: () => setPending({ version, mode: 'incremental' }) },
                  tr('versions.incremental')),
                h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger dcs-btn--small', disabled: busy, onClick: () => setTarget(version) },
                  tr('versions.force')))))
          )
          : null,
        error ? h(ErrorLine, null, error) : null,
        target
          ? h(Modal, {
            title: tr('versions.forceTitle'),
            subtitle: target.revision,
            onClose: () => setTarget(null),
            footer: h(React.Fragment, null,
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: () => setTarget(null) }, tr('actions.cancel')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger', onClick: () => { setPending({ version: target, mode: 'force' }); setTarget(null); } }, tr('versions.force'))),
          }, h('p', null, tr('versions.forceBody')))
          : null,
        pending
          ? h(SessionPicker, {
            title: tr('picker.title'),
            subtitle: pending.version.revision,
            load: () => perform('remote-sessions', { sha: pending.version.sha }, { silent: true }),
            onClose: () => setPending(null),
            onConfirm: (paths) => download(pending.version, pending.mode, paths),
          })
          : null,
      );
    }

    function HistoryPanel({ state }) {
      const [commits, setCommits] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const load = async () => {
        setBusy(true);
        setError('');
        try {
          const result = await api('history', { limit: 20 });
          setCommits(Array.isArray(result.commits) ? result.commits : []);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      React.useEffect(() => { void load(); }, [state?.sync?.lastPushAt]);
      return h('section', { className: 'dcs-card dcs-history-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('history.title')),
            h('p', { className: 'dcs-card-sub' }, tr('history.subtitle')),
          ),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', disabled: busy, onClick: load },
            busy ? tr('actions.loading') : tr('history.refresh')),
        ),
        error ? h(ErrorLine, null, error) : null,
        commits === null
          ? h('div', { className: 'dcs-loading' }, h('span', { className: 'dcs-spinner dcs-spinner--small' }), tr('history.loading'))
          : commits.length === 0
            ? h('p', { className: 'dcs-muted dcs-history-empty' }, tr('history.empty'))
            : h('div', { className: 'dcs-history-list' },
              commits.map((commit) => h('div', { className: 'dcs-history-row', key: commit.sha || commit.shortSha },
                h('code', { className: 'dcs-history-sha' }, commit.shortSha || commit.sha?.slice(0, 8) || '—'),
                h('div', { className: 'dcs-history-copy' },
                  h('strong', null, localizeCommitMessage(commit.message) || tr('common.unknown')),
                  h('span', null, [commit.author, commit.date ? formatTime(commit.date) : ''].filter(Boolean).join(' · ')),
                ),
                commit.htmlUrl
                  ? h('a', { className: 'dcs-link-btn', href: commit.htmlUrl, target: '_blank', rel: 'noreferrer' }, tr('history.open'))
                  : null,
              )),
            ),
      );
    }


    function StatsPanel({ state }) {
      const stats = state.stats || {};
      const items = [
        { label: tr('stats.sessions'), value: stats.sessions || 0, icon: h(DatabaseIcon, { size: 17 }) },
        { label: tr('stats.workspaces'), value: stats.workspaces || 0, icon: h(CloudIcon, { size: 17 }) },
        { label: tr('stats.sourceBytes'), value: formatBytes(stats.bytes || 0), icon: h(UploadIcon, { size: 17 }) },
        { label: tr('stats.packageBytes'), value: formatBytes(stats.packageBytes || 0), icon: h(LockIcon, { size: 17 }) },
      ];
      return h('section', { className: 'dcs-card dcs-stats-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('stats.title')),
            h('p', { className: 'dcs-card-sub' }, state.paths?.sessions || ''),
          ),
        ),
        h('div', { className: 'dcs-stats-grid' },
          items.map((item) => h('div', { className: 'dcs-stat', key: item.label },
            h('span', { className: 'dcs-stat-icon' }, item.icon),
            h('div', null,
              h('span', { className: 'dcs-stat-label' }, item.label),
              h('strong', { className: 'dcs-stat-value' }, item.value),
            ),
          )),
        ),
      );
    }

    function AccountPanel({ state }) {
      const [removeTarget, setRemoveTarget] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const accounts = Array.isArray(state.accounts) ? state.accounts : [];
      const others = accounts.filter((account) => !account.active);
      const current = accounts.find((account) => account.active)
        || (state.account ? {
          userKey: state.userKey,
          provider: state.provider,
          login: state.account.login,
          displayName: displayNameOf(state),
          repo: state.repo?.fullName,
          active: true,
        } : null);
      const switchTo = async (account) => {
        if (busy) return;
        setBusy(true);
        try {
          const result = await perform('switch-user', { userKey: account.userKey });
          showToast(tr('account.switched', { name: account.displayName || account.login }), 'success');
          if (result.state) setStore({ state: result.state });
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy(false);
        }
      };
      const logout = async () => {
        if (busy) return;
        setBusy(true);
        try {
          await perform('logout');
          showToast(tr('account.hint'), 'info');
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy(false);
        }
      };
      const remove = async () => {
        if (!removeTarget || busy) return;
        setBusy(true);
        try {
          await perform('delete-account', { userKey: removeTarget.userKey });
          showToast(tr('account.removed'), 'success');
          setRemoveTarget(null);
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy(false);
        }
      };
      return h('section', { className: 'dcs-card dcs-account-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('account.title')),
            h('p', { className: 'dcs-card-sub' }, tr('account.subtitle')),
          ),
          h(Badge, { tone: 'success', dot: true }, tr('account.current')),
        ),
        current ? h('div', { className: 'dcs-account-current' },
          h(Avatar, { account: state.account }),
          h('div', { className: 'dcs-account-copy' },
            h('strong', null, current.displayName || current.login),
            h('span', null, `${current.provider === 'github' ? 'GitHub' : 'Gitee'} · ${current.login}`),
            h('span', { className: 'dcs-account-repo' }, current.repo || state.repo?.fullName || ''),
          ),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', disabled: busy, onClick: logout }, tr('account.logout')),
        ) : null,
        h('div', { className: 'dcs-account-identities' },
          h('div', null, h('span', { className: 'dcs-label' }, tr('account.dshUser')), h('strong', null, state.dshUser || state.device?.username || '—')),
          h('div', null, h('span', { className: 'dcs-label' }, tr('account.repoUser')), h('strong', null, current?.login || '—')),
        ),
        h('div', { className: 'dcs-account-others' },
          h('div', { className: 'dcs-account-others-head' },
            h('span', { className: 'dcs-label' }, tr('account.others')),
            h('span', { className: 'dcs-muted' }, tr('account.hint')),
          ),
          others.length > 0
            ? others.map((account) => h('div', { className: 'dcs-account-row', key: account.userKey },
              h('div', { className: 'dcs-account-copy' },
                h('strong', null, account.displayName || account.login),
                h('span', null, `${account.provider === 'github' ? 'GitHub' : 'Gitee'} · ${account.login}`),
                h('span', { className: 'dcs-account-repo' }, account.repo || ''),
              ),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft dcs-btn--small', disabled: busy, onClick: () => switchTo(account) }, tr('account.switch')),
              h('button', {
                type: 'button',
                className: 'dcs-icon-btn',
                title: tr('account.remove'),
                'aria-label': tr('account.remove'),
                disabled: busy,
                onClick: () => setRemoveTarget(account),
              }, h(TrashIcon, { size: 14 })),
            ))
            : h('p', { className: 'dcs-muted dcs-account-empty' }, tr('account.none')),
        ),
        h('button', { type: 'button', className: 'dcs-link-btn dcs-account-add', onClick: logout, disabled: busy }, tr('account.add')),
        removeTarget ? h(Modal, {
          title: tr('account.removeTitle'),
          subtitle: tr('account.removeDesc'),
          onClose: busy ? null : () => setRemoveTarget(null),
          footer: h(React.Fragment, null,
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: () => setRemoveTarget(null) }, tr('actions.cancel')),
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger', disabled: busy, onClick: remove }, busy ? tr('actions.saving') : tr('account.removeConfirm'))),
        },
          h('p', { className: 'dcs-fineprint' }, tr('account.keepData')),
        ) : null,
      );
    }


    function IdentityFields({ state }) {
      const [displayName, setDisplayName] = React.useState(displayNameOf(state));
      const [deviceName, setDeviceName] = React.useState(state.device?.name || '');
      const [editingDevice, setEditingDevice] = React.useState(false);
      const [showDeviceDetails, setShowDeviceDetails] = React.useState(false);
      const [editUsername, setEditUsername] = React.useState(state.device?.username || '');
      const [editHostname, setEditHostname] = React.useState(state.device?.hostname || '');
      const [savingField, setSavingField] = React.useState('');
      const [saving, setSaving] = React.useState(false);
      React.useEffect(() => {
        if (!editingDevice) {
          setEditUsername(state.device?.username || '');
          setEditHostname(state.device?.hostname || '');
        }
      }, [state.device?.username, state.device?.hostname, editingDevice]);
      React.useEffect(() => setDisplayName(displayNameOf(state)), [state.displayName, state.account?.login]);
      React.useEffect(() => {
        if (!editingDevice) setDeviceName(state.device?.name || '');
      }, [state.device?.name, editingDevice]);

      const saveName = async () => {
        const value = displayName.trim();
        if (!value || value === displayNameOf(state)) return;
        setSaving(true);
        try {
          await perform('rename', { displayName: value });
          showToast(tr('settings.saved'), 'success');
        } catch {
          /* Error is already surfaced. */
        } finally {
          setSaving(false);
        }
      };
      const saveDeviceField = async (field, value) => {
        if (savingField) return;
        setSavingField(field);
        try {
          await perform('settings', { [field]: value });
          showToast(tr('settings.saved'), 'success');
        } catch {
          /* Error is surfaced by perform. */
        } finally {
          setSavingField('');
        }
      };
      const deviceEditRow = (label, value, onChange, field, readOnly = false) => h('div', { className: 'dcs-device-edit-row' },
        h('span', { className: 'dcs-device-edit-label' }, label),
        readOnly
          ? h('strong', { className: 'dcs-device-edit-readonly' }, value || '—')
          : h('input', {
            className: 'dcs-input',
            value: value || '',
            maxLength: field === 'deviceName' ? 80 : 24,
            onChange: (event) => onChange(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') saveDeviceField(field, value);
            },
          }),
        h('button', {
          type: 'button',
          className: 'dcs-icon-btn dcs-device-check',
          title: readOnly ? tr('device.readOnly') : tr('device.check'),
          'aria-label': readOnly ? tr('device.readOnly') : tr('device.check'),
          disabled: readOnly || Boolean(savingField),
          onClick: () => saveDeviceField(field, value),
        }, savingField === field ? h('span', { className: 'dcs-spinner dcs-spinner--tiny' }) : h(CheckIcon, { size: 14 })),
      );

      return h(React.Fragment, null,
        h('div', { className: 'dcs-setting-grid dcs-identity-grid' },
          h(Field, { label: tr('settings.name'), hint: tr('settings.nameDesc') },
            h('div', { className: 'dcs-inline-input' },
              h('input', {
                className: 'dcs-input',
                value: displayName,
                maxLength: 60,
                onChange: (event) => setDisplayName(event.target.value),
                onBlur: saveName,
                onKeyDown: (event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                },
              }),
            ),
          ),
          h(Field, { label: tr('settings.device'), hint: tr('settings.deviceDesc') },
            !editingDevice
              ? h('div', { className: 'dcs-device-display' },
                h('span', { className: 'dcs-device-value', title: deviceName || state.device?.name }, deviceName || state.device?.name || '—'),
                h('button', {
                  type: 'button',
                  className: 'dcs-btn dcs-btn--ghost dcs-btn--small dcs-device-edit-btn',
                  title: tr('device.edit'),
                  'aria-label': tr('device.edit'),
                  onClick: () => setEditingDevice(true),
                }, h(EditIcon, { size: 13 }), h('span', null, tr('device.edit'))),
              )
              : h('div', { className: 'dcs-device-edit-panel' },
                deviceEditRow(tr('device.username'), editUsername, setEditUsername, 'deviceUsername'),
                deviceEditRow(tr('device.hostname'), editHostname, setEditHostname, 'deviceHostname'),
                deviceEditRow(tr('device.name'), deviceName, setDeviceName, 'deviceName'),
                deviceEditRow(tr('device.mac'), formatMac(state.device?.mac), () => {}, 'mac', true),
                deviceEditRow(tr('device.ip'), state.device?.ip, () => {}, 'ip', true),
                h('div', { className: 'dcs-device-edit-actions' },
                  h('button', {
                    type: 'button',
                    className: 'dcs-btn dcs-btn--ghost dcs-btn--small',
                    onClick: () => {
                      setEditUsername(state.device?.username || '');
                      setEditHostname(state.device?.hostname || '');
                      setDeviceName(state.device?.name || '');
                      setEditingDevice(false);
                    },
                  }, tr('actions.cancel')),
                ),
              ),
            h('div', { className: 'dcs-device-details' },
              h('button', {
                type: 'button',
                className: 'dcs-device-details-toggle',
                onClick: () => setShowDeviceDetails((value) => !value),
                'aria-expanded': showDeviceDetails,
              },
                h('span', { className: `dcs-device-details-chevron${showDeviceDetails ? ' is-open' : ''}` }, h(ChevronIcon, { size: 13 })),
                tr(showDeviceDetails ? 'device.hideDetails' : 'device.details'),
              ),
              showDeviceDetails
                ? h('div', { className: 'dcs-device-detail-panel' },
                  h('div', { className: 'dcs-device-detail-name' }, state.device?.name || tr('common.unknown')),
                  h('div', { className: 'dcs-device-detail-grid' },
                    h('span', null, tr('device.user')), h('strong', null, state.device?.username || '—'),
                    h('span', null, tr('device.host')), h('strong', null, state.device?.hostname || '—'),
                    h('span', null, tr('device.mac')), h('strong', null, formatMac(state.device?.mac)),
                    h('span', null, tr('device.ip')), h('strong', null, state.device?.ip || '—'),
                    h('span', null, tr('device.os')), h('strong', null, `${state.device?.os || '—'} ${state.device?.arch || ''}`.trim()),
                    h('span', null, tr('device.osVersion')), h('strong', null, state.device?.osVersion || '—'),
                    h('span', null, tr('device.uniqueId')), h('strong', null, state.device?.uniqueId || state.device?.fingerprint || '—'),
                  ),
                )
                : h('span', { className: 'dcs-device-identity' },
                  state.device?.mac ? `MAC ${state.device.mac}` : '',
                  state.device?.mac && state.device?.ip ? ' · ' : '',
                  state.device?.ip ? `IP ${state.device.ip}` : ''),
            ),
          ),
        ),
        saving ? h('span', { className: 'dcs-muted' }, tr('actions.saving')) : null,
      );
    }


    function RepairPage() {
      const [phase, setPhase] = React.useState('idle');
      const [scan, setScan] = React.useState(null);
      const [result, setResult] = React.useState(null);
      const [confirm, setConfirm] = React.useState(false);
      const [error, setError] = React.useState('');
      const [regPhase, setRegPhase] = React.useState('idle');
      const [regScan, setRegScan] = React.useState(null);
      const [regResult, setRegResult] = React.useState(null);
      const [regConfirm, setRegConfirm] = React.useState(false);
      const [regError, setRegError] = React.useState('');

      const runScan = async () => {
        if (phase !== 'idle') return;
        setPhase('scanning');
        setError('');
        setScan(null);
        setResult(null);
        try {
          const report = await perform('repair-attachments', { dryRun: true }, { silent: true });
          setScan(report);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setPhase('idle');
        }
      };

      const runRepair = async () => {
        setConfirm(false);
        setPhase('repairing');
        setError('');
        try {
          const report = await perform('repair-attachments', {}, { silent: true });
          setResult(report);
          setScan(null);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setPhase('idle');
        }
      };

      const scanRegistrations = async () => {
        if (regPhase !== 'idle') return;
        setRegPhase('scanning');
        setRegError('');
        setRegScan(null);
        setRegResult(null);
        try {
          setRegScan(await perform('repair-registrations', { dryRun: true }, { silent: true }));
        } catch (caught) {
          setRegError(caught.message);
        } finally {
          setRegPhase('idle');
        }
      };
      const runRegistrationRepair = async () => {
        setRegConfirm(false);
        setRegPhase('repairing');
        setRegError('');
        try {
          const result = await perform('repair-registrations', {}, { silent: true });
          setRegResult(result);
          setRegScan(null);
        } catch (caught) {
          setRegError(caught.message);
        } finally {
          setRegPhase('idle');
        }
      };

      const pending = Boolean(scan && scan.repaired > 0);
      const regPending = Boolean(regScan && (regScan.unregistered > 0 || regScan.missingWorkspace > 0));
      return h('div', { className: 'dcs-sync-view' },
        h('section', { className: 'dcs-card' },
          h('div', { className: 'dcs-card-head' },
            h('div', null,
              h('h3', { className: 'dcs-card-title' }, tr('repair.title')),
              h('p', { className: 'dcs-card-sub' }, tr('repair.desc')),
            ),
          ),
          h('div', { className: 'dcs-action-row' },
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft', disabled: phase !== 'idle', onClick: runScan },
              phase === 'scanning' ? tr('repair.scanning') : tr('repair.scan')),
            h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--primary',
              disabled: phase !== 'idle' || !pending,
              onClick: () => setConfirm(true),
            }, phase === 'repairing' ? tr('repair.repairing') : tr('repair.repair')),
          ),
          scan
            ? h('div', { className: 'dcs-repair-report' },
              h('p', null, pending
                ? tr('repair.summary', { scanned: scan.scanned || 0, sessions: scan.repaired || 0, blocks: scan.replaced || 0 })
                : tr('repair.none', { scanned: scan.scanned || 0 })),
              scan.sessions && scan.sessions.length
                ? h('ul', { className: 'dcs-repair-list' },
                  scan.sessions.slice(0, 40).map((item) => h('li', { key: item.relPath },
                    h('code', { className: 'dcs-code' }, item.relPath),
                    h('span', { className: 'dcs-muted' }, tr('repair.item', { count: item.replaced })))))
                : null,
            )
            : null,
          result
            ? h('p', { className: 'dcs-repair-done' }, tr('repair.done', {
              sessions: result.repaired || 0,
              blocks: result.replaced || 0,
              backups: result.backups || 0,
            }))
            : null,
          error ? h(ErrorLine, null, error) : null,
          h('p', { className: 'dcs-fineprint dcs-fineprint--muted' }, tr('repair.note')),
        ),
        h('section', { className: 'dcs-card dcs-card--spaced' },
          h('div', { className: 'dcs-card-head' },
            h('div', null,
              h('h3', { className: 'dcs-card-title' }, tr('reg.title')),
              h('p', { className: 'dcs-card-sub' }, tr('reg.desc')),
            ),
          ),
          h('div', { className: 'dcs-action-row' },
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft', disabled: regPhase !== 'idle', onClick: scanRegistrations },
              regPhase === 'scanning' ? tr('reg.scanning') : tr('reg.scan')),
            h('button', {
              type: 'button',
              className: 'dcs-btn dcs-btn--primary',
              disabled: regPhase !== 'idle' || !regPending,
              onClick: () => setRegConfirm(true),
            }, regPhase === 'repairing' ? tr('reg.repairing') : tr('reg.repair')),
          ),
          regScan
            ? h('div', { className: 'dcs-repair-report' },
              h('p', null, regScan.available === false
                ? tr('reg.unavailable')
                : regPending
                  ? tr('reg.summary', { sessions: regScan.sessions || 0, unregistered: regScan.unregistered || 0, missing: regScan.missingWorkspace || 0 })
                  : tr('reg.none', { sessions: regScan.sessions || 0 })),
              regPending
                ? h('ul', { className: 'dcs-repair-list' },
                  (regScan.items || []).map((item) => h('li', { key: item.sessionId },
                    h('code', { className: 'dcs-code' }, item.sessionId),
                    h('span', { className: 'dcs-muted' }, item.cwd))))
                : null,
            )
            : null,
          regResult
            ? h('p', { className: 'dcs-repair-done' }, tr('reg.done', { repaired: regResult.repaired || 0, cleared: regResult.cacheCleared || 0 }))
            : null,
          regError ? h(ErrorLine, null, regError) : null,
          h('p', { className: 'dcs-fineprint dcs-fineprint--muted' }, tr('reg.note')),
        ),
        regConfirm
          ? h(Modal, {
            title: tr('reg.confirmTitle'),
            subtitle: tr('reg.confirmBody', { count: (regScan && (regScan.unregistered + regScan.missingWorkspace)) || 0 }),
            onClose: () => setRegConfirm(false),
            footer: h(React.Fragment, null,
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: () => setRegConfirm(false) }, tr('actions.cancel')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: runRegistrationRepair }, tr('reg.repair'))),
          }, h('p', { className: 'dcs-muted' }, tr('reg.note')))
          : null,
        confirm
          ? h(Modal, {
            title: tr('repair.confirmTitle'),
            subtitle: tr('repair.confirmDesc'),
            onClose: () => setConfirm(false),
            footer: h(React.Fragment, null,
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', onClick: () => setConfirm(false) }, tr('actions.cancel')),
              h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: runRepair }, tr('repair.confirmRun'))),
          }, h('p', null, tr('repair.confirmBody', { sessions: scan?.repaired || 0, blocks: scan?.replaced || 0 })))
          : null,
      );
    }
    function SettingsPanel({ state }) {
      const [autoSync, setAutoSync] = React.useState(state.autoSync !== false);
      const [scheduledSync, setScheduledSync] = React.useState(state.scheduledSync !== false);
      const [smartSync, setSmartSync] = React.useState(state.smartSync !== false);
      const [syncInterval, setSyncInterval] = React.useState(state.syncInterval || '3h');
      const [saving, setSaving] = React.useState(false);
      React.useEffect(() => setAutoSync(state.autoSync !== false), [state.autoSync]);
      React.useEffect(() => setScheduledSync(state.scheduledSync !== false), [state.scheduledSync]);
      React.useEffect(() => setSmartSync(state.smartSync !== false), [state.smartSync]);
      React.useEffect(() => setSyncInterval(state.syncInterval || '3h'), [state.syncInterval]);

      const saveSettings = async (patch) => {
        setSaving(true);
        try {
          await perform('settings', patch);
          showToast(tr('settings.saved'), 'success');
        } catch {
          /* Error is already surfaced by perform. */
        } finally {
          setSaving(false);
        }
      };

      return h('section', { className: 'dcs-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('settings.title')),
            h('p', { className: 'dcs-card-sub' }, tr('settings.subtitle')),
          ),
          saving ? h('span', { className: 'dcs-muted' }, tr('actions.saving')) : null,
        ),
        h('div', { className: 'dcs-setting-row' },
          h('div', null,
            h('strong', null, tr('settings.auto')),
            h('p', null, tr('settings.autoDesc')),
          ),
          h(Toggle, {
            checked: autoSync,
            label: tr('settings.auto'),
            onChange: (next) => {
              setAutoSync(next);
              saveSettings({ autoSync: next });
            },
          }),
        ),
        h('div', { className: 'dcs-setting-row' },
          h('div', null,
            h('strong', null, tr('settings.scheduled')),
            h('p', null, tr('settings.scheduledDesc')),
          ),
          h(Toggle, {
            checked: scheduledSync,
            label: tr('settings.scheduled'),
            onChange: (next) => {
              setScheduledSync(next);
              saveSettings({ scheduledSync: next });
            },
          }),
        ),
        h('div', { className: 'dcs-setting-row' },
          h('div', null,
            h('strong', null, tr('settings.smart')),
            h('p', null, tr('settings.smartDesc')),
          ),
          h(Toggle, {
            checked: smartSync,
            label: tr('settings.smart'),
            onChange: (next) => {
              setSmartSync(next);
              saveSettings({ smartSync: next });
            },
          }),
        ),
        scheduledSync
          ? h('div', { className: 'dcs-setting-row dcs-setting-row--compact' },
            h('div', null,
              h('strong', null, tr('settings.interval')),
              h('p', null, tr('settings.intervalDesc')),
            ),
            h('select', {
              className: 'dcs-select',
              value: syncInterval,
              onChange: (event) => {
                const next = event.target.value;
                setSyncInterval(next);
                saveSettings({ syncInterval: next });
              },
            },
              ['10m', '20m', '30m', '1h', '3h', '6h', '12h', '24h'].map((value) => h('option', { key: value, value }, tr(`interval.${value}`))),
            ),
          )
          : null,
        h('div', { className: 'dcs-setting-row' },
          h('div', null,
            h('strong', null, tr('settings.syncMode')),
            h('p', null, tr('settings.syncModeDesc')),
          ),
        ),
      );
    }

    function EncryptionPanel({ state }) {
      const [dialog, setDialog] = React.useState(null);
      const enabled = Boolean(state.encryption?.enabled);
      const locked = Boolean(state.encryption?.locked);
      return h('section', { className: 'dcs-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('encryption.title')),
            h('p', { className: 'dcs-card-sub' }, tr('encryption.subtitle')),
          ),
          h(Badge, { tone: enabled ? 'success' : 'neutral', dot: true }, enabled ? tr('encryption.on') : tr('encryption.off')),
        ),
        h('div', { className: 'dcs-encryption-state' },
          h('span', { className: `dcs-crypto-mark${enabled ? ' is-on' : ''}` }, h(LockIcon, { size: 20 })),
          h('div', { className: 'dcs-encryption-copy' },
            h('strong', null, enabled ? tr('encryption.algorithm') : tr('encryption.off')),
            h('p', null, enabled
              ? (locked ? tr('encryption.lockedDesc') : tr('encryption.recoveryNote'))
              : tr('encryption.recoveryNote')),
          ),
          enabled
            ? h('div', { className: 'dcs-encryption-actions' },
              locked
                ? h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft dcs-btn--small', onClick: () => setStore({ modal: { kind: 'unlock' } }) }, tr('actions.unlock'))
                : h('span', { className: 'dcs-inline-status' }, h(CheckIcon, { size: 14 }), tr('encryption.unlocked')),
              state.encryption.local
                ? h(React.Fragment, null,
                  h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', onClick: () => setDialog('change') }, tr('encryption.change')),
                  h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', onClick: () => setDialog('disable') }, tr('encryption.disable')))
                : null,
            )
            : h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft dcs-btn--small', onClick: () => setDialog('enable') }, tr('encryption.enable')),
        ),
        enabled
          ? h('div', { className: 'dcs-inline-links' },
            state.encryption.recovery
              ? h('button', { type: 'button', className: 'dcs-link-btn', onClick: () => setDialog('recover') }, tr('encryption.recover'))
              : null,
            state.encryption.recovery ? h('span', { className: 'dcs-dot-sep' }, '·') : null,
            h('span', { className: 'dcs-muted' }, tr('encryption.recoveryNote')),
          )
          : null,
        dialog === 'enable' ? h(EncryptionDialog, {
          mode: 'enable',
          state,
          onClose: () => setDialog(null),
        }) : null,
        dialog === 'change' ? h(EncryptionDialog, {
          mode: 'change',
          state,
          onClose: () => setDialog(null),
        }) : null,
        dialog === 'recover' ? h(EncryptionDialog, {
          mode: 'recover',
          state,
          onClose: () => setDialog(null),
        }) : null,
        dialog === 'disable' ? h(ConfirmDialog, {
          title: tr('encryption.disableTitle'),
          message: tr('encryption.disableDesc'),
          confirmLabel: tr('encryption.disableConfirm'),
          danger: true,
          onClose: () => setDialog(null),
          onConfirm: async () => {
            const result = await perform('encryption', { enabled: false });
            setDialog(null);
            showToast(result.warning || tr('encryption.disabledToast'), result.warning ? 'info' : 'success');
            return result;
          },
        }) : null,
      );
    }

    function EncryptionDialog({ mode, onClose }) {
      const [oldPassphrase, setOldPassphrase] = React.useState('');
      const [passphrase, setPassphrase] = React.useState('');
      const [confirm, setConfirm] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const title = mode === 'enable'
        ? tr('encryption.enableTitle')
        : mode === 'change' ? tr('encryption.change') : tr('encryption.recoverTitle');
      const subtitle = mode === 'enable'
        ? tr('encryption.enableDesc')
        : mode === 'change' ? tr('encryption.enableDesc') : tr('encryption.recoverDesc');
      const submit = async () => {
        if (busy) return;
        if (passphrase.length < 8) {
          setError('口令至少需要 8 个字符');
          return;
        }
        if (passphrase !== confirm) {
          setError('两次输入的口令不一致');
          return;
        }
        setBusy(true);
        setError('');
        try {
          if (mode === 'enable') {
            const result = await perform('encryption', { enabled: true, passphrase, confirm });
            if (result.warning) showToast(result.warning, 'info');
            showToast(tr('encryption.enabledToast'), 'success');
          } else if (mode === 'change') {
            const result = await perform('change-passphrase', { oldPassphrase, passphrase, confirm });
            if (result.warning) showToast(result.warning, 'info');
            showToast(tr('encryption.changedToast'), 'success');
          } else {
            await perform('recover', { passphrase, confirm });
            showToast(tr('encryption.recoveredToast'), 'success');
          }
          onClose();
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title,
        subtitle,
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy, onClick: submit }, busy ? tr('actions.saving') : tr('actions.save'))),
      },
        mode === 'change'
          ? h(Field, { label: tr('encryption.old') },
            h(PassphraseInput, { value: oldPassphrase, onChange: setOldPassphrase, autoFocus: true }))
          : null,
        h(Field, { label: mode === 'change' ? tr('encryption.new') : tr('encryption.passphrase') },
          h(PassphraseInput, { value: passphrase, onChange: setPassphrase, autoFocus: mode !== 'change' })),
        h(Field, { label: tr('encryption.confirm') },
          h(PassphraseInput, { value: confirm, onChange: setConfirm })),
        h('p', { className: 'dcs-fineprint dcs-fineprint--muted' }, tr('encryption.recoveryNote')),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    function ConfirmDialog({ title, message, confirmLabel, danger = false, onClose, onConfirm, busyText }) {
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const confirm = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          await onConfirm();
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title,
        subtitle: message,
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', {
            type: 'button',
            className: `dcs-btn ${danger ? 'dcs-btn--danger' : 'dcs-btn--primary'}`,
            disabled: busy,
            onClick: confirm,
          }, busy ? (busyText || tr('actions.saving')) : confirmLabel)),
      }, error ? h(ErrorLine, null, error) : null);
    }

    /* ------------------------------------------------------------------ */
    /* Data management                                                    */
    /* ------------------------------------------------------------------ */

    function PluginUpdatePanel({ state }) {
      const [checking, setChecking] = React.useState(false);
      const [error, setError] = React.useState('');
      const check = async () => {
        if (checking) return;
        setChecking(true);
        setError('');
        try {
          const result = await perform('update-check');
          if (result.available) {
            setStore({ modal: { kind: 'plugin-update', update: result } });
          } else {
            showNotice(tr('pluginUpdate.upToDateDetail', { version: result.currentVersion || VERSION }));
          }
        } catch (caught) {
          setError(caught.message);
        } finally {
          setChecking(false);
        }
      };
      const setMode = async (mode) => {
        try {
          await perform('settings', { autoUpdateMode: mode });
          showToast(tr('settings.saved'), 'success');
        } catch {
          /* Error is surfaced by perform. */
        }
      };
      return h('section', { className: 'dcs-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('pluginUpdate.title')),
            h('p', { className: 'dcs-card-sub' }, tr('pluginUpdate.subtitle')),
          ),
          h(Badge, { tone: 'neutral', dot: true }, tr('pluginUpdate.current', { version: state.version || VERSION })),
        ),
        h('div', { className: 'dcs-update-card-row' },
          h('div', { className: 'dcs-update-card-copy' },
            h('strong', null, tr('pluginUpdate.auto')),
            h('p', null, tr('pluginUpdate.autoDesc')),
          ),
          h('select', {
            className: 'dcs-select',
            value: state.autoUpdateMode || 'off',
            onChange: (event) => setMode(event.target.value),
          },
            h('option', { value: 'off' }, tr('pluginUpdate.autoOff')),
            h('option', { value: 'prompt' }, tr('pluginUpdate.autoPrompt')),
            h('option', { value: 'install' }, tr('pluginUpdate.autoInstall')),
          ),
        ),
        h('div', { className: 'dcs-action-row' },
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--soft',
            disabled: checking,
            onClick: check,
          }, checking ? tr('pluginUpdate.checking') : tr('pluginUpdate.check'), h(DownloadIcon, { size: 16 })),
          h('a', {
            className: 'dcs-link-btn',
            href: 'https://gitee.com/user_gitee/dsh-chat-sync',
            target: '_blank',
            rel: 'noreferrer',
          }, tr('pluginUpdate.repo')),
        ),
        error ? h(ErrorLine, null, error) : null,
      );
    }


    function UninstallDialog({ onClose }) {
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [done, setDone] = React.useState('');
      const manager = () => {
        try {
          return runtime.remote && runtime.remote.pluginManager ? runtime.remote.pluginManager : null;
        } catch {
          return null;
        }
      };
      const uninstall = async () => {
        const pluginManager = manager();
        if (!pluginManager || typeof pluginManager.removeBundle !== 'function') {
          if (runtime.openPluginManager()) setDone('opened');
          else setDone('manual');
          return;
        }
        setBusy(true);
        setError('');
        try {
          const answer = await pluginManager.removeBundle(PACKAGE_NAME);
          if (!answer || answer.ok === false) {
            throw new Error((answer && answer.error && (answer.error.message || answer.error.code)) || tr('uninstall.failedGeneric'));
          }
          const value = answer.value || {};
          if (value.error && value.error.code === 'stop-profile') {
            setDone('restart');
            return;
          }
          if (value.application === 'failed') {
            throw new Error((value.error && (value.error.message || value.error.code)) || tr('uninstall.failedGeneric'));
          }
          if (value.application === 'cancelled') {
            setDone('cancelled');
            return;
          }
          if (value.application === 'restart-required') {
            setDone('restart');
            return;
          }
          try {
            await api('uninstall-cleanup');
          } catch {
            /* Profile cleanup is best effort; the plugin manager may already have removed it. */
          }
          let stillInstalled = false;
          if (typeof pluginManager.listBundles === 'function') {
            try {
              const listed = await pluginManager.listBundles();
              const payload = listed && listed.value ? listed.value : listed;
              const bundles = payload && (payload.bundles || payload.items);
              if (Array.isArray(bundles)) {
                stillInstalled = bundles.some((bundle) => [bundle?.name, bundle?.id, bundle?.bundle].includes(PACKAGE_NAME));
              }
            } catch {
              /* The inventory may already be gone with the plugin. */
            }
          }
          if (stillInstalled) {
            setDone('partial');
          } else {
            setDone('done');
            setTimeout(() => {
              try { window.location.reload(); } catch { /* manual refresh remains */ }
            }, 1200);
          }
        } catch (caught) {
          setError(caught.message || tr('uninstall.failedGeneric'));
        } finally {
          setBusy(false);
        }
      };
      const message = done === 'opened'
        ? tr('uninstall.opened')
        : done === 'manual'
          ? tr('uninstall.noManager')
          : done === 'restart'
            ? tr('uninstall.restart')
            : done === 'partial'
              ? tr('uninstall.partial')
              : done === 'cancelled'
                ? tr('uninstall.cancelled')
                : done === 'done'
                  ? tr('uninstall.done')
                  : '';
      return h(Modal, {
        title: tr('uninstall.confirmTitle'),
        subtitle: tr('uninstall.confirmDesc'),
        onClose: busy ? null : onClose,
        footer: done
          ? h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: onClose }, tr('actions.close'))
          : h(React.Fragment, null,
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger', disabled: busy, onClick: uninstall },
              busy ? tr('uninstall.busy') : tr('uninstall.confirm'))),
      },
        h('p', { className: 'dcs-fineprint' }, tr('uninstall.keepData')),
        message ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' }, h(AlertIcon, { size: 16 }), h('span', null, message)) : null,
        error ? h(ErrorLine, null, error) : null,
      );
    }

    function UninstallPanel() {
      return h('section', { className: 'dcs-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('uninstall.title')),
            h('p', { className: 'dcs-card-sub' }, tr('uninstall.subtitle')),
          ),
        ),
        h('div', { className: 'dcs-uninstall-row' },
          h('div', { className: 'dcs-uninstall-copy' },
            h('strong', null, tr('uninstall.warning')),
            h('p', null, tr('uninstall.desc')),
          ),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--danger',
            onClick: () => setStore({ modal: { kind: 'uninstall' } }),
          }, h(TrashIcon, { size: 15 }), tr('uninstall.button')),
        ),
      );
    }

    function DataPanel({ state, showDelete = true }) {
      const [dialog, setDialog] = React.useState(null);
      return h('section', { className: 'dcs-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('data.title')),
            h('p', { className: 'dcs-card-sub' }, tr('data.subtitle')),
          ),
        ),
        h('div', { className: 'dcs-data-grid' },
          h(DataAction, {
            icon: h(DownloadIcon, { size: 18 }),
            title: tr('data.export'),
            desc: tr('data.exportDesc'),
            action: tr('actions.download'),
            onClick: () => setDialog('export'),
          }),
          h(DataAction, {
            icon: h(UploadIcon, { size: 18 }),
            title: tr('data.import'),
            desc: tr('data.importDesc'),
            action: tr('actions.upload'),
            onClick: () => setDialog('import'),
          }),
          h(DataAction, {
            icon: h(UserIcon, { size: 18 }),
            title: tr('data.rename'),
            desc: tr('data.renameDesc'),
            action: tr('actions.edit'),
            onClick: () => setDialog('rename'),
          }),
          showDelete
            ? h(DataAction, {
              icon: h(AlertIcon, { size: 18 }),
              title: tr('data.delete'),
              desc: tr('data.deleteDesc'),
              action: tr('actions.delete'),
              danger: true,
              onClick: () => setDialog('delete'),
            })
            : null,
        ),
        dialog === 'export' ? h(ExportDialog, { state, onClose: () => setDialog(null) }) : null,
        dialog === 'import' ? h(ImportDialog, { onClose: () => setDialog(null) }) : null,
        dialog === 'rename' ? h(RenameDialog, { state, onClose: () => setDialog(null) }) : null,
        dialog === 'delete' ? h(DeleteDialog, { state, onClose: () => setDialog(null) }) : null,
      );
    }

    function DataAction({ icon, title, desc, action, onClick, danger = false }) {
      return h('div', { className: `dcs-data-action${danger ? ' is-danger' : ''}` },
        h('span', { className: 'dcs-data-icon' }, icon),
        h('div', { className: 'dcs-data-copy' },
          h('strong', null, title),
          h('p', null, desc),
        ),
        h('button', {
          type: 'button',
          className: `dcs-btn dcs-btn--small ${danger ? 'dcs-btn--danger-ghost' : 'dcs-btn--ghost'}`,
          onClick,
        }, action),
      );
    }

    function ExportDialog({ state, onClose }) {
      const [passphrase, setPassphrase] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const submit = async () => {
        if (busy) return;
        if (passphrase.length < 8) {
          setError(tr('data.exportPassphraseShort'));
          return;
        }
        setBusy(true);
        setError('');
        try {
          const result = await perform('export', { passphrase });
          downloadBase64(result.fileName, result.data);
          showToast(tr('data.exported'), 'success');
          onClose();
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: tr('data.exportTitle'),
        subtitle: tr('data.exportDescLong'),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy || passphrase.length < 8, onClick: submit },
            busy ? tr('data.exporting') : tr('data.exportAction'))),
      },
        h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
          h(LockIcon, { size: 16 }),
          h('div', null,
            h('strong', null, tr('data.exportEncryptedTitle')),
            h('p', null, tr('data.exportEncryptedDesc')),
          ),
        ),
        h(Field, { label: tr('data.exportPassphrase') },
          h(PassphraseInput, { value: passphrase, onChange: setPassphrase, autoFocus: true })),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    function ImportDialog({ onClose }) {
      const [file, setFile] = React.useState(null);
      const [passphrase, setPassphrase] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const inputRef = React.useRef(null);
      const submit = async () => {
        if (busy) return;
        if (!file) {
          setError(tr('data.noFile'));
          return;
        }
        if (file.size > 100 * 1024 * 1024) {
          setError(tr('data.fileTooLarge'));
          return;
        }
        if (!passphrase) {
          setError(tr('data.importNeedsPassphrase'));
          return;
        }
        setBusy(true);
        setError('');
        try {
          const buffer = await file.arrayBuffer();
          const data = bufferToBase64(buffer);
          const result = await perform('import', { data, passphrase });
          if (result.requiresReload) {
            setStore({ reloadHint: true });
            showToast(tr('data.imported', { count: (result.added || 0) + (result.updated || 0) }), 'success', {
              label: tr('actions.reload'),
              onClick: () => window.location.reload(),
            });
          } else {
            showToast(tr('data.importedNone'), 'info');
          }
          if (result.warning) showToast(result.warning, 'info');
          onClose();
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: tr('data.importTitle'),
        subtitle: tr('data.importDescLong'),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy || !file || !passphrase, onClick: submit },
            busy ? tr('data.importing') : tr('data.importAction'))),
      },
        h('div', { className: 'dcs-file-drop' },
          h('input', {
            ref: inputRef,
            type: 'file',
            accept: '.dsync,.enc,application/octet-stream',
            className: 'dcs-file-input',
            onChange: (event) => {
              const selected = event.target.files && event.target.files[0];
              setFile(selected || null);
              setError('');
            },
          }),
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--soft',
            onClick: () => inputRef.current?.click(),
          }, tr('data.chooseFile')),
          h('span', { className: 'dcs-file-name' }, file ? `${file.name} · ${formatBytes(file.size)}` : tr('data.noFile')),
        ),
        h(Field, { label: tr('data.importPassphrase') },
          h(PassphraseInput, { value: passphrase, onChange: setPassphrase, autoFocus: false })),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    function RenameDialog({ state, onClose }) {
      const [value, setValue] = React.useState(displayNameOf(state));
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const submit = async () => {
        if (!value.trim() || busy) return;
        setBusy(true);
        setError('');
        try {
          await perform('rename', { displayName: value.trim() });
          showToast(tr('settings.saved'), 'success');
          onClose();
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: tr('data.rename'),
        subtitle: tr('data.renameDesc'),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy || !value.trim(), onClick: submit }, busy ? tr('actions.saving') : tr('actions.save'))),
      },
        h(Field, { label: tr('settings.name') },
          h('input', {
            className: 'dcs-input',
            value,
            maxLength: 60,
            autoFocus: true,
            onChange: (event) => setValue(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') submit();
            },
          })),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    function DeleteDialog({ state, onClose }) {
      const [scope, setScope] = React.useState('local');
      const [confirmation, setConfirmation] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const confirmed = confirmation.trim() === '删除' || confirmation.trim().toUpperCase() === 'DELETE';
      const submit = async () => {
        if (busy || !confirmed) return;
        setBusy(true);
        setError('');
        try {
          await perform('delete', { scope, confirmation });
          showToast(tr('data.deleted'), 'success');
          onClose();
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      return h(Modal, {
        title: tr('data.deleteTitle'),
        subtitle: tr('data.deleteDescLong'),
        onClose: busy ? null : onClose,
        footer: h(React.Fragment, null,
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost', disabled: busy, onClick: onClose }, tr('actions.cancel')),
          h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger', disabled: busy || !confirmed, onClick: submit },
            busy ? tr('data.deleting') : tr('data.deleteAction'))),
      },
        h('div', { className: 'dcs-radio-list' },
          h('label', { className: 'dcs-radio-item' },
            h('input', { type: 'radio', name: 'delete-scope', checked: scope === 'local', onChange: () => setScope('local') }),
            h('span', null, tr('data.deleteLocal'))),
          h('label', { className: 'dcs-radio-item' },
            h('input', { type: 'radio', name: 'delete-scope', checked: scope === 'remote', onChange: () => setScope('remote') }),
            h('span', null, tr('data.deleteRemote'))),
          h('label', { className: 'dcs-radio-item' },
            h('input', { type: 'radio', name: 'delete-scope', checked: scope === 'both', onChange: () => setScope('both') }),
            h('span', null, tr('data.deleteBoth'))),
        ),
        h(Field, { label: tr('data.deleteConfirm') },
          h('input', {
            className: 'dcs-input',
            value: confirmation,
            placeholder: tr('data.deletePlaceholder'),
            onChange: (event) => setConfirmation(event.target.value),
          })),
        error ? h(ErrorLine, null, error) : null,
      );
    }

    /* ------------------------------------------------------------------ */
    /* Legal / footer                                                     */
    /* ------------------------------------------------------------------ */

    function LegalPanel({ state }) {
      return h('section', { className: 'dcs-card dcs-legal-card' },
        h('div', { className: 'dcs-card-head' },
          h('div', null,
            h('h2', { className: 'dcs-card-title' }, tr('legal.title')),
            h('p', { className: 'dcs-card-sub' }, state.agreement?.accepted
              ? tr('legal.signed', { date: formatTime(state.agreement.acceptedAt) })
              : tr('legal.unsigned')),
          ),
          h(Badge, { tone: state.agreement?.accepted ? 'success' : 'warning', dot: true },
            state.agreement?.accepted ? tr('agreement.accepted') : tr('legal.unsigned')),
        ),
        h('div', { className: 'dcs-legal-grid' },
          h('div', null,
            h('strong', null, tr('legal.uploadGate')),
            h('p', null, tr('legal.localOnly')),
          ),
          h('div', null,
            h('strong', null, tr('legal.privateWarning')),
            h('p', null, tr('encryption.recoveryNote')),
          ),
        ),
        h('div', { className: 'dcs-legal-actions' },
          h('button', {
            type: 'button',
            className: 'dcs-btn dcs-btn--ghost dcs-btn--small',
            onClick: () => setStore({
              modal: state.agreement?.accepted
                ? { kind: 'agreement', readOnly: true }
                : { kind: 'agreement' },
            }),
          },
            state.agreement?.accepted ? tr('legal.viewSigned') : tr('legal.view')),
          state.repo?.htmlUrl
            ? h('a', { className: 'dcs-link-btn', href: state.repo.htmlUrl, target: '_blank', rel: 'noreferrer' }, tr('hero.openRepo'))
            : null,
        ),
      );
    }

    function ReloadHint() {
      const snapshot = useStore();
      if (!snapshot.reloadHint) return null;
      return h('div', { className: 'dcs-reload-hint', role: 'status' },
        h(SyncIcon, { size: 16 }),
        h('div', null,
          h('strong', null, tr('reload.title')),
          h('span', null, tr('reload.desc')),
        ),
        h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft dcs-btn--small', onClick: () => window.location.reload() }, tr('actions.reload')),
      );
    }

    function SettingsSection({ id, index, title, desc, status, open = false, onToggle, children }) {
      return h('section', { className: `dcs-settings-section${open ? ' is-open' : ''}`, id },
        h('button', {
          type: 'button',
          className: 'dcs-settings-section-head',
          onClick: onToggle,
          'aria-expanded': open,
        },
          h('span', { className: 'dcs-settings-index' }, index),
          h('span', { className: 'dcs-settings-title' },
            h('strong', { className: 'dcs-settings-title-text' }, title),
            h('span', { className: 'dcs-settings-desc' }, desc),
          ),
          h('span', { className: 'dcs-settings-status' },
            status,
            h('span', { className: 'dcs-settings-chevron' }, h(ChevronIcon, { size: 15 })),
          ),
        ),
        open ? h('div', { className: 'dcs-settings-section-body' }, children) : null,
      );
    }

    function DeleteDataAction({ state }) {
      const [open, setOpen] = React.useState(false);
      return h(React.Fragment, null,
        h(DataAction, {
          icon: h(AlertIcon, { size: 18 }),
          title: tr('data.delete'),
          desc: tr('data.deleteDesc'),
          action: tr('actions.delete'),
          danger: true,
          onClick: () => setOpen(true),
        }),
        open ? h(DeleteDialog, { state, onClose: () => setOpen(false) }) : null,
      );
    }

    function BackupPanel() {
      const [items, setItems] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [confirmId, setConfirmId] = React.useState(null);
      const load = async () => {
        setBusy(true);
        setError('');
        try {
          const result = await api('backups');
          setItems(Array.isArray(result.backups) ? result.backups : []);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      React.useEffect(() => { void load(); }, []);
      const restore = async () => {
        if (!confirmId) return;
        const result = await perform('restore-backup', { id: confirmId });
        setConfirmId(null);
        showToast(tr('backup.restored', { count: result.restored || 0 }), 'success');
        if (result.requiresReload) setStore({ reloadHint: true });
        await load();
      };
      return h('div', { className: 'dcs-backup-panel' },
        h('div', { className: 'dcs-backup-head' },
          h('div', null,
            h('h3', { className: 'dcs-subsection-title' }, tr('backup.title')),
            h('p', { className: 'dcs-muted' }, tr('backup.subtitle')),
          ),
          h('button', { type: 'button', className: 'dcs-link-btn', disabled: busy, onClick: load }, tr('backup.refresh')),
        ),
        error ? h(ErrorLine, null, error) : null,
        items === null
          ? h('div', { className: 'dcs-loading' }, h('span', { className: 'dcs-spinner dcs-spinner--small' }), tr('common.loading'))
          : items.length === 0
            ? h('p', { className: 'dcs-muted dcs-backup-empty' }, tr('backup.empty'))
            : h('div', { className: 'dcs-backup-list' },
              items.slice(0, 8).map((item) => h('div', { className: 'dcs-backup-row', key: item.id },
                h('div', { className: 'dcs-backup-copy' },
                  h('strong', null, formatTime(item.createdAt)),
                  h('span', { className: 'dcs-muted' }, `${tr('backup.count', { count: item.count })} · ${formatBytes(item.bytes)}`),
                ),
                h('button', {
                  type: 'button',
                  className: 'dcs-btn dcs-btn--ghost dcs-btn--small',
                  onClick: () => setConfirmId(item.id),
                }, tr('backup.restore')),
              )),
            ),
        confirmId
          ? h(ConfirmDialog, {
            title: tr('backup.restoreTitle'),
            message: tr('backup.restoreDesc'),
            confirmLabel: tr('backup.restoreConfirm'),
            onClose: () => setConfirmId(null),
            onConfirm: restore,
          })
          : null,
      );
    }


    function ClearDataAction() {
      const [confirming, setConfirming] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const clear = async () => {
        setBusy(true);
        try {
          const result = await api('clear-data');
          setStore({ state: result.state, modal: null });
          showToast(tr('maintenance.cleared'), 'success');
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy(false);
          setConfirming(false);
        }
      };
      return h(React.Fragment, null,
        h(DataAction, {
          icon: h(TrashIcon, { size: 18 }),
          title: tr('maintenance.clear'),
          desc: tr('maintenance.clearDesc'),
          action: tr('maintenance.clearAction'),
          danger: true,
          onClick: () => setConfirming(true),
        }),
        confirming ? h(ConfirmDialog, {
          title: tr('maintenance.clearTitle'),
          message: tr('maintenance.clearDesc'),
          confirmLabel: busy ? tr('actions.saving') : tr('maintenance.clearAction'),
          danger: true,
          onClose: busy ? null : () => setConfirming(false),
          onConfirm: clear,
        }) : null,
      );
    }

    function InitializeAction() {
      const [confirming, setConfirming] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const initialize = async () => {
        setBusy(true);
        try {
          const result = await api('initialize');
          setStore({ state: result.state, modal: null });
          showToast(tr('maintenance.initialized'), 'success');
        } catch (caught) {
          showToast(caught.message, 'error');
        } finally {
          setBusy(false);
          setConfirming(false);
        }
      };
      return h(React.Fragment, null,
        h(DataAction, {
          icon: h(RefreshCwIcon, { size: 18 }),
          title: tr('maintenance.initialize'),
          desc: tr('maintenance.initializeDesc'),
          action: tr('maintenance.initializeAction'),
          onClick: () => setConfirming(true),
        }),
        confirming ? h(ConfirmDialog, {
          title: tr('maintenance.initializeTitle'),
          message: tr('maintenance.initializeDesc'),
          confirmLabel: busy ? tr('actions.saving') : tr('maintenance.initializeAction'),
          onClose: busy ? null : () => setConfirming(false),
          onConfirm: initialize,
        }) : null,
      );
    }


    function AboutPanel({ state }) {
      return h('div', { className: 'dcs-about' },
        h('div', { className: 'dcs-about-head' },
          h('span', { className: 'dcs-about-mark' }, h(PanelIcon, { size: 42, active: true })),
          h('div', null,
            h('h3', { className: 'dcs-about-title' }, tr('page.title')),
            h('p', { className: 'dcs-muted' }, tr('about.tagline')),
          ),
        ),
        h('p', { className: 'dcs-about-copy' }, tr('about.desc')),
        h('div', { className: 'dcs-about-author' },
          h('span', { className: 'dcs-about-author-avatar' }, 'X'),
          h('div', null,
            h('span', { className: 'dcs-label' }, tr('about.author')),
            h('strong', null, 'XAF'),
            h('p', null, tr('about.authorDesc')),
          ),
        ),
        h('div', { className: 'dcs-about-grid' },
          h('div', null, h('span', { className: 'dcs-label' }, tr('about.version')), h('strong', null, VERSION)),
          h('div', null, h('span', { className: 'dcs-label' }, tr('about.dshUser')), h('strong', null, state.dshUser || state.device?.username || '—')),
          h('div', null, h('span', { className: 'dcs-label' }, tr('about.repoUser')), h('strong', null, state.account?.login || '—')),
          h('div', null, h('span', { className: 'dcs-label' }, tr('about.repo')), h('strong', null, state.repo?.fullName || '—')),
        ),
        h('div', { className: 'dcs-about-links' },
          h('a', { className: 'dcs-link-btn', href: 'https://gitee.com/user_gitee/dsh-chat-sync', target: '_blank', rel: 'noreferrer' }, tr('about.pluginRepo')),
          h('a', { className: 'dcs-link-btn', href: state.repo?.htmlUrl || 'https://gitee.com/user_gitee/dsh-chat-sync', target: '_blank', rel: 'noreferrer' }, tr('about.dataRepo')),
          h('a', { className: 'dcs-link-btn', href: 'https://gitee.com/user_gitee/dsh-chat-sync/blob/master/docs/INCREMENTAL.md', target: '_blank', rel: 'noreferrer' }, tr('about.incremental')),
        ),
        h('p', { className: 'dcs-fineprint dcs-about-fine' }, tr('about.license')),
      );
    }


    function SettingsView({ state }) {
      const version = state.version || VERSION;
      const [openSection, setOpenSection] = React.useState('account');
      const nav = [
        ['account', tr('settings.nav.account')],
        ['sync', tr('settings.nav.sync')],
        ['encryption', tr('settings.nav.encryption')],
        ['data', tr('settings.nav.data')],
        ['legal', tr('settings.nav.legal')],
        ['maintenance', tr('settings.nav.maintenance')],
        ['about', tr('settings.nav.about')],
      ];
      const go = (id) => {
        const target = document.getElementById(`dcs-settings-${id}`);
        if (!target) return;
        setOpenSection(id);
        requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      };
      return h('div', { className: 'dcs-settings-page' },
        h('nav', { className: 'dcs-settings-nav', 'aria-label': tr('settings.title') },
          nav.map(([id, label]) => h('button', {
            type: 'button',
            key: id,
            className: 'dcs-settings-nav-item',
            onClick: () => go(id),
          }, label)),
        ),
        h(SettingsSection, {
          id: 'dcs-settings-account',
          index: '01',
          title: tr('settings.nav.account'),
          desc: tr('settings.section.accountDesc'),
          open: openSection === 'account',
          onToggle: () => setOpenSection(openSection === 'account' ? null : 'account'),
          status: h(Badge, { tone: state.account ? 'success' : 'neutral', dot: true },
            state.account ? tr('account.current') : tr('status.offline')),
        },
          h(AccountPanel, { state }),
          h(IdentityFields, { state }),
        ),
        h(SettingsSection, {
          id: 'dcs-settings-sync',
          index: '02',
          title: tr('settings.nav.sync'),
          desc: tr('settings.section.syncDesc'),
          open: openSection === 'sync',
          onToggle: () => setOpenSection(openSection === 'sync' ? null : 'sync'),
          status: h(Badge, { tone: 'neutral' }, tr('settings.incremental')),
        }, h(SettingsPanel, { state })),
        h(SettingsSection, {
          id: 'dcs-settings-encryption',
          index: '03',
          title: tr('settings.nav.encryption'),
          desc: tr('settings.section.encryptionDesc'),
          open: openSection === 'encryption',
          onToggle: () => setOpenSection(openSection === 'encryption' ? null : 'encryption'),
          status: h(Badge, {
            tone: state.encryption?.enabled ? (state.encryption?.locked ? 'warning' : 'success') : 'neutral',
            dot: true,
          }, state.encryption?.enabled ? (state.encryption?.locked ? tr('encryption.locked') : tr('encryption.on')) : tr('encryption.off')),
        }, h(EncryptionPanel, { state })),
        h(SettingsSection, {
          id: 'dcs-settings-data',
          index: '04',
          title: tr('settings.nav.data'),
          desc: tr('settings.section.dataDesc'),
          open: openSection === 'data',
          onToggle: () => setOpenSection(openSection === 'data' ? null : 'data'),
          status: h(Badge, { tone: 'neutral' }, formatBytes(state.stats?.packageBytes || 0)),
        }, h(DataPanel, { state, showDelete: false }), h(BackupPanel, null)),
        h(SettingsSection, {
          id: 'dcs-settings-legal',
          index: '05',
          title: tr('settings.nav.legal'),
          desc: tr('settings.section.legalDesc'),
          open: openSection === 'legal',
          onToggle: () => setOpenSection(openSection === 'legal' ? null : 'legal'),
          status: h(Badge, {
            tone: state.agreement?.accepted ? 'success' : 'warning',
            dot: true,
          }, state.agreement?.accepted ? tr('agreement.accepted') : tr('legal.unsigned')),
        }, h(LegalPanel, { state })),
        h(SettingsSection, {
          id: 'dcs-settings-maintenance',
          index: '06',
          title: tr('settings.nav.maintenance'),
          desc: tr('settings.section.maintenanceDesc'),
          open: openSection === 'maintenance',
          onToggle: () => setOpenSection(openSection === 'maintenance' ? null : 'maintenance'),
          status: h(Badge, { tone: 'neutral' }, `v${version}`),
        },
          h('h3', { className: 'dcs-subsection-title' }, tr('pluginUpdate.title')),
          h(PluginUpdatePanel, { state }),
          h('div', { className: 'dcs-danger-zone' },
            h('h3', { className: 'dcs-subsection-title dcs-subsection-title--danger' }, tr('settings.section.danger')),
            h(ClearDataAction, null),
            h(InitializeAction, null),
            h(DeleteDataAction, { state }),
            h(UninstallPanel, null),
          ),
        ),
        h(SettingsSection, {
          id: 'dcs-settings-about',
          index: '07',
          title: tr('settings.nav.about'),
          desc: tr('settings.section.aboutDesc'),
          open: openSection === 'about',
          onToggle: () => setOpenSection(openSection === 'about' ? null : 'about'),
          status: h(Badge, { tone: 'neutral' }, `v${version}`),
        }, h(AboutPanel, { state })),
      );
    }


    function MemoPage({ state }) {
      const [entries, setEntries] = React.useState(null);
      const [text, setText] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [editingId, setEditingId] = React.useState(null);
      const [editText, setEditText] = React.useState('');
      const [selected, setSelected] = React.useState(() => new Set());
      const [confirmClear, setConfirmClear] = React.useState(false);

      const load = async () => {
        setBusy(true);
        setError('');
        try {
          const result = await api('memo-list');
          setEntries(Array.isArray(result.entries) ? result.entries : []);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      React.useEffect(() => { void load(); }, []);

      const add = async () => {
        const value = text.trim();
        if (!value || busy) return;
        setBusy(true);
        setError('');
        try {
          const result = await api('memo-add', { text: value });
          setEntries(result.entries || []);
          setText('');
          showToast(tr('memo.added'), 'success');
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      const saveEdit = async (entry) => {
        const value = editText.trim();
        if (!value || busy) return;
        setBusy(true);
        try {
          const result = await api('memo-update', { id: entry.id, text: value });
          setEntries(result.entries || []);
          setEditingId(null);
          setEditText('');
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      const remove = async (ids) => {
        if (busy) return;
        setBusy(true);
        try {
          const result = await api('memo-delete', { ids });
          setEntries(result.entries || []);
          setSelected(new Set());
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      const withdraw = async (entry) => {
        if (busy) return;
        setBusy(true);
        try {
          const result = await api('memo-withdraw', { id: entry.id });
          setEntries(result.entries || []);
        } catch (caught) {
          setError(caught.message);
        } finally {
          setBusy(false);
        }
      };
      const copy = async (entry) => {
        try {
          await navigator.clipboard.writeText(entry.text);
          showToast(tr('toast.copied'), 'success');
        } catch {
          showToast(tr('memo.copyFailed'), 'error');
        }
      };
      const toggleSelected = (id) => {
        setSelected((previous) => {
          const next = new Set(previous);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      };
      const groups = [];
      const byDay = new Map();
      for (const entry of [...(entries || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
        const date = new Date(entry.createdAt);
        const key = Number.isNaN(date.getTime())
          ? String(entry.createdAt || '').slice(0, 10)
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!byDay.has(key)) {
          const group = { key, entries: [] };
          byDay.set(key, group);
          groups.push(group);
        }
        byDay.get(key).entries.push(entry);
      }
      const allVisibleIds = (entries || []).filter((entry) => !entry.withdrawn).map((entry) => entry.id);
      return h('div', { className: 'dcs-memo-page' },
        h('div', { className: 'dcs-memo-head' },
          h('div', null,
            h('h2', { className: 'dcs-memo-title' }, tr('memo.title')),
            h('p', { className: 'dcs-card-sub' }, tr('memo.subtitle')),
          ),
          h('div', { className: 'dcs-memo-tools' },
            h('span', { className: 'dcs-muted' }, `${entries?.length || 0} ${tr('memo.count')}`),
            entries && entries.length > 0
              ? h('button', {
                type: 'button',
                className: 'dcs-link-btn',
                onClick: () => setSelected(selected.size === allVisibleIds.length ? new Set() : new Set(allVisibleIds)),
              }, selected.size === allVisibleIds.length ? tr('memo.cancelSelection') : tr('memo.selectAll'))
              : null,
            selected.size > 0
              ? h(React.Fragment, null,
                h('button', { type: 'button', className: 'dcs-btn dcs-btn--danger-ghost dcs-btn--small', disabled: busy, onClick: () => remove([...selected]) },
                  tr('memo.deleteSelected', { count: selected.size })),
                h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', onClick: () => setSelected(new Set()) }, tr('memo.cancelSelection')))
              : null,
            entries && entries.length > 0
              ? h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', disabled: busy, onClick: () => setConfirmClear(true) }, tr('memo.clear'))
              : null,
          ),
        ),
        error ? h(ErrorLine, null, error) : null,
        entries === null
          ? h('div', { className: 'dcs-loading' }, h('span', { className: 'dcs-spinner dcs-spinner--small' }), tr('memo.loading'))
          : entries.length === 0
            ? h(EmptyState, { icon: h(DatabaseIcon, { size: 22 }), title: tr('memo.empty'), desc: tr('memo.emptyDesc') })
            : h('div', { className: 'dcs-memo-timeline' },
              groups.map((group) => h('section', { className: 'dcs-memo-day', key: group.key },
                h('div', { className: 'dcs-memo-day-head' },
                  h('span', null, group.key || tr('common.unknown')),
                  h('span', null, tr('memo.dayCount', { count: group.entries.length })),
                ),
                group.entries.map((entry) => h('article', {
                  className: `dcs-memo-item${entry.withdrawn ? ' is-withdrawn' : ''}${selected.has(entry.id) ? ' is-selected' : ''}`,
                  key: entry.id,
                },
                  h('input', {
                    type: 'checkbox',
                    checked: selected.has(entry.id),
                    onChange: () => toggleSelected(entry.id),
                    disabled: entry.withdrawn,
                    'aria-label': tr('memo.select'),
                  }),
                  h('div', { className: 'dcs-memo-copy' },
                    editingId === entry.id
                      ? h(React.Fragment, null,
                        h('textarea', {
                          className: 'dcs-textarea dcs-memo-edit',
                          value: editText,
                          onChange: (event) => setEditText(event.target.value),
                        }),
                        h('div', { className: 'dcs-memo-actions' },
                          h('button', { type: 'button', className: 'dcs-btn dcs-btn--soft dcs-btn--small', disabled: busy, onClick: () => saveEdit(entry) }, tr('actions.save')),
                          h('button', { type: 'button', className: 'dcs-btn dcs-btn--ghost dcs-btn--small', onClick: () => setEditingId(null) }, tr('actions.cancel'))))
                      : h(React.Fragment, null,
                        h('p', { className: 'dcs-memo-text' }, entry.withdrawn ? tr('memo.withdrawnText') : entry.text),
                        h('div', { className: 'dcs-memo-meta' },
                          h('span', null, formatTime(entry.createdAt)),
                          entry.author ? h('span', null, entry.author) : null,
                          entry.withdrawn ? h('span', { className: 'dcs-memo-withdrawn' }, tr('memo.withdrawn')) : null,
                        ),
                        h('div', { className: 'dcs-memo-actions' },
                          h('button', { type: 'button', className: 'dcs-link-btn', onClick: () => { setEditingId(entry.id); setEditText(entry.text); } }, tr('memo.edit')),
                          h('button', { type: 'button', className: 'dcs-link-btn', onClick: () => copy(entry) }, tr('memo.copy')),
                          h('button', { type: 'button', className: 'dcs-link-btn', onClick: () => withdraw(entry) }, entry.withdrawn ? tr('memo.restore') : tr('memo.withdraw')),
                          h('button', { type: 'button', className: 'dcs-link-btn dcs-link-btn--danger', onClick: () => remove([entry.id]) }, tr('memo.delete'))),
                      ),
                  ),
                )),
              )),
            ),
        h('div', { className: 'dcs-memo-composer' },
          h('textarea', {
            className: 'dcs-textarea',
            rows: 3,
            placeholder: tr('memo.placeholder'),
            value: text,
            onChange: (event) => setText(event.target.value),
            onKeyDown: (event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') add();
            },
          }),
          h('div', { className: 'dcs-memo-composer-foot' },
            h('span', { className: 'dcs-muted' }, tr('memo.hint')),
            h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', disabled: busy || !text.trim(), onClick: add }, busy ? tr('actions.saving') : tr('memo.add'))),
        ),
        confirmClear ? h(ConfirmDialog, {
          title: tr('memo.clearTitle'),
          message: tr('memo.clearDesc'),
          confirmLabel: tr('memo.clearConfirm'),
          danger: true,
          onClose: () => setConfirmClear(false),
          onConfirm: async () => {
            const result = await api('memo-clear');
            setEntries(result.entries || []);
            setSelected(new Set());
            setConfirmClear(false);
          },
        }) : null,
      );
    }


    function Dashboard({ state }) {
      const [tab, setTab] = React.useState('sync');
      return h('div', { className: 'dcs-dashboard' },
        h(Hero, { state }),
        h(ReloadHint),
        state && state.version && state.version !== VERSION
          ? h('div', { className: 'dcs-inline-warning dcs-inline-warning--amber' },
            h(AlertIcon, { size: 16 }),
            h('span', null, tr('versionMismatch', { host: state.version, client: VERSION })))
          : null,
        h('div', { className: 'dcs-tabs', role: 'tablist', 'aria-label': tr('page.title') },
          h('button', {
            type: 'button',
            role: 'tab',
            'aria-selected': tab === 'sync',
            className: `dcs-tab${tab === 'sync' ? ' is-active' : ''}`,
            onClick: () => setTab('sync'),
          }, tr('tabs.sync')),
          h('button', {
            type: 'button',
            role: 'tab',
            'aria-selected': tab === 'memo',
            className: `dcs-tab${tab === 'memo' ? ' is-active' : ''}`,
            onClick: () => setTab('memo'),
          }, tr('tabs.memo')),
          h('button', {
            type: 'button',
            role: 'tab',
            'aria-selected': tab === 'settings',
            className: `dcs-tab${tab === 'settings' ? ' is-active' : ''}`,
            onClick: () => setTab('settings'),
          }, tr('tabs.settings')),
          h('button', {
            type: 'button',
            role: 'tab',
            'aria-selected': tab === 'repair',
            className: `dcs-tab${tab === 'repair' ? ' is-active' : ''}`,
            onClick: () => setTab('repair'),
          }, tr('tabs.repair')),
        ),
        tab === 'sync'
          ? h('div', { className: 'dcs-sync-view' },
            h(SyncPanel, { state }),
            h(StatsPanel, { state }),
            h(VersionsPanel, { state }),
            h(HistoryPanel, { state }),
          )
          : tab === 'memo'
            ? h(MemoPage, { state })
            : tab === 'repair'
              ? h(RepairPage, { state })
              : h(SettingsView, { state }),
        h('footer', { className: 'dcs-footer' },
          h('span', null, `dsh-chat-syncer ${VERSION}`),
          h('span', { className: 'dcs-dot-sep' }, '·'),
          h('span', null, '会话文件保存在你选择的仓库中；插件只负责传输。'),
        ),
      );
    }

    /* ------------------------------------------------------------------ */
    /* Page & slots                                                       */
    /* ------------------------------------------------------------------ */

    function SettingsPage({ t }) {
      localeT = typeof t === 'function' ? t : localeT;
      const snapshot = useStore();
      React.useEffect(() => {
        if (!snapshot.state) loadState({ force: true });
      }, []);
      if (!snapshot.state && snapshot.loading) {
        return h('div', { className: 'dcs-page dcs-page--center' },
          h('div', { className: 'dcs-loading' },
            h('span', { className: 'dcs-spinner', 'aria-hidden': 'true' }),
            h('span', null, '正在读取同步状态…')));
      }
      if (!snapshot.state) {
        return h('div', { className: 'dcs-page' },
          h('div', { className: 'dcs-card dcs-empty-card' },
            h(EmptyState, {
              icon: h(AlertIcon, { size: 24 }),
              title: tr('error.title'),
              desc: snapshot.error || '无法读取插件状态',
              action: h('button', { type: 'button', className: 'dcs-btn dcs-btn--primary', onClick: () => loadState({ force: true }) }, tr('actions.retry')),
            })));
      }
      return h('div', { className: 'dcs-page' },
        snapshot.busy ? h('div', { className: 'dcs-busy-bar' }, h('span', { className: 'dcs-spinner dcs-spinner--small' }), tr('busy.banner')) : null,
        snapshot.state.loggedIn
          ? h(Dashboard, { state: snapshot.state })
          : h(LoginView, { state: snapshot.state }),
      );
    }

    function PanelIcon({ size = 18, active = false }) {
      return h('span', { className: 'dcs-panel-icon', 'data-active': active ? 'true' : 'false', 'aria-hidden': 'true' },
        h(Svg, { size },
          h('path', { d: 'M4 7.5h13', stroke: '#5f7cff', strokeWidth: 2.4 }),
          h('path', { d: 'm13 3.5 4 4-4 4', stroke: '#5f7cff', strokeWidth: 2.4 }),
          h('path', { d: 'M20 16.5H7', stroke: '#ff9560', strokeWidth: 2.4 }),
          h('path', { d: 'm11 12.5-4 4 4 4', stroke: '#ff9560', strokeWidth: 2.4 }),
          h('circle', { cx: 12, cy: 12, r: 1.6, fill: '#5fe0b0', stroke: 'none' }),
        ));
    }

    function PluginCell({ view }) {
      const snapshot = useStore();
      const state = snapshot.state;
      React.useEffect(() => {
        if (!state) loadState({ force: true });
      }, []);
      if (view === 'summary') {
        return h('span', { className: 'dcs-plugin-summary' },
          state?.loggedIn
            ? tr('plugin.summaryOn', { repo: state.repo?.fullName || state.repo?.name || '' })
            : tr('plugin.summaryOff'));
      }
      return h('div', { className: 'dcs-plugin-cell' },
        h('div', null,
          h('strong', null, tr('plugin.title')),
          h('p', null, state?.loggedIn ? tr('plugin.summaryOn', { repo: state.repo?.fullName || '' }) : tr('plugin.summaryOff')),
        ),
        h('button', {
          type: 'button',
          className: 'dcs-btn dcs-btn--soft dcs-btn--small',
          onClick: () => runtime.openPanel(),
        }, tr('plugin.open')));
    }

    /* ------------------------------------------------------------------ */
    /* Styles                                                             */
    /* ------------------------------------------------------------------ */

    const CSS = `
.dcs-page,
.dcs-portal-host {
  --dcs-accent: var(--dsw-alias-brand-primary, #4f6ef7);
  --dcs-accent-soft: color-mix(in srgb, var(--dcs-accent) 12%, transparent);
  --dcs-accent-line: color-mix(in srgb, var(--dcs-accent) 28%, transparent);
  --dcs-ink: var(--dsw-alias-label-primary, #1f2329);
  --dcs-muted: var(--dsw-alias-label-secondary, #6b7280);
  --dcs-bg: var(--dsw-alias-bg-base, #ffffff);
  --dcs-layer: var(--dsw-alias-bg-layer-1, #f7f8fa);
  --dcs-layer-2: var(--dsw-alias-bg-layer-2, #ffffff);
  --dcs-line: var(--dsw-alias-border-l1, #e5e7eb);
  --dcs-line-2: var(--dsw-alias-border-l2, #d5d9e0);
  --dcs-success: #147a55;
  --dcs-warning: #a15c00;
  --dcs-danger: #b42318;
}

.dcs-page {
  width: 100%;
  max-width: 1120px;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  margin: 0 auto;
  padding: 28px 30px 72px;
  color: var(--dcs-ink);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.55;
  box-sizing: border-box;
}
body[data-ds-dark-theme] .dcs-page,
body[data-ds-dark-theme] .dcs-portal-host {
  --dcs-success: #66d9a8;
  --dcs-warning: #ffc46b;
  --dcs-danger: #ff938a;
  --dcs-accent-soft: color-mix(in srgb, var(--dcs-accent) 18%, transparent);
  --dcs-accent-line: color-mix(in srgb, var(--dcs-accent) 38%, transparent);
}
.dcs-page *, .dcs-modal *, .dcs-toast * { box-sizing: border-box; }
.dcs-page--center { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.dcs-loading { display: flex; align-items: center; gap: 12px; color: var(--dcs-muted); }
.dcs-spinner { width: 22px; height: 22px; border: 2.5px solid var(--dcs-line); border-top-color: var(--dcs-accent); border-radius: 50%; animation: dcs-spin .8s linear infinite; display: inline-block; }
.dcs-spinner--small { width: 14px; height: 14px; border-width: 2px; }
@keyframes dcs-spin { to { transform: rotate(360deg); } }
.dcs-busy-bar { display: flex; align-items: center; gap: 9px; padding: 10px 14px; margin-bottom: 16px; border: 1px solid var(--dcs-accent-line); border-radius: 10px; background: var(--dcs-accent-soft); color: var(--dcs-ink); font-size: 13px; }
.dcs-hero { position: relative; overflow: hidden; padding: 26px 28px 22px; border: 1px solid var(--dcs-line); border-radius: 20px; background:
  radial-gradient(1000px 340px at 0% -20%, color-mix(in srgb, var(--dcs-accent) 11%, transparent), transparent 62%),
  linear-gradient(180deg, color-mix(in srgb, var(--dcs-layer) 72%, var(--dcs-bg)), var(--dcs-bg));
  box-shadow: 0 1px 2px rgba(16, 24, 40, .04);
}
.dcs-hero-top { display: flex; gap: 24px; align-items: flex-start; justify-content: space-between; }
.dcs-hero-identity { display: flex; gap: 18px; min-width: 0; }
.dcs-hero-mark { flex: none; width: 68px; height: 68px; display: grid; place-items: center; border-radius: 20px; color: var(--dcs-accent); background: linear-gradient(145deg, rgba(255,255,255,.78), rgba(228,238,255,.38)); border: 1px solid rgba(255,255,255,.72); box-shadow: 0 12px 28px -16px rgba(70,100,220,.5), inset 0 1px 0 rgba(255,255,255,.9); backdrop-filter: blur(14px) saturate(1.15); }
.dcs-hero-copy { min-width: 0; }
.dcs-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .11em; color: var(--dcs-accent); margin-bottom: 7px; }
.dcs-title { margin: 0; font-size: 27px; line-height: 1.2; letter-spacing: -.02em; font-weight: 700; }
.dcs-subtitle { max-width: 670px; margin: 9px 0 0; color: var(--dcs-muted); font-size: 13.5px; line-height: 1.65; }
.dcs-hero-status { flex: none; display: flex; flex-direction: row; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
.dcs-top-actions { display: flex; align-items: center; gap: 4px; padding-left: 4px; }
.dcs-icon-action { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); color: var(--dcs-ink); cursor: pointer; transition: background .16s ease, border-color .16s ease, transform .16s ease; }
.dcs-icon-action:hover { border-color: var(--dcs-line-strong); background: var(--dcs-hover); }
.dcs-icon-action:active { transform: translateY(1px); }
.dcs-icon-action:disabled { opacity: .5; cursor: wait; }
.dcs-icon-action--danger { color: var(--dcs-danger); }
.dcs-spinner--tiny { width: 12px; height: 12px; border-width: 1.5px; }
.dcs-hero-version { color: var(--dcs-muted); font-size: 11.5px; }
.dcs-hero-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--dcs-line); }
.dcs-hero-meta-item { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dcs-hero-meta-item > div { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dcs-meta-label { color: var(--dcs-muted); font-size: 11px; letter-spacing: .02em; }
.dcs-hero-meta-item strong, .dcs-meta-link { font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-meta-sub { color: var(--dcs-muted); font-size: 11px; }
.dcs-meta-glyph { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 10px; color: var(--dcs-muted); background: color-mix(in srgb, var(--dcs-ink) 5%, transparent); }
.dcs-meta-link, .dcs-link-btn { color: var(--dcs-accent); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.dcs-meta-link:hover, .dcs-link-btn:hover { text-decoration: underline; }
.dcs-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex: none; border: 1px solid var(--dcs-line); background: var(--dcs-layer); }
.dcs-avatar--fallback { display: grid; place-items: center; font-size: 11px; font-weight: 700; color: var(--dcs-accent); }
.dcs-layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .85fr); gap: 14px; align-items: start; }
.dcs-tabs { position: relative; z-index: 5; display: inline-flex; align-self: flex-start; gap: 4px; padding: 4px; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-layer); }
.dcs-tab { border: 0; border-radius: 8px; background: transparent; color: var(--dcs-muted); padding: 9px 24px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.dcs-tab.is-active { background: var(--dcs-bg); color: var(--dcs-ink); box-shadow: 0 1px 2px rgba(16, 24, 40, .08); }
.dcs-sync-view { width: 100%; display: flex; flex-direction: column; gap: 14px; }
.dcs-settings-page { position: relative; isolation: isolate; width: 100%; display: flex; flex-direction: column; gap: 10px; }
.dcs-settings-nav { position: sticky; top: 0; z-index: 30; display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 0 11px; background: var(--dcs-bg); border-bottom: 1px solid var(--dcs-line); box-shadow: 0 -34px 0 0 var(--dcs-bg), 0 1px 0 var(--dcs-line), 0 10px 18px -18px rgba(16, 24, 40, .4); }
.dcs-settings-nav-item { min-height: 34px; padding: 8px 15px; border: 1px solid var(--dcs-line); border-radius: 999px; background: var(--dcs-layer); color: var(--dcs-muted); font: inherit; font-size: 13px; cursor: pointer; }
.dcs-settings-nav-item:hover { color: var(--dcs-ink); border-color: var(--dcs-line-strong); }
.dcs-settings-section { position: relative; z-index: 0; border: 1px solid var(--dcs-line); border-radius: 14px; background: var(--dcs-bg); overflow: hidden; scroll-margin-top: 64px; }
.dcs-settings-section-head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 0; background: transparent; color: var(--dcs-ink); font: inherit; text-align: left; cursor: pointer; }
.dcs-settings-section-head:hover { background: color-mix(in srgb, var(--dcs-ink) 2.5%, transparent); }
.dcs-settings-index { flex: none; width: 26px; color: var(--dcs-accent); font: 600 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .04em; }
.dcs-settings-title { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dcs-settings-title-text { font-size: 16px; font-weight: 650; }
.dcs-settings-desc { color: var(--dcs-muted); font-size: 12px; line-height: 1.55; }
.dcs-settings-status { flex: none; display: flex; align-items: center; gap: 9px; }
.dcs-settings-chevron { display: inline-flex; color: var(--dcs-muted); transition: transform .18s ease; }
.dcs-settings-section.is-open .dcs-settings-chevron { transform: rotate(180deg); }
.dcs-settings-section-body { padding: 0 16px 16px; }
.dcs-settings-section .dcs-card { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.dcs-settings-section .dcs-card > .dcs-card-head { display: none; }
.dcs-settings-section .dcs-setting-grid,
.dcs-settings-section .dcs-data-grid,
.dcs-settings-section .dcs-update-grid,
.dcs-settings-section .dcs-legal-grid { grid-template-columns: 1fr; }
.dcs-settings-section .dcs-setting-grid { margin-top: 4px; }
.dcs-settings-section .dcs-setting-row { padding: 14px 0; }
.dcs-settings-section .dcs-setting-row strong { font-size: 13px; }
.dcs-settings-section .dcs-setting-row p { font-size: 11.5px; }
.dcs-settings-section .dcs-account-card { padding-top: 0; }
.dcs-subsection-title { margin: 16px 0 8px; color: var(--dcs-muted); font-size: 10px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
.dcs-subsection-title:first-child { margin-top: 2px; }
.dcs-memo-page { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.dcs-memo-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.dcs-memo-title { margin: 0; font-size: 18px; }
.dcs-memo-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.dcs-memo-timeline { display: flex; flex-direction: column; gap: 14px; }
.dcs-memo-day { display: flex; flex-direction: column; gap: 7px; }
.dcs-memo-day-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 7px; border-bottom: 1px solid var(--dcs-line); color: var(--dcs-muted); font-size: 10.5px; }
.dcs-memo-item { display: flex; align-items: flex-start; gap: 9px; padding: 11px 12px; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-bg); }
.dcs-memo-item.is-withdrawn { opacity: .65; background: var(--dcs-layer); }
.dcs-memo-item.is-selected { border-color: var(--dcs-accent); }
.dcs-memo-item > input { margin-top: 3px; }
.dcs-memo-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.dcs-memo-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.6; }
.dcs-memo-meta { display: flex; flex-wrap: wrap; gap: 8px; color: var(--dcs-muted); font-size: 10px; }
.dcs-memo-withdrawn { color: var(--dcs-warning); }
.dcs-memo-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.dcs-memo-actions .dcs-link-btn { font-size: 10.5px; }
.dcs-link-btn--danger { color: var(--dcs-danger); }
.dcs-memo-edit { min-height: 80px; }
.dcs-memo-composer { position: sticky; bottom: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--dcs-line); border-radius: 12px; background: var(--dcs-bg); box-shadow: 0 -4px 18px rgba(16, 24, 40, .06); }
.dcs-memo-composer-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.dcs-memo-composer-foot .dcs-muted { font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-textarea { width: 100%; resize: vertical; min-height: 64px; padding: 9px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); color: var(--dcs-ink); font: inherit; font-size: 12px; line-height: 1.55; }
.dcs-textarea:focus { outline: 2px solid var(--dcs-accent-soft); border-color: var(--dcs-accent); }
.dcs-about { display: flex; flex-direction: column; gap: 12px; }
.dcs-about-head { display: flex; align-items: center; gap: 12px; }
.dcs-about-mark { width: 52px; height: 52px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.7); border-radius: 16px; background: linear-gradient(145deg, rgba(255,255,255,.78), rgba(228,238,255,.38)); box-shadow: 0 10px 22px -16px rgba(70,100,220,.45), inset 0 1px 0 rgba(255,255,255,.9); backdrop-filter: blur(12px); }
.dcs-about-title { margin: 0; font-size: 14px; }
.dcs-about-copy { margin: 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.65; }
.dcs-about-author { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border: 1px solid var(--dcs-line); border-radius: 10px; background: var(--dcs-layer); }
.dcs-about-author-avatar { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(135deg, #6f8cff, #ff9a62); font-size: 13px; font-weight: 700; }
.dcs-about-author p { margin: 2px 0 0; color: var(--dcs-muted); font-size: 10.5px; }
.dcs-about-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.dcs-about-grid > div { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); }
.dcs-about-grid strong { font-size: 11.5px; word-break: break-all; }
.dcs-about-links { display: flex; flex-wrap: wrap; gap: 10px; }
.dcs-about-fine { margin: 0; }
.dcs-history-list { display: flex; flex-direction: column; gap: 6px; max-height: 340px; overflow-y: auto; }
.dcs-history-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); }
.dcs-history-sha { flex: none; color: var(--dcs-accent); font-size: 10.5px; }
.dcs-history-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dcs-history-copy strong { font-size: 11.5px; font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-history-copy span { color: var(--dcs-muted); font-size: 10px; }
.dcs-history-empty { margin: 2px 0; font-size: 11px; }
.dcs-backup-panel { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--dcs-line); }
.dcs-backup-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.dcs-backup-head .dcs-subsection-title { margin-top: 0; }
.dcs-backup-head .dcs-muted { font-size: 10.5px; }
.dcs-backup-empty { margin: 8px 0 0; font-size: 11px; }
.dcs-backup-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.dcs-backup-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); }
.dcs-backup-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dcs-backup-copy strong { font-size: 11.5px; }
.dcs-backup-copy span { font-size: 10.5px; }
.dcs-subsection-title--danger { color: var(--dcs-danger); }
.dcs-danger-zone { margin-top: 16px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--dcs-danger) 28%, var(--dcs-line)); }
.dcs-danger-zone .dcs-data-action { border-color: color-mix(in srgb, var(--dcs-danger) 24%, var(--dcs-line)); }
.dcs-column { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.dcs-column--side .dcs-data-grid,
.dcs-column--side .dcs-setting-grid,
.dcs-column--side .dcs-legal-grid,
.dcs-column--side .dcs-update-grid,
.dcs-column--side .dcs-sync-grid { grid-template-columns: 1fr; }
.dcs-column--side .dcs-update-card { padding: 11px; }
.dcs-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; align-items: start; }
.dcs-grid--top { grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); }
.dcs-card { border: 1px solid var(--dcs-line); border-radius: 16px; background: var(--dcs-bg); padding: 20px; box-shadow: 0 1px 2px rgba(16, 24, 40, .03); }
.dcs-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.dcs-card-title { margin: 0; font-size: 15px; font-weight: 650; letter-spacing: -.01em; }
.dcs-card-sub { margin: 4px 0 0; color: var(--dcs-muted); font-size: 12.5px; line-height: 1.55; }
.dcs-sync-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.dcs-sync-block { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 12px; background: var(--dcs-layer); border: 1px solid color-mix(in srgb, var(--dcs-line) 70%, transparent); }
.dcs-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; background: color-mix(in srgb, var(--dcs-ink) 6%, transparent); border: 1px solid var(--dcs-line); border-radius: 6px; padding: 2px 6px; color: var(--dcs-ink); width: fit-content; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-code--large { font-size: 13px; padding: 4px 8px; }
.dcs-label { color: var(--dcs-muted); font-size: 11px; }
.dcs-strong { font-size: 13px; }
.dcs-muted { color: var(--dcs-muted); font-size: 12px; }
.dcs-action-row { display: flex; gap: 10px; flex-wrap: wrap; }
.dcs-versions { display: flex; flex-direction: column; gap: 8px; }
.dcs-version-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--dcs-line); border-radius: 10px; background: var(--dcs-bg); }
.dcs-version-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dcs-version-main strong { font-size: 12.5px; }
.dcs-version-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.dcs-card--spaced { margin-top: 16px; }
.dcs-repair-report { margin-top: 14px; padding: 12px 13px; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-layer); font-size: 12.5px; color: var(--dcs-ink); }
.dcs-repair-report p { margin: 0; }
.dcs-repair-list { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
.dcs-repair-list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.dcs-repair-list .dcs-code { font-size: 11px; max-width: 70%; }
.dcs-repair-done { margin: 14px 0 0; padding: 11px 12px; border: 1px solid color-mix(in srgb, var(--dcs-success) 35%, var(--dcs-line)); border-radius: 10px; background: color-mix(in srgb, var(--dcs-success) 8%, transparent); color: var(--dcs-success); font-size: 12.5px; }
.dcs-btn { appearance: none; border: 1px solid transparent; border-radius: 9px; height: 36px; padding: 0 14px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background .15s ease, border-color .15s ease, color .15s ease, transform .1s ease; white-space: nowrap; }
.dcs-btn:active:not(:disabled) { transform: translateY(1px); }
.dcs-btn:disabled { opacity: .5; cursor: not-allowed; }
.dcs-btn:focus-visible { outline: 2px solid var(--dcs-accent-line); outline-offset: 2px; }
.dcs-btn--primary { color: #fff; background: var(--dcs-accent); border-color: var(--dcs-accent); box-shadow: 0 1px 2px color-mix(in srgb, var(--dcs-accent) 30%, transparent); }
.dcs-btn--primary:hover:not(:disabled) { filter: brightness(1.05); }
.dcs-btn--soft { color: var(--dcs-accent); background: var(--dcs-accent-soft); border-color: var(--dcs-accent-line); }
.dcs-btn--soft:hover:not(:disabled) { background: color-mix(in srgb, var(--dcs-accent) 18%, transparent); }
.dcs-btn--ghost { color: var(--dcs-ink); background: transparent; border-color: var(--dcs-line); }
.dcs-btn--ghost:hover:not(:disabled) { background: color-mix(in srgb, var(--dcs-ink) 5%, transparent); }
.dcs-btn--danger { color: #fff; background: #c4322b; border-color: #c4322b; }
.dcs-btn--danger:hover:not(:disabled) { filter: brightness(1.06); }
.dcs-btn--danger-ghost { color: var(--dcs-danger); background: transparent; border-color: color-mix(in srgb, var(--dcs-danger) 30%, transparent); }
.dcs-btn--small { height: 30px; padding: 0 10px; font-size: 11.5px; border-radius: 8px; }
.dcs-btn--wide { width: 100%; height: 40px; }
.dcs-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--dcs-line); font-size: 11px; font-weight: 600; white-space: nowrap; color: var(--dcs-muted); background: var(--dcs-layer); }
.dcs-badge--success { color: var(--dcs-success); border-color: color-mix(in srgb, var(--dcs-success) 28%, transparent); background: color-mix(in srgb, var(--dcs-success) 9%, transparent); }
.dcs-badge--warning { color: var(--dcs-warning); border-color: color-mix(in srgb, var(--dcs-warning) 30%, transparent); background: color-mix(in srgb, var(--dcs-warning) 10%, transparent); }
.dcs-badge--danger { color: var(--dcs-danger); border-color: color-mix(in srgb, var(--dcs-danger) 30%, transparent); background: color-mix(in srgb, var(--dcs-danger) 9%, transparent); }
.dcs-badge--progress { color: var(--dcs-accent); border-color: var(--dcs-accent-line); background: var(--dcs-accent-soft); }
.dcs-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.dcs-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dcs-stat { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border-radius: 11px; background: var(--dcs-layer); }
.dcs-stat-icon { width: 30px; height: 30px; flex: none; display: grid; place-items: center; border-radius: 9px; background: var(--dcs-bg); border: 1px solid var(--dcs-line); color: var(--dcs-muted); }
.dcs-stat-label { display: block; color: var(--dcs-muted); font-size: 11px; }
.dcs-stat-value { display: block; font-size: 13px; font-weight: 650; }
.dcs-setting-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 13px 0; border-top: 1px solid var(--dcs-line); }
.dcs-setting-row:first-of-type { border-top: 0; padding-top: 0; }
.dcs-setting-row strong { font-size: 13px; }
.dcs-setting-row p { margin: 3px 0 0; color: var(--dcs-muted); font-size: 12px; line-height: 1.5; max-width: 520px; }
.dcs-toggle { flex: none; width: 38px; height: 22px; padding: 2px; border-radius: 999px; background: var(--dcs-line-2); border: 1px solid var(--dcs-line-2); cursor: pointer; transition: background .18s ease; }
.dcs-toggle[data-on="true"] { background: var(--dcs-accent); border-color: var(--dcs-accent); }
.dcs-toggle-knob { display: block; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(16, 24, 40, .25); transition: transform .18s ease; }
.dcs-toggle[data-on="true"] .dcs-toggle-knob { transform: translateX(16px); }
.dcs-setting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
.dcs-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.dcs-field-label { font-size: 12px; font-weight: 600; color: var(--dcs-ink); }
.dcs-field-hint { color: var(--dcs-muted); font-size: 11.5px; line-height: 1.45; }
.dcs-input { width: 100%; height: 36px; padding: 0 11px; border: 1px solid var(--dcs-line-2); border-radius: 9px; background: var(--dcs-bg); color: var(--dcs-ink); font: inherit; font-size: 13px; outline: none; transition: border-color .15s ease, box-shadow .15s ease; }
.dcs-input:focus { border-color: var(--dcs-accent); box-shadow: 0 0 0 3px var(--dcs-accent-soft); }
.dcs-input--mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.dcs-inline-input { display: flex; gap: 8px; }
.dcs-check-result { display: flex; flex-direction: column; gap: 10px; }
.dcs-check-result-desc { margin: 0; color: var(--dcs-muted); font-size: 12px; line-height: 1.6; }
.dcs-progress-card { display: flex; flex-direction: column; gap: 7px; padding: 11px 12px; margin-bottom: 12px; border: 1px solid color-mix(in srgb, var(--dcs-accent) 30%, var(--dcs-line)); border-radius: 11px; background: color-mix(in srgb, var(--dcs-accent) 7%, var(--dcs-layer)); }
.dcs-progress-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dcs-progress-stage { font-size: 11.5px; font-weight: 600; color: var(--dcs-ink); }
.dcs-progress-value { font-size: 11px; color: var(--dcs-accent); font-variant-numeric: tabular-nums; }
.dcs-progress-track { height: 7px; border-radius: 999px; background: color-mix(in srgb, var(--dcs-accent) 15%, var(--dcs-line)); overflow: hidden; }
.dcs-progress-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--dcs-accent), color-mix(in srgb, var(--dcs-accent) 60%, #7c5cff)); transition: width .35s ease; }
.dcs-progress-hint { margin: 0; color: var(--dcs-muted); font-size: 10.5px; }
.dcs-device-display { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 6px 0 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); }
.dcs-setting-grid > div:nth-child(2) { grid-column: 1 / -1; }
.dcs-device-value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.dcs-device-edit-btn { flex: none; gap: 4px; min-height: 26px; padding: 3px 7px; }
.dcs-device-edit { display: flex; gap: 6px; align-items: center; }
.dcs-device-edit-panel { display: flex; flex-direction: column; gap: 7px; padding: 10px; border: 1px solid var(--dcs-line); border-radius: 10px; background: var(--dcs-layer); }
.dcs-device-edit-row { display: grid; grid-template-columns: 70px minmax(0, 1fr) 30px; align-items: center; gap: 8px; }
.dcs-device-edit-label { color: var(--dcs-muted); font-size: 10.5px; }
.dcs-device-edit-readonly { font-size: 11px; font-weight: 500; word-break: break-all; }
.dcs-device-check { width: 28px; height: 28px; }
.dcs-device-edit-actions { display: flex; justify-content: flex-end; }
.dcs-device-edit .dcs-input { flex: 1; min-width: 0; }
.dcs-device-identity { color: var(--dcs-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-device-details { margin-top: 4px; display: flex; flex-direction: column; gap: 5px; }
.dcs-overwrite-check { margin-top: 10px; align-items: flex-start; }
.dcs-device-details-toggle { align-self: flex-start; display: inline-flex; align-items: center; gap: 3px; padding: 0; border: 0; background: transparent; color: var(--dcs-accent); font: inherit; font-size: 10.5px; cursor: pointer; }
.dcs-device-details-chevron { display: inline-flex; transition: transform .16s ease; }
.dcs-device-details-chevron.is-open { transform: rotate(180deg); }
.dcs-device-detail-panel { padding: 9px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); }
.dcs-device-detail-name { margin-bottom: 7px; font-size: 11px; word-break: break-all; }
.dcs-device-detail-grid { display: grid; grid-template-columns: 78px minmax(0, 1fr); gap: 4px 8px; font-size: 10.5px; }
.dcs-device-detail-grid span { color: var(--dcs-muted); }
.dcs-device-detail-grid strong { font-weight: 500; word-break: break-all; }
.dcs-pass-wrap { position: relative; }
.dcs-pass-wrap .dcs-input { padding-right: 40px; }
.dcs-pass-toggle { position: absolute; right: 4px; top: 4px; width: 30px; height: 28px; border: 0; background: transparent; color: var(--dcs-muted); display: grid; place-items: center; cursor: pointer; border-radius: 6px; }
.dcs-pass-toggle:hover { background: var(--dcs-layer); color: var(--dcs-ink); }
.dcs-inline-warning { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 11px 12px; border: 1px solid color-mix(in srgb, var(--dcs-warning) 28%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--dcs-warning) 8%, transparent); color: var(--dcs-ink); font-size: 12px; }
.dcs-inline-warning > div { flex: 1; min-width: 0; }
.dcs-inline-warning strong { display: block; font-size: 12.5px; }
.dcs-inline-warning p { margin: 2px 0 0; color: var(--dcs-muted); line-height: 1.45; }
.dcs-inline-warning--amber { border-color: color-mix(in srgb, var(--dcs-warning) 30%, transparent); }
.dcs-error-line { display: flex; align-items: flex-start; gap: 8px; margin-top: 10px; padding: 9px 11px; border-radius: 9px; border: 1px solid color-mix(in srgb, var(--dcs-danger) 28%, transparent); background: color-mix(in srgb, var(--dcs-danger) 8%, transparent); color: var(--dcs-danger); font-size: 12px; line-height: 1.45; }
.dcs-error-line svg { flex: none; margin-top: 1px; }
.dcs-encryption-state { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 10px 12px; padding: 13px; border: 1px solid var(--dcs-line); border-radius: 12px; background: var(--dcs-layer); }
.dcs-crypto-mark { flex: none; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; background: var(--dcs-bg); border: 1px solid var(--dcs-line); color: var(--dcs-muted); }
.dcs-crypto-mark.is-on { color: var(--dcs-accent); border-color: var(--dcs-accent-line); background: var(--dcs-accent-soft); }
.dcs-encryption-copy { min-width: 0; }
.dcs-encryption-copy strong { font-size: 13px; }
.dcs-encryption-copy p { margin: 3px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.5; }
.dcs-encryption-actions { grid-column: 1 / -1; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; justify-content: flex-start; }
.dcs-inline-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--dcs-success); }
.dcs-update-card-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 12px; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-layer); }
.dcs-update-card-copy { min-width: 0; }
.dcs-update-card-copy strong { font-size: 12.5px; }
.dcs-update-card-copy p { margin: 3px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.45; }
.dcs-select { flex: none; height: 34px; max-width: 240px; padding: 0 28px 0 10px; border: 1px solid var(--dcs-line-2); border-radius: 9px; background: var(--dcs-bg); color: var(--dcs-ink); font: inherit; font-size: 12px; }
.dcs-select:focus { outline: 2px solid var(--dcs-accent-line); outline-offset: 1px; }
.dcs-uninstall-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px; border: 1px solid color-mix(in srgb, var(--dcs-danger) 22%, var(--dcs-line)); border-radius: 11px; background: color-mix(in srgb, var(--dcs-danger) 4%, transparent); }
.dcs-uninstall-copy { min-width: 0; }
.dcs-uninstall-copy strong { font-size: 12.5px; }
.dcs-uninstall-copy p { margin: 3px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.45; }
.dcs-inline-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.dcs-inline-links .dcs-muted { flex: 1; min-width: 180px; }
.dcs-link-btn { appearance: none; border: 0; background: transparent; padding: 0; font: inherit; font-size: 12px; color: var(--dcs-accent); cursor: pointer; }
.dcs-dot-sep { color: var(--dcs-muted); }
.dcs-session-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--dcs-line); }
.dcs-session-toolbar .dcs-check-row { font-size: 12px; }
.dcs-session-list { max-height: 320px; overflow-y: auto; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-bg); padding: 8px 10px; }
.dcs-session-group { margin-top: 10px; padding: 6px 0 4px; border-top: 1px solid var(--dcs-line); font-size: 12.5px; }
.dcs-session-group:first-child { border-top: 0; margin-top: 0; }
.dcs-session-row--nested { padding-left: 20px; }
.dcs-session-row { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-bottom: 1px solid color-mix(in srgb, var(--dcs-line) 68%, transparent); cursor: pointer; }
.dcs-session-row:last-child { border-bottom: 0; }
.dcs-session-row:hover { background: var(--dcs-layer); }
.dcs-session-row input { flex: none; accent-color: var(--dcs-accent); }
.dcs-session-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dcs-session-name { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-session-meta { display: flex; align-items: center; gap: 7px; color: var(--dcs-muted); font-size: 10.5px; }
.dcs-session-live { padding: 0 5px; border-radius: 999px; background: var(--dcs-accent-soft); color: var(--dcs-accent); font-size: 9.5px; font-weight: 700; }
.dcs-session-size { flex: none; color: var(--dcs-muted); font-size: 11px; white-space: nowrap; }
.dcs-account-current { display: flex; align-items: center; gap: 11px; padding: 12px; border: 1px solid var(--dcs-line); border-radius: 12px; background: var(--dcs-layer); }
.dcs-account-copy { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dcs-account-copy strong { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-account-copy span { color: var(--dcs-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-account-current .dcs-account-copy { flex: 1; }
.dcs-account-identities { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.dcs-account-identities > div { display: flex; flex-direction: column; gap: 2px; padding: 7px 9px; border: 1px solid var(--dcs-line); border-radius: 8px; }
.dcs-account-identities strong { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-account-repo { color: var(--dcs-muted); font-size: 10.5px; }
.dcs-account-others { margin-top: 14px; display: flex; flex-direction: column; gap: 7px; }
.dcs-account-others-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.dcs-account-others-head .dcs-muted { font-size: 10.5px; text-align: right; }
.dcs-account-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; }
.dcs-account-row .dcs-account-copy { flex: 1; }
.dcs-account-empty { margin: 4px 0 0; font-size: 11px; }
.dcs-account-add { margin-top: 12px; }
.dcs-data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dcs-data-action { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border: 1px solid var(--dcs-line); border-radius: 12px; background: var(--dcs-bg); }
.dcs-data-action.is-danger { border-color: color-mix(in srgb, var(--dcs-danger) 22%, var(--dcs-line)); }
.dcs-data-icon { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; background: var(--dcs-layer); color: var(--dcs-accent); }
.dcs-data-action.is-danger .dcs-data-icon { color: var(--dcs-danger); }
.dcs-data-copy { flex: 1; min-width: 0; }
.dcs-data-copy strong { font-size: 12.5px; }
.dcs-data-copy p { margin: 2px 0 0; color: var(--dcs-muted); font-size: 11px; line-height: 1.45; }
.dcs-legal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding-top: 14px; border-top: 1px solid var(--dcs-line); }
.dcs-legal-grid strong { font-size: 12.5px; }
.dcs-legal-grid p { margin: 3px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.5; }
.dcs-legal-actions { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.dcs-footer { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; justify-content: center; margin-top: 26px; color: var(--dcs-muted); font-size: 11px; }
.dcs-reload-hint { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding: 11px 13px; border: 1px solid var(--dcs-accent-line); border-radius: 11px; background: var(--dcs-accent-soft); }
.dcs-reload-hint > div { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.dcs-reload-hint strong { font-size: 12px; }
.dcs-reload-hint span { color: var(--dcs-muted); font-size: 11.5px; }
.dcs-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 26px 18px; }
.dcs-empty-icon { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; background: var(--dcs-accent-soft); color: var(--dcs-accent); }
.dcs-empty-title { margin: 0; font-size: 15px; }
.dcs-empty-desc { margin: 0; color: var(--dcs-muted); font-size: 12.5px; max-width: 420px; }
.dcs-empty-card { margin-top: 20px; }
.dcs-login { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, .8fr); gap: 18px; align-items: start; }
.dcs-login-card { position: relative; border: 1px solid var(--dcs-line); border-radius: 18px; background: var(--dcs-bg); padding: 24px; box-shadow: 0 1px 2px rgba(16, 24, 40, .04); }
.dcs-login-tools { position: absolute; top: 14px; right: 14px; z-index: 2; }
.dcs-auth-actions { display: flex; align-items: center; gap: 5px; }
.dcs-login-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; padding-right: 76px; }
.dcs-login-icon { width: 54px; height: 54px; flex: none; display: grid; place-items: center; border-radius: 16px; background: linear-gradient(145deg, rgba(255,255,255,.78), rgba(228,238,255,.38)); border: 1px solid rgba(255,255,255,.72); color: var(--dcs-accent); box-shadow: 0 10px 22px -16px rgba(70,100,220,.45), inset 0 1px 0 rgba(255,255,255,.9); backdrop-filter: blur(12px); }
.dcs-login-title { margin: 0; font-size: 20px; letter-spacing: -.01em; }
.dcs-login-subtitle { margin: 6px 0 0; color: var(--dcs-muted); font-size: 12.5px; line-height: 1.55; }
.dcs-login-form { display: flex; flex-direction: column; gap: 15px; }
.dcs-network-hint { margin: -4px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.5; padding-left: 2px; }
.dcs-token-field { display: flex; flex-direction: column; gap: 8px; }
.dcs-token-guide { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 1px solid var(--dcs-accent-line); border-radius: 12px; background: linear-gradient(135deg, var(--dcs-accent-soft), color-mix(in srgb, var(--dcs-accent) 4%, transparent)); }
.dcs-guide-step { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--dcs-accent); color: #fff; font-size: 11px; font-weight: 750; box-shadow: 0 2px 8px color-mix(in srgb, var(--dcs-accent) 30%, transparent); }
.dcs-guide-step--muted { background: var(--dcs-layer); color: var(--dcs-muted); border: 1px solid var(--dcs-line); box-shadow: none; }
.dcs-guide-copy { flex: 1; min-width: 0; }
.dcs-guide-copy strong { display: block; font-size: 12.5px; letter-spacing: -.01em; }
.dcs-guide-copy p { margin: 2px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.45; }
.dcs-token-create { flex: none; height: 32px; padding: 0 11px; font-size: 11.5px; border-radius: 8px; box-shadow: 0 4px 12px color-mix(in srgb, var(--dcs-accent) 28%, transparent); }
.dcs-token-paste { display: flex; align-items: flex-start; gap: 10px; padding: 10px 11px; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-bg); }
.dcs-token-paste-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.dcs-token-paste-label { color: var(--dcs-muted); font-size: 11.5px; font-weight: 600; }
.dcs-token-paste .dcs-input { height: 34px; }
.dcs-permission-box { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border: 1px solid var(--dcs-line); border-radius: 10px; background: var(--dcs-layer); }
.dcs-permission-head { display: flex; align-items: center; gap: 6px; color: var(--dcs-ink); }
.dcs-permission-head strong { font-size: 11.5px; }
.dcs-permission-box p { margin: 0; color: var(--dcs-muted); font-size: 11px; line-height: 1.5; }
.dcs-permission-status { display: flex; align-items: flex-start; gap: 6px; margin-top: 2px; font-size: 11px; line-height: 1.45; }
.dcs-permission-status svg { flex: none; margin-top: 1px; }
.dcs-permission-status.is-ok { color: var(--dcs-success); }
.dcs-permission-status.is-missing, .dcs-permission-status.is-error { color: var(--dcs-danger); }
.dcs-permission-status.is-unknown { color: var(--dcs-warning); }
.dcs-permission-status.is-checking { color: var(--dcs-muted); align-items: center; }
.dcs-segment-title { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dcs-provider-recommend { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--dcs-success) 28%, transparent); background: color-mix(in srgb, var(--dcs-success) 10%, transparent); color: var(--dcs-success); font-size: 9.5px; font-weight: 750; white-space: nowrap; }
.dcs-segment { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dcs-segment-btn { display: flex; align-items: center; gap: 9px; text-align: left; padding: 10px 11px; border: 1px solid var(--dcs-line); border-radius: 11px; background: var(--dcs-bg); color: var(--dcs-ink); cursor: pointer; font: inherit; }
.dcs-segment-btn.is-active { border-color: var(--dcs-accent-line); background: var(--dcs-accent-soft); box-shadow: inset 0 0 0 1px var(--dcs-accent-line); }
.dcs-segment-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.dcs-segment-copy strong { font-size: 12.5px; }
.dcs-segment-copy span { color: var(--dcs-muted); font-size: 11px; line-height: 1.35; }
.dcs-provider-mark { flex: none; width: 31px; height: 31px; border-radius: 9px; display: grid; place-items: center; font-size: 10px; font-weight: 800; color: #fff; background: #c4322b; }
.dcs-provider-mark--github { background: #24292f; }
.dcs-fineprint { margin: 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.55; }
.dcs-fineprint--muted { opacity: .82; }
.dcs-login-aside { display: flex; flex-direction: column; gap: 10px; }
.dcs-login-history { display: flex; flex-direction: column; gap: 7px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--dcs-line); }
.dcs-login-history-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--dcs-line); border-radius: 9px; background: var(--dcs-layer); }
.dcs-login-history-row .dcs-account-copy { flex: 1; }
.dcs-aside-item { display: flex; gap: 11px; padding: 14px; border: 1px solid var(--dcs-line); border-radius: 13px; background: var(--dcs-layer); }
.dcs-aside-icon { flex: none; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: var(--dcs-bg); color: var(--dcs-accent); border: 1px solid var(--dcs-line); }
.dcs-aside-item strong { font-size: 12.5px; }
.dcs-aside-item p { margin: 3px 0 0; color: var(--dcs-muted); font-size: 11.5px; line-height: 1.5; }
.dcs-plugin-summary { color: var(--dcs-muted); font-size: 12px; }
.dcs-plugin-cell { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.dcs-plugin-cell strong { font-size: 13px; }
.dcs-plugin-cell p { margin: 2px 0 0; color: var(--dcs-muted); font-size: 11.5px; }

/* modal / toast */
.dcs-modal-backdrop, .dcs-toast, .dcs-plugin-cell {
  --dcs-accent: var(--dsw-alias-brand-primary, #4f6ef7);
  --dcs-accent-soft: color-mix(in srgb, var(--dcs-accent) 12%, transparent);
  --dcs-accent-line: color-mix(in srgb, var(--dcs-accent) 28%, transparent);
  --dcs-ink: var(--dsw-alias-label-primary, #1f2329);
  --dcs-muted: var(--dsw-alias-label-secondary, #6b7280);
  --dcs-bg: var(--dsw-alias-bg-base, #ffffff);
  --dcs-layer: var(--dsw-alias-bg-layer-1, #f7f8fa);
  --dcs-layer-2: var(--dsw-alias-bg-layer-2, #ffffff);
  --dcs-line: var(--dsw-alias-border-l1, #e5e7eb);
  --dcs-line-2: var(--dsw-alias-border-l2, #d5d9e0);
  --dcs-success: #147a55;
  --dcs-warning: #a15c00;
  --dcs-danger: #b42318;
  color: var(--dcs-ink);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.55;
}
body[data-ds-dark-theme] .dcs-modal-backdrop, body[data-ds-dark-theme] .dcs-toast, body[data-ds-dark-theme] .dcs-plugin-cell {
  --dcs-success: #66d9a8;
  --dcs-warning: #ffc46b;
  --dcs-danger: #ff938a;
  --dcs-accent-soft: color-mix(in srgb, var(--dcs-accent) 18%, transparent);
  --dcs-accent-line: color-mix(in srgb, var(--dcs-accent) 38%, transparent);
}
.dcs-modal-backdrop { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; padding: 22px; background: rgba(16, 24, 40, .46); backdrop-filter: blur(3px); }
.dcs-modal { width: min(560px, 100%); max-height: 88vh; display: flex; flex-direction: column; border-radius: 18px; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); background: var(--dsw-alias-bg-layer-1, #fff); color: var(--dsw-alias-label-primary, #1f2329); box-shadow: 0 24px 70px rgba(16, 24, 40, .24); overflow: hidden; }
.dcs-modal--wide { width: min(720px, 100%); }
.dcs-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e7eb); }
.dcs-modal-head-copy { min-width: 0; }
.dcs-modal-title { margin: 0; font-size: 17px; letter-spacing: -.01em; }
.dcs-modal-subtitle { margin: 5px 0 0; color: var(--dsw-alias-label-secondary, #6b7280); font-size: 12.5px; line-height: 1.55; }
.dcs-modal-body { padding: 18px 22px; overflow: auto; display: flex; flex-direction: column; gap: 14px; }
.dcs-modal-foot { display: flex; justify-content: flex-end; gap: 9px; padding: 14px 22px 18px; border-top: 1px solid var(--dsw-alias-border-l1, #e5e7eb); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #fff) 88%, var(--dsw-alias-bg-base, #fff)); }
.dcs-icon-btn { width: 30px; height: 30px; border: 0; border-radius: 8px; display: grid; place-items: center; background: transparent; color: var(--dsw-alias-label-secondary, #6b7280); cursor: pointer; }
.dcs-icon-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #1f2329) 6%, transparent); color: var(--dsw-alias-label-primary, #1f2329); }
.dcs-x { font-size: 22px; line-height: 1; font-weight: 300; margin-top: -2px; }
.dcs-check-row { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; line-height: 1.5; color: var(--dsw-alias-label-primary, #1f2329); cursor: pointer; }
.dcs-check-row input { margin: 2px 0 0; accent-color: var(--dcs-accent, #4f6ef7); }
.dcs-check-row--card { padding: 11px 12px; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1, #f7f8fa); }
/* Push mode is a decision, not a checkbox row: give it its own block and hit area. */
.dcs-push-mode { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 12px 13px; border: 1px solid var(--dcs-line, #e5e7eb); border-radius: 12px; background: var(--dcs-layer, #f7f8fa); }
.dcs-push-mode-title { padding: 0; margin: 0 0 2px; font-size: 13.5px; font-weight: 600; color: var(--dcs-ink, #1f2329); }
.dcs-mode-option { display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; border: 1px solid var(--dcs-line, #e5e7eb); border-radius: 10px; background: var(--dcs-bg, #fff); cursor: pointer; transition: border-color .15s ease, background .15s ease, box-shadow .15s ease; }
.dcs-mode-option:hover { border-color: var(--dcs-line-2, #d5d9e0); }
.dcs-mode-option.is-active { border-color: var(--dcs-accent, #4f6ef7); background: var(--dcs-accent-soft, rgba(79, 110, 247, .12)); box-shadow: 0 0 0 1px var(--dcs-accent-line, rgba(79, 110, 247, .28)); }
.dcs-mode-option.is-disabled { opacity: .55; cursor: not-allowed; }
.dcs-mode-option input { margin: 3px 0 0; accent-color: var(--dcs-accent, #4f6ef7); }
.dcs-mode-copy { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dcs-mode-name { font-size: 14px; font-weight: 650; line-height: 1.4; color: var(--dcs-ink, #1f2329); }
.dcs-mode-desc { font-size: 12.5px; line-height: 1.55; color: var(--dcs-muted, #6b7280); }
.dcs-mode-hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dcs-warning, #a15c00); }
/* Modals are portalled to <body>; keep the host transparent to clicks except its children. */
.dcs-portal-host { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
.dcs-portal-host > * { pointer-events: auto; }
.dcs-agreement-modal .dcs-modal-body { gap: 12px; }
.dcs-agreement-signed { display: flex; align-items: center; gap: 7px; margin-top: 10px; padding: 9px 11px; border: 1px solid color-mix(in srgb, var(--dcs-success) 35%, var(--dcs-line)); border-radius: 9px; color: var(--dcs-success); background: color-mix(in srgb, var(--dcs-success) 8%, var(--dcs-layer)); font-size: 11px; }
.dcs-agreement-scroll { max-height: 42vh; overflow: auto; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-base, #fff); }
.dcs-agreement-text { margin: 0; padding: 14px; white-space: pre-wrap; font-family: inherit; font-size: 12px; line-height: 1.7; color: var(--dsw-alias-label-primary, #1f2329); }
.dcs-update-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dcs-update-item { display: flex; flex-direction: column; gap: 3px; padding: 10px 11px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); background: var(--dsw-alias-bg-layer-1, #f7f8fa); }
.dcs-update-label { color: var(--dsw-alias-label-secondary, #6b7280); font-size: 11px; }
.dcs-update-meta { color: var(--dsw-alias-label-secondary, #6b7280); font-size: 11.5px; }
.dcs-radio-list { display: flex; flex-direction: column; gap: 8px; }
.dcs-radio-item { display: flex; align-items: center; gap: 8px; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); border-radius: 9px; background: var(--dsw-alias-bg-layer-1, #f7f8fa); font-size: 12.5px; cursor: pointer; }
.dcs-radio-item input { accent-color: var(--dcs-accent, #4f6ef7); }
.dcs-file-drop { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 13px; border: 1px dashed var(--dsw-alias-border-l2, #d5d9e0); border-radius: 10px; background: var(--dsw-alias-bg-layer-1, #f7f8fa); }
.dcs-file-input { display: none; }
.dcs-file-name { color: var(--dsw-alias-label-secondary, #6b7280); font-size: 11.5px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcs-notice { position: fixed; right: 22px; bottom: 22px; z-index: 70; display: flex; align-items: flex-start; gap: 8px; max-width: min(380px, calc(100vw - 28px)); padding: 11px 12px; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); border-radius: 12px; background: var(--dsw-alias-bg-layer-2, #fff); color: var(--dsw-alias-label-primary, #1f2329); box-shadow: 0 12px 32px -12px rgba(16, 24, 40, .3), 0 1px 2px rgba(16, 24, 40, .08); font-size: 12px; line-height: 1.5; animation: dcs-toast-in .18s ease-out; }
.dcs-notice--success { border-color: color-mix(in srgb, #147a55 35%, #e5e7eb); }
.dcs-notice--success > svg { color: #147a55; }
.dcs-notice--error { border-color: color-mix(in srgb, #b42318 35%, #e5e7eb); }
.dcs-notice--error > svg { color: #b42318; }
.dcs-notice > svg { flex: none; margin-top: 1px; }
.dcs-notice-text { flex: 1; min-width: 0; }
.dcs-notice-close { flex: none; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary, #6b7280); font-size: 16px; line-height: 1; cursor: pointer; }
.dcs-notice-close:hover { background: color-mix(in srgb, #1f2329 7%, transparent); color: var(--dsw-alias-label-primary, #1f2329); }
.dcs-toast { position: fixed; right: 24px; bottom: 24px; z-index: 90; display: flex; align-items: center; gap: 9px; max-width: min(520px, calc(100vw - 32px)); padding: 11px 14px; border-radius: 11px; border: 1px solid var(--dsw-alias-border-l1, #e5e7eb); background: var(--dsw-alias-bg-layer-2, #fff); color: var(--dsw-alias-label-primary, #1f2329); box-shadow: 0 12px 32px rgba(16, 24, 40, .16); font-size: 12.5px; animation: dcs-toast-in .18s ease-out; }
.dcs-toast--success { border-color: color-mix(in srgb, #147a55 30%, transparent); color: #147a55; }
.dcs-toast--error { border-color: color-mix(in srgb, #b42318 34%, transparent); color: #b42318; }
.dcs-toast--warning { border-color: color-mix(in srgb, #b54708 34%, transparent); color: #b54708; }
body[data-ds-dark-theme] .dcs-toast--success { color: #66d9a8; }
body[data-ds-dark-theme] .dcs-toast--error { color: #ff938a; }
body[data-ds-dark-theme] .dcs-toast--warning { color: #f7b27a; }
.dcs-toast-text { flex: 1; min-width: 0; }
.dcs-toast-action { border: 0; background: transparent; color: var(--dcs-accent, #4f6ef7); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; padding: 2px 4px; }
@keyframes dcs-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.dcs-panel-icon { display: grid; place-items: center; color: currentColor; }
.dcs-panel-icon[data-active="true"] { color: var(--dsw-alias-brand-primary, currentColor); }

@media (max-width: 860px) {
  .dcs-page { padding: 20px 18px 60px; }
  .dcs-grid, .dcs-grid--top, .dcs-login, .dcs-layout { grid-template-columns: 1fr; }
  .dcs-column--side { order: 0; }
  .dcs-hero-meta { grid-template-columns: 1fr 1fr; }
  .dcs-login-aside { display: grid; grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .dcs-hero { padding: 20px; border-radius: 16px; }
  .dcs-hero-top { flex-direction: column; gap: 14px; }
  .dcs-hero-mark { width: 50px; height: 50px; border-radius: 14px; }
  .dcs-title { font-size: 22px; }
  .dcs-hero-status { flex-direction: row; align-items: center; }
  .dcs-hero-meta { grid-template-columns: 1fr; gap: 10px; }
  .dcs-stats-grid, .dcs-data-grid, .dcs-setting-grid, .dcs-legal-grid, .dcs-update-grid, .dcs-sync-grid { grid-template-columns: 1fr; }
  .dcs-segment { grid-template-columns: 1fr; }
  .dcs-token-guide { flex-wrap: wrap; align-items: flex-start; }
  .dcs-token-create { width: 100%; justify-content: center; margin-top: 2px; }
  .dcs-update-card-row, .dcs-uninstall-row { flex-direction: column; align-items: flex-start; }
  .dcs-select { width: 100%; max-width: none; }
  .dcs-memo-head { flex-direction: column; }
  .dcs-memo-tools { justify-content: flex-start; }
  .dcs-memo-composer { position: static; }
  .dcs-about-grid { grid-template-columns: 1fr; }
  .dcs-card { padding: 16px; border-radius: 14px; }
  .dcs-modal-backdrop { padding: 10px; align-items: flex-end; }
  .dcs-modal { max-height: 92vh; border-radius: 16px; }
  .dcs-toast { right: 12px; bottom: 12px; left: 12px; max-width: none; }
  .dcs-encryption-state { flex-wrap: wrap; }
  .dcs-encryption-actions { width: 100%; justify-content: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .dcs-spinner { animation-duration: 2s; }
  .dcs-toast { animation: none; }
  .dcs-btn, .dcs-toggle, .dcs-toggle-knob { transition: none; }
}
`;

    function insertStyles(css) {
      for (const previous of document.querySelectorAll('style[data-plugin-css="dsh-chat-syncer"]')) previous.remove();
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-chat-syncer';
      tag.dataset.pluginCss = 'dsh-chat-syncer';
      tag.textContent = css;
      document.head.append(tag);
      return () => { if (tag.isConnected) tag.remove(); };
    }

    /* ------------------------------------------------------------------ */
    /* Plugin wiring                                                      */
    /* ------------------------------------------------------------------ */

    const runtime = {
      openPanel: () => false,
      openPluginManager: () => false,
      layout: null,
      remote: null,
    };

    const inject = ['slots', 'locale', 'remote', 'remote.pluginManager'];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'chat-sync: dictionaries');
      const bound = ctx.locale.bind(NS);
      localeT = bound;
      translate = (key, params) => {
        let value = null;
        try {
          value = bound(key, params);
        } catch {
          value = null;
        }
        if (!value || value === key) value = zh[key] ?? en[key] ?? key;
        return formatText(value, params);
      };
      ctx.effect(() => insertStyles(CSS), 'chat-sync: styles');

      try {
        const layout = ctx.get('layout');
        if (layout && typeof layout.selectPanel === 'function') {
          runtime.layout = layout;
          runtime.openPanel = () => {
            layout.selectPanel(PANEL_ID);
            return true;
          };
        }
      } catch {
        runtime.layout = null;
      }

      try {
        runtime.remote = ctx.remote || ctx.get('remote') || null;
      } catch {
        runtime.remote = null;
      }
      runtime.openPluginManager = () => {
        try {
          const navigation = ctx.get('pluginNavigation');
          if (navigation && typeof navigation.openBundle === 'function') {
            navigation.openBundle(PACKAGE_NAME);
            return true;
          }
        } catch {
          /* The manager is optional. */
        }
        return false;
      };

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 24,
        locale: NS,
        label: () => translate('panel.label'),
      }, PanelIcon));

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      }, SettingsPage));

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: `${PANEL_ID}.overlays`,
        order: 72,
        locale: NS,
      }, GlobalOverlays));

      ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
        name: 'plugins.bundle.config',
        key: PACKAGE_NAME,
      }, PluginCell));
    }

    return { inject, apply };
  },
});



