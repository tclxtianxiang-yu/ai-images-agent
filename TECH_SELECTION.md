# AI Images Agent 技术选型

## 1. 整体架构
- **形态**：Next.js 16 App Router 单体应用，前端与 API Routes 一体化部署到 Cloudflare Workers。
- **核心流程**：前端拖拽/上传图片 → 通过 API 调用 Mastra Workflow → 工具链压缩图片、上传 R2、调用模型生成描述 → 将图片描述与 R2 URL 回传前端。
- **关键模块**：
  | 模块 | 方案 | 说明 |
  | --- | --- | --- |
  | Web UI | Next.js 16 + React 19 + Tailwind CSS 4 | App Router、Server Actions、边缘渲染能力契合 Workers；Tailwind 4 便于快速迭代 UI。 |
  | Agent Orchestration | Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/libsql`, `@mastra/loggers`) | Workflow 负责编排压缩/上传/描述步骤，Agent 暴露工具链；LibSQLStore 暂存任务上下文与记忆。 |
  | AI 能力 | OpenAI `gpt-4o-mini`（可通过 Mastra 切换） | 负责根据工具返回的信息生成多语言图片描述。 |
  | 对象存储 | Cloudflare R2 | 低延迟、免出口流量，上传后生成可公开访问的 HTTPS 链接。 |
  | 运行时 | Cloudflare Workers | 负责边缘渲染、调用 Mastra、签名上传、与 R2/R2 bindings 交互。 |
  | 依赖管理 | pnpm + TypeScript 5 + ESLint 9 | 确保一致的锁定管理与类型安全。 |

## 2. 前端层
1. **Next.js 16**：启用 Server Components、Edge Runtime 与内置的 Image Optimization，减少自建服务成本。
2. **React 19**：提高指令式 UI 能力，可结合 `useOptimistic` 等特性提升上传状态反馈。
3. **Tailwind CSS 4**：零配置即可获得设计系统；与暗色模式/响应式预设契合设计需求。
4. **Zod 4**：统一前后端校验上传的元信息（文件类型、大小、caption 等），避免不合法请求到达 Worker。
5. **拖拽上传方案**：基于原生 `DataTransfer` + `<input type="file">`，辅以 `react-dropzone`（如后续引入）以增强体验。

## 3. Agent & AI 层
1. **Mastra Workflow**：按照「压缩 → 上传 → 分析」拆分为步骤，方便插拔式扩展（例如增加 NSFW 识别、色彩标签）。
2. **Tools 设计**：
   - `compressImageTool`：调用如 `@cloudflare/workers-types` + WASM/Sharp-wasm 在 Workers 侧执行无损压缩。
   - `uploadR2Tool`：依赖 R2 binding（`env.R2_BUCKET`）完成 `putObject` 并返回公开访问 URL。
   - `describeImageTool`：调用外部模型（OpenAI Visions、Fal AI 等）或复用多模态 API。
3. **记忆与日志**：`@mastra/libsql` 以 `:memory:` 模式用于开发调试，可切换到 `file:../mastra.db` 以持久化；`@mastra/loggers` 提供结构化日志，便于 Cloudflare Logpush 收集。

## 4. 后端与基础设施
1. **Cloudflare Workers**：使用 `wrangler` 打包 Next.js 输出，部署后享受 0 冷启动和全球加速；需设置 `compatibility_date` 与 `node_compat=true` 以兼容 Node API。
2. **Cloudflare R2**：设置公共只读 bucket，配合自定义域名 `https://static.mikasa-ackerman.vip`；为了安全，上传流程采用临时签名或 Worker 代理，禁止前端直传 Access Key。
3. **配置管理**：通过 `wrangler.toml` 注入
   - `AI_API_KEY`：OpenAI 或其他大模型密钥
   - `R2_BUCKET`：绑定的 R2 命名空间
   - `MAS_TRA_DB_URL`：LibSQL/Turso endpoint（若不使用内存存储）
4. **CI/CD**：推荐 GitHub Actions 触发 `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm test`（如有）、`pnpm build`，然后使用 `wrangler deploy`.

## 5. 安全与合规
1. **上传限制**：在前端与 Worker 校验 MIME、大小（≤10MB）与数量，防止滥用。
2. **鉴权**：根据业务可添加 MAS key 或 Cloudflare Access；最小权限的 R2 token（仅写入指定 bucket）。
3. **审计**：Mastra Logger + Workers Trace Events 输出关键信息，结合 R2 Access Logs 进行追踪。

## 6. 可扩展性预留
- 可替换/新增模型提供器（Azure OpenAI、Claude）而不影响 Workflow。
- 通过在 Workflow 中新增步骤支持批量上传、标签提取、自动封面生成等能力。
- 借助 Cloudflare Queues 处理大图压缩队列，保障前端响应时间。

> 以上技术选型基于当前仓库依赖（`ai-images-agent/package.json`）与 PROJECT.md 中的业务需求整理，可在后续迭代中按需调整。
