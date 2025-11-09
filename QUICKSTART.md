# AI Images Agent - Quick Start Guide

Welcome to AI Images Agent! This guide will help you get started quickly.

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 8
- Cloudflare account (for deployment)
- OpenAI API key

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
AI_API_KEY=sk-your-actual-openai-key
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test the Application

1. Drag and drop an image or click to select
2. Wait for processing (compression → upload → description)
3. View the results with AI-generated description and image URL

## Cloudflare Deployment

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create R2 Bucket

In your Cloudflare Dashboard:
1. Go to R2 Object Storage
2. Create a new bucket named `ai-images`
3. Create another bucket named `ai-images-dev` for development

### 4. Configure wrangler.toml

Update the `wrangler.toml` file:
- Add your Cloudflare `account_id`
- Verify R2 bucket names match your setup

### 5. Set Secrets

```bash
# Set your OpenAI API key
wrangler secret put AI_API_KEY

# Optional: Set Mastra DB URL if using persistent storage
wrangler secret put MASTRA_DB_URL
```

### 6. Build and Deploy

```bash
# Build the application
pnpm build

# Deploy to production
pnpm deploy:prod

# Or deploy to development
pnpm deploy:dev
```

### 7. Configure Custom Domain (Optional)

1. In Cloudflare Dashboard, go to Workers & Pages
2. Select your worker
3. Go to Triggers → Custom Domains
4. Add your domain (e.g., `images.mikasa-ackerman.vip`)

For R2 custom domain:
1. Go to R2 → Your Bucket → Settings
2. Configure custom domain: `static.mikasa-ackerman.vip`

## Project Structure

```
ai-images-agent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/upload/        # Image upload API endpoint
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/            # React components
│   │   ├── image-upload.tsx   # Upload area component
│   │   ├── image-result.tsx   # Result display component
│   │   └── image-history.tsx  # History management
│   ├── mastra/                # Mastra configuration
│   │   ├── tools/            # Mastra tools
│   │   ├── workflows/        # Mastra workflows
│   │   ├── agents/           # Mastra agents
│   │   └── index.ts          # Mastra initialization
│   └── types/                 # TypeScript types
│       └── image.ts          # Image-related types
├── wrangler.toml              # Cloudflare Workers config
├── next.config.ts             # Next.js config
└── package.json               # Dependencies and scripts
```

## Key Features

### 1. Image Compression
- Automatic image optimization
- Reduces file size while maintaining quality
- Implemented in `src/mastra/tools/compress-image-tool.ts`

### 2. Cloud Upload
- Uploads to Cloudflare R2
- Generates public HTTPS URLs
- Custom domain support
- Implemented in `src/mastra/tools/upload-r2-tool.ts`

### 3. AI Description
- Uses OpenAI GPT-4o-mini with vision
- Multi-language support (EN, ZH, ES, FR, DE, JA)
- Generates keywords automatically
- Implemented in `src/mastra/tools/describe-image-tool.ts`

### 4. Local History
- Saves last 5 uploads in browser storage
- Quick access to previous results
- Can be disabled by user

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Deploy to Cloudflare Workers (production)
pnpm deploy:prod

# Deploy to development environment
pnpm deploy:dev

# Test locally with Wrangler
pnpm cf:dev

# Monitor logs
pnpm cf:tail
```

## Troubleshooting

### Issue: "AI_API_KEY environment variable is not set"

**Solution**: Make sure you've added your OpenAI API key to `.env` for local development, or set it as a secret for Cloudflare deployment:

```bash
wrangler secret put AI_API_KEY
```

### Issue: "R2_BUCKET binding not found"

**Solution**: Ensure you've created the R2 buckets in Cloudflare Dashboard and they're configured in `wrangler.toml`.

### Issue: Build fails with module resolution errors

**Solution**: Make sure all dependencies are installed:

```bash
pnpm install --frozen-lockfile
```

### Issue: Image upload timeout

**Solution**: For large images (>5MB), consider:
1. Compressing images on the client side first
2. Increasing the timeout in API route
3. Using Cloudflare Queues for async processing

## Next Steps

- Read the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Check [PRD_AI_IMAGES_AGENT.md](./PRD_AI_IMAGES_AGENT.md) for product requirements
- Review [TECH_SELECTION.md](./TECH_SELECTION.md) for technical details

## Support

For issues and questions:
- Check the documentation files in this repository
- Review Mastra documentation: https://mastra.ai
- Check Cloudflare Workers docs: https://developers.cloudflare.com/workers/

Happy coding! 🚀
