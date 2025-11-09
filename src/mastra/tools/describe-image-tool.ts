import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateImageDescription } from '@/lib/image-processing';

export const describeImageTool = createTool({
  id: 'describe_image_tool',
  description: '调用多模态模型分析图片内容，输出中文描述、关键词与置信度。',
  inputSchema: z.object({
    imageData: z.string().describe('压缩后的 Base64 图片'),
    mimeType: z.string(),
    language: z.enum(['en', 'zh', 'es', 'fr', 'de', 'ja']).default('zh'),
  }),
  outputSchema: z.object({
    description: z.string(),
    keywords: z.array(z.string()),
    confidence: z.number(),
  }),
  execute: async ({ context }) => {
    const { imageData, mimeType, language } = context;
    return generateImageDescription(imageData, mimeType, language);
  },
});
