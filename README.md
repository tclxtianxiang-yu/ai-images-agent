# AI Images Agent

An intelligent image processing platform powered by Mastra and Cloudflare. Upload images to automatically get compression, cloud hosting on R2, and AI-generated descriptions.

![AI Images Agent](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Mastra](https://img.shields.io/badge/Mastra-0.24-blue)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)

## Features

- **Smart Upload**: Drag-and-drop or click to upload images (PNG, JPEG, WebP up to 10MB)
- **Automatic Compression**: Optimizes images while maintaining quality
- **Cloud Storage**: Uploads to Cloudflare R2 with public HTTPS URLs
- **AI Descriptions**: Generates detailed descriptions using GPT-4o-mini vision
- **Multi-language**: Supports EN, ZH, ES, FR, DE, JA
- **Upload History**: Tracks your last 5 uploads locally
- **Edge Deployment**: Runs on Cloudflare Workers for global low-latency access

## Architecture

```
User → Next.js UI → API Route → Mastra Workflow → Tools
                                    ├─ Compress Image
                                    ├─ Upload to R2
                                    └─ Generate AI Description
```

### Technology Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Agent Framework**: Mastra (workflows, agents, tools)
- **AI Model**: OpenAI GPT-4o-mini
- **Storage**: Cloudflare R2
- **Runtime**: Cloudflare Workers (Edge)
- **Language**: TypeScript 5

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 8
- Cloudflare account
- OpenAI API key

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Add your OpenAI API key to .env
# AI_API_KEY=sk-your-key-here
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### Deployment

See [QUICKSTART.md](./QUICKSTART.md) for detailed deployment instructions.

```bash
# Build
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy:prod
```

## Project Structure

```
ai-images-agent/
├── src/
│   ├── app/
│   │   ├── api/upload/route.ts    # Image upload endpoint
│   │   ├── page.tsx               # Main UI page
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── image-upload.tsx       # Upload component
│   │   ├── image-result.tsx       # Result display
│   │   └── image-history.tsx      # History management
│   ├── mastra/
│   │   ├── tools/                 # Image processing tools
│   │   ├── workflows/             # Processing workflow
│   │   ├── agents/                # Image agent
│   │   └── index.ts               # Mastra config
│   └── types/
│       └── image.ts               # Type definitions
├── wrangler.toml                  # Cloudflare config
├── next.config.ts                 # Next.js config
└── package.json                   # Dependencies
```

## How It Works

1. **User uploads an image** via drag-and-drop or file picker
2. **Frontend validates** file type and size
3. **API endpoint receives** the image and triggers Mastra workflow
4. **Workflow executes three steps**:
   - Compress: Optimizes the image
   - Upload: Stores in Cloudflare R2
   - Describe: Generates AI description with keywords
5. **Results returned** to user with URL, description, and metadata
6. **History saved** locally for quick access

## Mastra Workflow

The image processing workflow (`src/mastra/workflows/image-processing-workflow.ts`) orchestrates three tools:

### 1. Compress Image Tool
- Reduces file size while maintaining quality
- Prepares images for efficient storage and delivery

### 2. Upload R2 Tool
- Uploads compressed images to Cloudflare R2
- Generates public HTTPS URLs via custom domain
- Custom domain: `https://static.mikasa-ackerman.vip`

### 3. Describe Image Tool
- Uses OpenAI GPT-4o-mini with vision capabilities
- Generates detailed natural language descriptions
- Extracts relevant keywords
- Supports multiple languages

## Configuration

### Environment Variables

```bash
# Required
AI_API_KEY=sk-xxx              # OpenAI API key

# Optional
MASTRA_DB_URL=:memory:         # Database URL (default: in-memory)
R2_BUCKET_NAME=ai-images       # R2 bucket name
NODE_ENV=development           # Environment
```

### Wrangler Configuration

Edit `wrangler.toml` to configure:
- Account ID
- R2 bucket bindings
- Custom domains
- Environment variables

## API Endpoints

### POST /api/upload

Upload and process an image.

**Request:**
```json
{
  "imageData": "base64-encoded-image",
  "fileName": "example.png",
  "mimeType": "image/png",
  "fileSize": 1048576,
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://static.mikasa-ackerman.vip/images/...",
    "key": "images/timestamp-filename.png",
    "description": "AI-generated description...",
    "keywords": ["keyword1", "keyword2"],
    "confidence": 0.85,
    "compressionRatio": 15.2,
    "originalSize": 1048576,
    "compressedSize": 889651,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  },
  "traceId": "uuid"
}
```

### GET /api/upload

Health check endpoint.

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Getting started guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [PRD_AI_IMAGES_AGENT.md](./PRD_AI_IMAGES_AGENT.md) - Product requirements
- [TECH_SELECTION.md](./TECH_SELECTION.md) - Technical decisions
- [PROJECT.md](./PROJECT.md) - Project overview

## Performance

- **Upload validation**: < 100ms
- **Image compression**: ~ 1-2s
- **R2 upload**: ~ 1-2s
- **AI description**: ~ 3-5s
- **Total processing time**: ~ 5-10s (target: < 30s)

## Security

- File type validation (PNG, JPEG, WebP only)
- Size limits (max 10MB)
- MIME type verification
- Secure API key handling via Wrangler secrets
- No direct client access to R2 credentials

## Roadmap

- [ ] Batch upload support
- [ ] Image resizing options
- [ ] NSFW content detection
- [ ] Custom compression settings
- [ ] Export descriptions in multiple formats
- [ ] Integration with more AI models

## Contributing

This is a private project. For issues or suggestions, please contact the maintainer.

## License

Private - All rights reserved.

## Credits

Built with:
- [Next.js](https://nextjs.org)
- [Mastra](https://mastra.ai)
- [Cloudflare Workers](https://workers.cloudflare.com)
- [Cloudflare R2](https://www.cloudflare.com/products/r2/)
- [OpenAI](https://openai.com)

---

For detailed setup and deployment instructions, see [QUICKSTART.md](./QUICKSTART.md).
