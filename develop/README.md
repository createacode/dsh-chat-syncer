# 开发入口

> 面向维护者、贡献者和二次开发者的开发资料入口。项目定位见 [项目说明](../docs/readme.md)，实现细节见 [开发文档](../docs/develop-readme.md)。

## 文档地图

| 文档 | 内容 |
|---|---|
| [语言与文案规范](language-spec.md) | 本插件的中文语言、术语、UI 文案、代码命名、提交和文档规范 |
| [开发文档](../docs/develop-readme.md) | 运行模型、源码结构、HTTP 接口、数据格式、同步流程、测试和发布 |
| [项目说明](../docs/readme.md) | 项目定位、功能范围、架构、安装、安全边界和已知限制 |
| [增量同步设计](../docs/INCREMENTAL.md) | 语义增量与对象级增量方案 |
| [项目首页](../README.md) | 宣传式首页与快速开始 |

## 本地开发

```powershell
npm install
npm run check
npm test
```

本地调试安装：

```powershell
dsh plugin --profile desktop add "file:<path-to-this-repo>"
```

修改 Host 代码后需要重启 DSH；修改 `client.js` 后刷新插件页面。

## 核心约束

- 浏览器端不接触 PAT、绝对路径和明文口令。
- 所有仓库操作在 Host 的 `lib/service.js` 中完成。
- 仓库必须保持私有；公开仓库必须被拒绝。
- 所有破坏性操作必须二次确认，且不影响现有聊天。
- 新增用户可见文本必须同时维护中英文 `tr()` 字典。
- 新增仓库写入必须形成中文 Git 提交。
- 许可证为 AGPL-3.0-only。

## 目录

```text
index.js              Host 入口
client.js             Web 客户端
lib/                  Host 业务与基础设施
docs/                 项目文档
develop/              开发规范与开发入口
test/                 Node 内置测试
```
