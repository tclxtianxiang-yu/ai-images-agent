import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { ImageUploadSchema } from '@/types/image';
import { compressImageTool } from '../tools/compress-image-tool';
import { uploadR2Tool } from '../tools/upload-r2-tool';
import { describeImageTool } from '../tools/describe-image-tool';

const workflowInputSchema = ImageUploadSchema;

const compressStepOutputSchema = z.object({
  fileName: z.string(),
  mimeType: workflowInputSchema.shape.mimeType,
  language: workflowInputSchema.shape.language,
  fileSize: z.number(),
  compressedData: z.string(),
  compressionRatio: z.number(),
  originalSize: z.number(),
  compressedSize: z.number(),
});

const uploadStepOutputSchema = compressStepOutputSchema.extend({
  url: z.string(),
  key: z.string(),
  uploadedAt: z.string(),
});

const finalOutputSchema = z.object({
  url: z.string(),
  key: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  confidence: z.number(),
  compressionRatio: z.number(),
  originalSize: z.number(),
  compressedSize: z.number(),
  uploadedAt: z.string(),
});

const ensureToolExecute = <T extends (...args: any[]) => Promise<any>>(toolName: string, execute?: T) => {
  if (!execute) {
    throw new Error(`Tool "${toolName}" does not define an execute handler.`);
  }
  return execute;
};

const compressImageStep = createStep({
  id: 'compress-image',
  description: '使用无损压缩算法处理原始图片。',
  inputSchema: workflowInputSchema,
  outputSchema: compressStepOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const exec = ensureToolExecute('compressImageTool', compressImageTool.execute);
    const compression = await exec(
      {
        context: {
          imageData: inputData.imageData,
          fileName: inputData.fileName,
          mimeType: inputData.mimeType,
        },
        mastra,
      } as any,
    );

    return {
      fileName: inputData.fileName,
      mimeType: inputData.mimeType,
      language: inputData.language,
      fileSize: inputData.fileSize,
      compressedData: compression.compressedData,
      compressionRatio: compression.compressionRatio,
      originalSize: compression.originalSize,
      compressedSize: compression.compressedSize,
    };
  },
});

const uploadImageStep = createStep({
  id: 'upload-r2',
  description: '将压缩后的图片上传到 Cloudflare R2。',
  inputSchema: compressStepOutputSchema,
  outputSchema: uploadStepOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const exec = ensureToolExecute('uploadR2Tool', uploadR2Tool.execute);
    const uploadResult = await exec(
      {
        context: {
          imageData: inputData.compressedData,
          fileName: inputData.fileName,
          mimeType: inputData.mimeType,
        },
        mastra,
      } as any,
    );

    return {
      ...inputData,
      url: uploadResult.url,
      key: uploadResult.key,
      uploadedAt: uploadResult.uploadedAt,
    };
  },
});

const describeImageStep = createStep({
  id: 'describe-image',
  description: '调用多模态模型生成图片描述与关键词。',
  inputSchema: uploadStepOutputSchema,
  outputSchema: finalOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const exec = ensureToolExecute('describeImageTool', describeImageTool.execute);
    const description = await exec(
      {
        context: {
          imageData: inputData.compressedData,
          mimeType: inputData.mimeType,
          language: inputData.language,
        },
        mastra,
      } as any,
    );

    return {
      url: inputData.url,
      key: inputData.key,
      compressionRatio: inputData.compressionRatio,
      originalSize: inputData.originalSize,
      compressedSize: inputData.compressedSize,
      uploadedAt: inputData.uploadedAt,
      description: description.description,
      keywords: description.keywords,
      confidence: description.confidence,
    };
  },
});

export const imageWorkflow = createWorkflow({
  id: 'image-workflow',
  description: '压缩图片、上传 R2 并生成 AI 描述的标准流程。',
  inputSchema: workflowInputSchema,
  outputSchema: finalOutputSchema,
})
  .then(compressImageStep)
  .then(uploadImageStep)
  .then(describeImageStep)
  .commit();
