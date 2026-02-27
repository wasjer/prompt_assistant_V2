# AI Prompt 管理助手 (v1.0)

在各大 AI 对话页面（ChatGPT、通义千问、豆包、Gemini、DeepSeek 等）自动捕获用户输入的 Prompt，并存入本地 Node.js + SQLite 数据库，通过 Web 面板进行查看、筛选与导出。

---

## 项目结构

- **extension/** — Chrome 插件（Manifest V3，纯原生 JS），负责在页面上捕获 Prompt 并 POST 到本地 API。
- **api/** — 本地 Node.js + Express 后端，提供数据接收、存储（SQLite）及查询/删除接口，并托管 Web 管理面板静态页。

---

## 一、启动本地后端

1. 进入后端目录并安装依赖（首次需执行）：
   ```bash
   cd api
   npm install
   ```
2. 启动服务：
   ```bash
   node src/server.js
   ```
3. 终端中看到类似「服务器运行在 http://localhost:3000」即表示成功。数据库文件位于 `api/data/promptvault.db`，首次启动会自动创建。

---

## 二、在 Chrome 中加载 / 更新插件

1. 打开 Chrome，地址栏输入 `chrome://extensions/` 回车。
2. 右上角打开 **「开发者模式」**。
3. 点击 **「加载已解压的扩展程序」**，选择本项目下的 **`extension`** 文件夹（不要选整个项目根目录）。
4. 加载成功后，在支持的 AI 站点输入并发送消息时，插件会将 Prompt 上报到本地 `http://localhost:3000/api/prompts`。
5. **若修改了插件代码**：在 `chrome://extensions/` 页面找到本插件，点击 **「重新加载」**（圆形箭头图标）即可生效。

---

## 三、Web 管理面板

- **访问地址**：后端启动后，在浏览器中打开 **http://localhost:3000/** 即可打开管理控制台。
- **功能**：
  - **平台筛选**：按 ChatGPT、Qwen、Doubao、Gemini、DeepSeek 等筛选。
  - **关键词搜索**：在 Prompt 内容中搜索。
  - **搜索**：根据当前筛选条件请求数据并刷新表格。
  - **表格**：展示捕获时间、平台、Prompt 内容预览；每行可 **删除** 单条记录。
  - **导出 CSV**：将当前表格数据导出为 CSV 文件（含 BOM，Excel 打开中文不乱码），便于备份或二次分析。

---

## 四、技术说明

- 插件仅做采集与上报，不包含管理界面；数据存储与接口均在 `api` 端。
- 数据标准字段：`id`, `userId`, `model`, `url`, `ts`, `prompt`, `flagged`, `hitTerms`。
