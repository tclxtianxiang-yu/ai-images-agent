import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { uploadToR2 } from '@/lib/image-processing';

export const uploadR2Tool = createTool({
  id: 'upload_r2_tool',
  description: '将压缩后的 Base64 图片上传到 Cloudflare R2，并返回公共访问链接。',
  inputSchema: z.object({
    imageData: z.string().describe('压缩后的 Base64 图片'),
    fileName: z.string(),
    mimeType: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    key: z.string(),
    uploadedAt: z.string(),
  }),
  execute: async ({ context }) => {
    return uploadToR2(context.imageData, context.fileName, context.mimeType);
  },
});
