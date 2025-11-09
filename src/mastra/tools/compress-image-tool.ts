import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { compressImage } from '@/lib/image-processing';

export const compressImageTool = createTool({
  id: 'compress_image_tool',
  description: '对 Base64 图片执行无损压缩，返回压缩比与压缩后的数据字符串。',
  inputSchema: z.object({
    imageData: z.string().describe('Base64 编码的图片内容'),
    fileName: z.string().describe('原始文件名'),
    mimeType: z.string().describe('图片的 MIME 类型'),
  }),
  outputSchema: z.object({
    compressedData: z.string(),
    originalSize: z.number(),
    compressedSize: z.number(),
    compressionRatio: z.number(),
  }),
  execute: async ({ context }) => {
    return compressImage(context.imageData, context.fileName);
  },
});
