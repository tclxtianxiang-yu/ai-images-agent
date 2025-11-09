import { NextRequest, NextResponse } from 'next/server';
import { ImageUploadSchema, ImageProcessingResponse } from '@/types/image';
import { mastra } from '@/mastra';

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

    const workflow = mastra.getWorkflow('imageWorkflow');
    const run = await workflow.createRunAsync({ resourceId: traceId });
    const workflowResult = await run.start({
      inputData: {
        imageData,
        fileName,
        mimeType,
        fileSize,
        language,
      },
    });

    if (workflowResult.status !== 'success') {
      const message =
        workflowResult.status === 'failed'
          ? workflowResult.error?.message ?? 'Workflow execution failed'
          : 'Workflow did not complete successfully';
      throw new Error(message);
    }

    const output = workflowResult.result;

    // Build response
    const response: ImageProcessingResponse = {
      success: true,
      data: {
        url: output.url,
        key: output.key,
        description: output.description,
        keywords: output.keywords,
        confidence: output.confidence,
        compressionRatio: output.compressionRatio,
        originalSize: output.originalSize,
        compressedSize: output.compressedSize,
        uploadedAt: output.uploadedAt,
      },
      traceId,
    };

    console.log(`[${traceId}] Successfully processed image: ${output.url}`);

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
