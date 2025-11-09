import { z } from 'zod';

/**
 * Validation schema for image uploads
 */
export const ImageUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
  imageData: z.string(), // Base64 encoded
  language: z.enum(['en', 'zh', 'es', 'fr', 'de', 'ja']).default('zh'),
});

export type ImageUpload = z.infer<typeof ImageUploadSchema>;

/**
 * Response from image processing
 */
export const ImageProcessingResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      url: z.string(),
      key: z.string(),
      description: z.string(),
      keywords: z.array(z.string()),
      confidence: z.number(),
      compressionRatio: z.number(),
      originalSize: z.number(),
      compressedSize: z.number(),
      uploadedAt: z.string(),
    })
    .optional(),
  error: z.string().optional(),
  traceId: z.string().optional(),
});

export type ImageProcessingResponse = z.infer<typeof ImageProcessingResponseSchema>;

/**
 * Upload progress stages
 */
export enum UploadStage {
  IDLE = 'idle',
  VALIDATING = 'validating',
  COMPRESSING = 'compressing',
  UPLOADING = 'uploading',
  DESCRIBING = 'describing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Upload status for frontend
 */
export interface UploadStatus {
  stage: UploadStage;
  progress: number; // 0-100
  message: string;
}

/**
 * History item for local storage
 */
export interface ImageHistoryItem {
  id: string;
  fileName: string;
  url: string;
  description: string;
  keywords: string[];
  uploadedAt: string;
  thumbnailData?: string; // Data URL 或远程图片地址，用于历史记录缩略图
}
