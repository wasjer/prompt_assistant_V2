阶段 1：搭建骨架与 ChatGPT 单点跑通
把这段发给 Cursor：

@extension 帮我创建一个 Manifest V3 插件的基础骨架。包含 manifest.json和content.js。 任务：在 content.js 中实现针对 ChatGPT (chatgpt.com) 的 DOM 监听。当用户点击发送按钮或按下回车时，抓取输入框的 prompt 文本。 将抓取到的 {id, prompt, model: 'ChatGPT', url, timestamp} 直接存入浏览器的 IndexedDB 中。 约束：纯 Vanilla JS 实现，绝对不使用 npm、webpack 或任何前端框架。确保体积最小化。

阶段 2：开发轻量级本地管理面板
把这段发给 Cursor：

@extension 新建 dashboard.html和dashboard.js，并在 manifest 中注册为插件的 Options 页或独立的 Tab 页。 任务：从 IndexedDB 中读取所有保存的 prompt 数据，并用 HTML 表格渲染出来。 功能：1. 支持点击按钮删除单条记录。2. 支持一个“导出全部为 CSV”的按钮。 约束：继续使用原生 JS。CSS 可以手写或引入一个极小的 CDN 样式库（如 Pico.css），严禁引入 node_modules。

阶段 3：横向扩展其他 AI 平台
（等阶段 1 和 2 跑通且你测试没问题后，再执行此步）
把这段发给 Cursor：

@content.js 目前已经支持了 ChatGPT。请重构代码，将“平台识别”和“DOM 选择器”抽离成一个配置表。 然后，请参考 ChatGPT 的逻辑，依次增加对 Gemini、Kimi 和豆包（Doubao）的 DOM 监听支持。 约束：保持代码整洁，只修改规则表，不破坏原有数据写入逻辑。

阶段 4：商业化上云与企业管控（未来规划）
当你准备发布收费版时，我们将引入 Supabase。到时候只做一件事：拦截写向 IndexedDB 的数据，改为通过 API POST 到 Supabase，并在 Supabase 的 Edge Functions 里做敏感词拦截和打标（is_flagged）。插件端基本不需要大改。