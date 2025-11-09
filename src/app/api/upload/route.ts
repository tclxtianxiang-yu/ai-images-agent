import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ImageUploadSchema, ImageProcessingResponse } from '@/types/image';
import { mastra } from '@/mastra';

const workflowInputSchema = ImageUploadSchema;

async function runWorkflowDirect(input: z.infer<typeof workflowInputSchema>) {
  const workflow = mastra.getWorkflow('imageWorkflow');
  const run = await workflow.createRunAsync({
    resourceId: input.fileName,
  });
  const result = await run.start({
    inputData: input,
  });

  if (result.status !== 'success') {
    throw new Error(result.status === 'failed' ? result.error?.message ?? 'Workflow failed' : 'Workflow suspended');
  }

  return result.result;
}

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

    const payload = {
      imageData,
      fileName,
      mimeType,
      fileSize,
      language,
    };

    const output = await runWorkflowDirect(payload);

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

    console.log(`[${traceId}] Successfully processed image via agent: ${output.url}`);

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
