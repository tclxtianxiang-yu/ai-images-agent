# Cloudflare Workers 部署教程

本教程将指导你如何将 AI Images Agent 项目部署到 Cloudflare Workers，并配置 R2 存储。

## 前置条件 ✅

- ✅ Cloudflare 账号已创建
- ✅ 域名已绑定到 Cloudflare
- ✅ R2 已开通
- ✅ R2 自定义域名已配置
- ✅ 本地已安装 Node.js 和 pnpm

---

## 第一步：获取 Cloudflare 配置信息

### 1.1 获取 Account ID

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在右侧边栏或主页，找到你的 **Account ID**
3. 复制这个 ID（格式类似：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`）

**位置**：
- 方法一：Dashboard 首页 → 右侧 "Account ID"
- 方法二：Workers & Pages → 右侧 "Account ID"

### 1.2 获取 R2 Bucket 信息

1. 前往 **R2 Object Storage**：
   ```
   Dashboard → R2 Object Storage → Overview
   ```

2. 找到你创建的 bucket 名称（例如：`ai-images`）

3. 记录以下信息：
   - **Bucket 名称**：例如 `ai-images`
   - **R2 自定义域名**：例如 `https://static.mikasa-ackerman.vip`

### 1.3 创建 R2 API Token（用于本地开发）

1. 前往 **R2** → **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. 配置权限：
   - **Token Name**: `ai-images-agent-dev`
   - **Permissions**: 选择 "Object Read & Write"
   - **Specify bucket**: 选择你的 bucket（如 `ai-images`）
4. 点击 **Create API Token**
5. 复制并保存：
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

---

## 第二步：安装 Wrangler CLI

Wrangler 是 Cloudflare Workers 的官方 CLI 工具。

```bash
# 全局安装 Wrangler
npm install -g wrangler

# 验证安装
wrangler --version
```

---

## 第三步：配置 wrangler.toml

编辑项目根目录下的 `wrangler.toml` 文件：

```toml
name = "ai-images-agent"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# ⚠️ 重要：填入你的 Account ID
account_id = "YOUR_ACCOUNT_ID_HERE"

# 环境变量
[vars]
NODE_ENV = "production"

# ⚠️ 重要：配置 R2 Bucket 绑定
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ai-images"  # 替换为你的 bucket 名称

# 开发环境配置（可选）
[env.development]
name = "ai-images-agent-dev"

[[env.development.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ai-images-dev"  # 如果有开发环境的 bucket

# 生产环境配置
[env.production]
name = "ai-images-agent"

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ai-images"  # 你的生产环境 bucket

# 如果需要绑定自定义域名到 Worker（可选）
# routes = [
#   { pattern = "images.your-domain.com/*", zone_name = "your-domain.com" }
# ]
```

**⚠️ 必须修改的内容：**
1. `account_id`: 替换为你在步骤 1.1 获取的 Account ID
2. `bucket_name`: 替换为你的 R2 bucket 名称

---

## 第四步：修改代码以支持 R2 上传

编辑 `src/lib/image-processing.ts`，更新 R2 上传逻辑：

```typescript
// 找到 uploadToR2 函数，确保 R2 自定义域名正确
export async function uploadToR2(
  imageData: string,
  fileName: string,
  mimeType: string
): Promise<{ url: string; key: string; uploadedAt: string }> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // 开发环境 mock
    const mockUrl = `https://static.mikasa-ackerman.vip/dev/${Date.now()}-${fileName}`;
    console.log(`[DEV MODE] Mock upload to R2: ${fileName}`);
    return {
      url: mockUrl,
      key: `dev/${Date.now()}-${fileName}`,
      uploadedAt: new Date().toISOString(),
    };
  }

  // 生产环境 - Cloudflare Workers R2 绑定
  // @ts-expect-error - R2 binding will be available in Workers runtime
  const R2_BUCKET = globalThis.R2_BUCKET;

  if (!R2_BUCKET) {
    throw new Error('R2_BUCKET binding not found');
  }

  const timestamp = Date.now();
  const key = `images/${timestamp}-${fileName}`;
  const buffer = Buffer.from(imageData, 'base64');

  await R2_BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  // ⚠️ 重要：使用你配置的 R2 自定义域名
  const url = `https://static.mikasa-ackerman.vip/${key}`;
  console.log(`Uploaded to R2: ${key}`);

  return {
    url,
    key,
    uploadedAt: new Date().toISOString(),
  };
}
```

**⚠️ 确保 `https://static.mikasa-ackerman.vip` 替换为你的 R2 自定义域名！**

---

## 第五步：登录 Wrangler

```bash
# 登录到 Cloudflare
wrangler login
```

这会打开浏览器，要求你授权 Wrangler 访问你的 Cloudflare 账户。

---

## 第六步：设置 Secrets（环境变量）

Cloudflare Workers 使用 secrets 来安全地存储敏感信息（如 API 密钥）。

```bash
# 设置 OpenAI API Key
wrangler secret put AI_API_KEY

# 终端会提示你输入密钥值，粘贴你的 OpenAI API Key 后按回车
# 输入: sk-proj-YOUR-API-KEY-HERE
```

**验证 secret 已设置：**
```bash
# 列出所有 secrets（只显示名称，不显示值）
wrangler secret list
```

---

## 第七步：构建项目

由于 Cloudflare Workers 对 Next.js 的支持有特殊要求，我们需要使用适配器。

### 7.1 安装 @cloudflare/next-on-pages

```bash
pnpm add -D @cloudflare/next-on-pages
```

### 7.2 更新 package.json 脚本

编辑 `package.json`，添加/更新构建脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:worker": "next build && npx @cloudflare/next-on-pages",
    "start": "next start",
    "lint": "eslint",
    "deploy": "pnpm build:worker && wrangler deploy",
    "deploy:prod": "pnpm build:worker && wrangler deploy --env production",
    "preview": "wrangler pages dev .vercel/output/static",
    "cf:tail": "wrangler tail"
  }
}
```

### 7.3 构建项目

```bash
# 构建 Next.js 并转换为 Workers 格式
pnpm run build:worker
```

如果构建成功，你会看到类似输出：
```
✓ Compiled successfully
⚡ Detected a Next.js build

✨ Completed
```

---

## 第八步：部署到 Cloudflare Workers

### 8.1 首次部署（开发环境）

```bash
# 部署到开发环境
wrangler deploy --env development
```

或者使用简化命令：
```bash
pnpm run deploy
```

### 8.2 部署到生产环境

```bash
# 部署到生产环境
wrangler deploy --env production
```

或者：
```bash
pnpm run deploy:prod
```

### 8.3 查看部署结果

部署成功后，你会看到类似输出：
```
Published ai-images-agent (X.XX sec)
  https://ai-images-agent.YOUR-SUBDOMAIN.workers.dev
```

复制这个 URL，这就是你的 Worker 地址！

---

## 第九步：验证部署

### 9.1 测试 API 健康检查

```bash
curl https://ai-images-agent.YOUR-SUBDOMAIN.workers.dev/api/upload
```

预期响应：
```json
{
  "status": "ok",
  "service": "AI Images Agent",
  "endpoints": {
    "upload": "POST /api/upload"
  }
}
```

### 9.2 测试图片上传

创建测试脚本 `test-worker-upload.js`：

```javascript
const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function test() {
  const response = await fetch('https://ai-images-agent.YOUR-SUBDOMAIN.workers.dev/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: testImage,
      fileName: 'test.png',
      mimeType: 'image/png',
      fileSize: 72,
      language: 'en'
    })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
```

运行测试：
```bash
node test-worker-upload.js
```

### 9.3 验证 R2 上传

如果上传成功，返回的 `data.url` 应该是：
```
https://static.mikasa-ackerman.vip/images/TIMESTAMP-FILENAME.png
```

访问这个 URL，应该能看到上传的图片！

---

## 第十步：绑定自定义域名（可选）

如果你想用自己的域名访问 Worker，而不是 `.workers.dev`：

### 10.1 在 Cloudflare Dashboard 配置

1. 前往 **Workers & Pages**
2. 选择你的 Worker：`ai-images-agent`
3. 点击 **Settings** → **Triggers** → **Custom Domains**
4. 点击 **Add Custom Domain**
5. 输入你的域名，例如：`images.your-domain.com`
6. 点击 **Add Custom Domain**

Cloudflare 会自动配置 DNS 和 SSL 证书。

### 10.2 更新 wrangler.toml（可选）

```toml
[env.production]
routes = [
  { pattern = "images.your-domain.com/*", zone_name = "your-domain.com" }
]
```

重新部署：
```bash
pnpm run deploy:prod
```

---

## 第十一步：监控和日志

### 11.1 实时查看日志

```bash
# 实时查看 Worker 日志
wrangler tail

# 或指定环境
wrangler tail --env production
```

### 11.2 查看部署历史

1. 前往 **Workers & Pages**
2. 选择你的 Worker
3. 点击 **Deployments** 查看部署历史

### 11.3 查看分析数据

1. 在 Worker 详情页
2. 点击 **Analytics**
3. 查看请求量、错误率、CPU 使用等

---

## 常见问题和解决方案

### ❌ 问题 1：R2_BUCKET binding not found

**原因**：wrangler.toml 配置错误或 binding 名称不匹配

**解决**：
1. 确认 `wrangler.toml` 中 `binding = "R2_BUCKET"`
2. 确认代码中使用 `globalThis.R2_BUCKET`
3. 重新部署：`pnpm run deploy:prod`

### ❌ 问题 2：AI_API_KEY environment variable is not set

**原因**：Secret 未设置

**解决**：
```bash
wrangler secret put AI_API_KEY
# 输入你的 OpenAI API Key
```

### ❌ 问题 3：图片上传后无法访问

**原因**：R2 自定义域名未正确配置

**解决**：
1. 前往 **R2** → 你的 bucket → **Settings** → **Public Access**
2. 确认 **Custom Domains** 已添加
3. 检查代码中的域名是否与配置一致

### ❌ 问题 4：Build 失败

**原因**：依赖或配置问题

**解决**：
```bash
# 清理并重新安装
rm -rf node_modules .next
pnpm install
pnpm run build:worker
```

### ❌ 问题 5：CORS 错误

**原因**：需要在 R2 bucket 配置 CORS

**解决**：
1. 前往 **R2** → 你的 bucket → **Settings** → **CORS Policy**
2. 添加 CORS 规则：
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 项目管理命令速查

```bash
# 构建
pnpm run build:worker

# 部署到生产环境
pnpm run deploy:prod

# 查看实时日志
pnpm run cf:tail

# 列出 secrets
wrangler secret list

# 删除 secret
wrangler secret delete SECRET_NAME

# 回滚到上一个版本
wrangler rollback

# 查看 Worker 信息
wrangler whoami
```

---

## 成本估算

### Cloudflare Workers 免费额度（Free Plan）

- **请求数**：每天 100,000 次
- **CPU 时间**：每请求 10ms
- **持续时间**：无限制（但单次请求最长 30 秒）

### Cloudflare R2 免费额度

- **存储空间**：10 GB/月
- **Class A 操作**（写入）：100 万次/月
- **Class B 操作**（读取）：1000 万次/月
- **出站流量**：免费（无限制）

对于个人项目和小型应用，免费额度完全够用！

---

## 下一步优化

1. **添加图片压缩**
   - 集成 `sharp-wasm` 进行真实的图片压缩
   - 减少存储成本和加载时间

2. **添加缓存**
   - 使用 Cloudflare Cache API
   - 减少重复请求的处理时间

3. **添加速率限制**
   - 防止滥用
   - 使用 Cloudflare Rate Limiting

4. **添加图片审核**
   - 集成 NSFW 检测
   - 过滤不适当内容

5. **监控和告警**
   - 使用 Cloudflare Workers Analytics
   - 设置错误告警

---

## 有用的资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

**祝部署顺利！🚀**

如有问题，请查看 Cloudflare Dashboard 中的日志或使用 `wrangler tail` 实时调试。
