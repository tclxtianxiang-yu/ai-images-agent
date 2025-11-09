# AI Images Agent 部署指南 (Cloudflare Workers)

> 目标：将 Next.js + Mastra 应用部署到 Cloudflare Workers，并完成与 R2 的集成。适用于 `ai-images-agent` 目录下的项目。

## 1. 前置条件
1. **环境**
   - Node.js ≥ 20
   - pnpm ≥ 8 (`corepack enable`)
   - Wrangler CLI ≥ 3.90 (`npm i -g wrangler`)
2. **Cloudflare 资源**
   - 已创建 Cloudflare 账户并有 Workers 权限
   - 已创建 R2 bucket（例如 `ai-images`），并记录 `account_id`
   - 如需使用 OpenAI/GPT-4o，准备好 `AI_API_KEY`

## 2. 本地配置
1. 安装依赖：
   ```bash
   pnpm install
   ```
2. 新建 `.env`（或 `wrangler.toml` 的 `[vars]` 节）并填写：
   ```
   AI_API_KEY=sk-...
   R2_BUCKET_NAME=ai-images
   MAS_TRA_DB_URL=:memory:        # 若需要持久化改为 libsql 连接串
   ```
3. 若需要在本地模拟 R2，可使用 `miniflare` 或将 `wrangler dev --local` 绑定到本地存储。

## 3. Wrangler 配置
`wrangler.toml` 示例：
```toml
name = "ai-images-agent"
main = ".wrangler/worker.js"
compatibility_date = "2024-12-01"
node_compat = true

[build]
command = "pnpm run build"

[vars]
AI_API_KEY = "${AI_API_KEY}"
R2_BUCKET_NAME = "${R2_BUCKET_NAME}"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ai-images"
preview_bucket_name = "ai-images-dev"
```
- `node_compat` 确保 Next.js 运行时可使用 Node API。
- `binding` 名称需与 Worker 代码一致（例如 `env.R2_BUCKET`）。

## 4. 构建与本地验证
1. 运行开发环境：`pnpm dev`
2. 构建产物（Next.js → Workers）：推荐使用 `@cloudflare/next-on-pages`
   ```bash
   pnpm dlx @cloudflare/next-on-pages@latest
   pnpm run build
   ```
   - `pnpm run build` 期间，Next.js 会输出到 `.vercel/output`.
   - `next-on-pages` 会将产物转换为 Workers 兼容格式（`.wrangler` 目录）。
3. 本地 Worker 验证：
   ```bash
   wrangler dev
   ```
   - 确认上传 API、Mastra Workflow 在本地可执行。

## 5. 部署到 Cloudflare
1. 登录：`wrangler login`
2. 部署：`wrangler deploy`
3. 验证：`wrangler tail` 观察日志；访问 `https://<worker-subdomain>.workers.dev` 进行 E2E 验收。
4. 自定义域名：在 Cloudflare 控制台 → Workers → Triggers → Custom Domains 绑定域名。

## 6. R2 上传与访问策略
1. 在 Cloudflare Dashboard → R2 → Settings → CORS 中允许前端域名和 `PUT/GET` 方法。
2. 如果前端需要直接上传，Worker 需签发临时 URL 或通过 Workers 作为代理上传，以避免暴露 Access Key。
3. 若需要公开访问图片，可使用 R2 Custom Domain 或启用 `r2.dev` 公共访问，并控制过期策略。

## 7. 监控与回滚
- 使用 `wrangler tail --format=pretty` 查看实时日志；Mastra 的 `PinoLogger` 会输出 Workflow 状态。
- 建议在 GitHub Actions / CI 中保存构建产物，若需回滚可 `wrangler deploy --assets .wrangler --env <previous>`。
- 关键变量改动（如模型 Key）不要直接写死在仓库，统一走环境变量。

## 8. 常见问题
| 问题 | 处理方式 |
| --- | --- |
| 构建时报 `edge runtime not supported` | 确认 Next.js 版本 ≥16 且 `experimental.turbo` 未与 Workers 冲突；必要时使用 `next.config.ts` 设置 `output: "export"` + `next-on-pages`. |
| 上传大图超时 | 将压缩步骤前移到客户端或通过 Cloudflare Queues 异步处理，并在前端轮询结果。 |
| R2 URL 无法公开访问 | 检查 bucket 权限或为对象设置 `put` 头 `Content-Type`/`Cache-Control`，必要时使用带签名的 URL。 |

部署完成后，将生成的 Worker 域名与 R2 Bucket 信息回填到 README，以便团队成员共享。
