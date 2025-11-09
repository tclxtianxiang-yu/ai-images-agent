# 🚀 AI Images Agent - Cloudflare Workers 部署指南

## ✅ 修复完成

你的项目已经成功配置为使用 OpenNext Cloudflare adapter。以下是修改的内容：

### 主要变更

1. **降级 Next.js**: 从 16.0.1 → 15.1.6 （OpenNext 支持的最新版本）
2. **移除弃用包**: 删除了 `@cloudflare/next-on-pages`
3. **安装 OpenNext**: 添加了 `@opennextjs/cloudflare@1.11.1` 和 `wrangler@4.46.0`
4. **更新配置**: 创建了 `open-next.config.ts` 配置文件
5. **移除 edge runtime**: 从 API route 中移除了 `export const runtime = 'edge'`（OpenNext 自动处理）

---

## 📋 部署前准备

### 1. 设置 Cloudflare 环境变量

首先登录 Wrangler：

```bash
npx wrangler login
```

### 2. 配置 Secrets

设置你的 OpenAI API key：

```bash
npx wrangler secret put AI_API_KEY
# 输入你的 OpenAI API key: sk-proj-...
```

### 3. 配置 wrangler.toml

确保 `wrangler.toml` 中的以下配置正确：

- `name`: 你的 Worker 名称（已设置为 `ai-images-agent`）
- R2 bucket 绑定（已配置为 `bucket1`）
- 如果需要，添加你的 `account_id`

---

## 🚀 部署到 Cloudflare Workers

### 方式一：本地构建并部署（推荐）

```bash
# 完整部署流程（构建 + 部署）
pnpm run deploy

# 或者分步执行
pnpm run build          # 构建 Next.js
pnpm run build:worker   # 转换为 Cloudflare Workers 格式
npx wrangler deploy     # 部署到 Cloudflare
```

### 方式二：部署到特定环境

```bash
# 部署到开发环境
pnpm run deploy:dev

# 部署到生产环境
pnpm run deploy:prod
```

---

## 🧪 本地测试

在部署前，你可以在本地测试：

```bash
# 构建项目
pnpm run build
pnpm run build:worker

# 启动 Wrangler 开发服务器
pnpm run preview
```

访问 `http://localhost:8788` 查看你的应用。

---

## 📝 通过 Cloudflare Dashboard 部署

如果你想通过 Cloudflare Dashboard 自动部署（连接 GitHub）：

### 1. 在 Cloudflare Dashboard 创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create**
3. 选择 **Create Worker** 或 **Connect to Git**

### 2. 如果选择 Git 集成：

配置构建设置：

- **Framework preset**: None
- **Build command**: `pnpm run build && pnpm run build:worker`
- **Build output directory**: `.open-next`（OpenNext 的输出目录）

### 3. 配置环境变量

在 Worker Settings 中添加：

- **Environment Variable**: `NODE_ENV` = `production`
- **Secret**: `AI_API_KEY` = 你的 OpenAI API key

### 4. 配置 R2 绑定

在 Worker Settings → Bindings 中：

- **Variable name**: `R2_BUCKET`
- **R2 bucket**: `bucket1`（或你的 bucket 名称）

---

## 🔍 验证部署

部署成功后，测试你的 API：

```bash
# 健康检查
curl https://your-worker.workers.dev/api/upload

# 预期响应
{
  "status": "ok",
  "service": "AI Images Agent",
  "endpoints": {
    "upload": "POST /api/upload"
  }
}
```

---

## 📊 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Next.js 开发服务器 |
| `pnpm build` | 构建 Next.js 应用 |
| `pnpm build:worker` | 使用 OpenNext 转换为 Workers 格式 |
| `pnpm deploy` | 完整部署流程 |
| `pnpm deploy:dev` | 部署到开发环境 |
| `pnpm deploy:prod` | 部署到生产环境 |
| `pnpm preview` | 本地预览 Worker |
| `pnpm cf:dev` | 使用 Wrangler 开发服务器 |
| `pnpm cf:tail` | 查看实时日志 |

---

## 🐛 故障排查

### 问题 1: "R2_BUCKET binding not found"

**解决**: 确保在 Cloudflare Dashboard 或 `wrangler.toml` 中正确配置了 R2 binding。

### 问题 2: "AI_API_KEY environment variable is not set"

**解决**: 运行 `npx wrangler secret put AI_API_KEY` 设置密钥。

### 问题 3: Build 失败

**解决**:
```bash
# 清理并重新安装
rm -rf node_modules .next .open-next
pnpm install
pnpm run build
pnpm run build:worker
```

### 问题 4: 部署后 404 错误

**解决**: 检查路由配置，确保 `wrangler.toml` 中没有冲突的路由规则。

---

## 📚 重要文件说明

- `wrangler.toml`: Cloudflare Workers 配置
- `open-next.config.ts`: OpenNext adapter 配置
- `.open-next/worker.js`: 生成的 Worker 代码（构建后）
- `package.json`: NPM 脚本和依赖

---

## 🎯 下一步

1. ✅ 部署你的应用：`pnpm run deploy`
2. 🧪 测试上传功能
3. 📊 在 Cloudflare Dashboard 查看分析数据
4. 🔒 配置自定义域名（可选）

---

## 📖 相关文档

- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

**祝部署顺利！** 🎉

如有问题，请查看日志：`pnpm run cf:tail`
