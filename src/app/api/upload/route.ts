import { NextRequest, NextResponse } from 'next/server';
import { ImageUploadSchema, ImageProcessingResponse } from '@/types/image';
import { compressImage, uploadToR2, generateImageDescription } from '@/lib/image-processing';

// Note: OpenNext automatically handles Cloudflare Workers deployment
// No need to explicitly set runtime = 'edge'

/**
 * POST /api/upload
 * Handles image upload and processing
 */
export async function POST(request: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = ImageUploadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${validationResult.error.message}`,
          traceId,
        } satisfies ImageProcessingResponse,
        { status: 400 }
      );
    }

    const { imageData, fileName, mimeType, fileSize, language } = validationResult.data;

    console.log(`[${traceId}] Processing image: ${fileName} (${fileSize} bytes, ${mimeType})`);

    // Step 1: Compress image
    const compressionResult = await compressImage(imageData, fileName);

    // Step 2: Upload to R2
    const uploadResult = await uploadToR2(
      compressionResult.compressedData,
      fileName,
      mimeType
    );

    // Step 3: Generate AI description
    const descriptionResult = await generateImageDescription(
      compressionResult.compressedData,
      mimeType,
      language
    );

    // Build response
    const response: ImageProcessingResponse = {
      success: true,
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        description: descriptionResult.description,
        keywords: descriptionResult.keywords,
        confidence: descriptionResult.confidence,
        compressionRatio: compressionResult.compressionRatio,
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        uploadedAt: uploadResult.uploadedAt,
      },
      traceId,
    };

    console.log(`[${traceId}] Successfully processed image: ${uploadResult.url}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(`[${traceId}] Image processing failed:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        traceId,
      } satisfies ImageProcessingResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'AI Images Agent',
    endpoints: {
      upload: 'POST /api/upload',
    },
  });
}
