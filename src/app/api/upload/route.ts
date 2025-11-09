import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ImageUploadSchema, ImageProcessingResponse } from '@/types/image';
import { mastra } from '@/mastra';

const AgentOutputSchema = z.object({
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

    const agent = mastra.getAgent('imageAgent');
    if (!agent) {
      throw new Error('Image agent is not registered.');
    }

    const payload = {
      imageData,
      fileName,
      mimeType,
      fileSize,
      language,
    };

    const agentResult = await agent.generate(
      [
        {
          role: 'user',
          content: `调用 image_workflow_tool，并使用以下 JSON 作为参数：${JSON.stringify(
            payload,
          )}。完成后只返回工具输出的 JSON。`,
        },
      ],
      {
        toolChoice: 'required',
        structuredOutput: {
          schema: AgentOutputSchema,
          errorStrategy: 'strict',
        },
        runId: traceId,
      },
    );

    const { object: output } = agentResult;

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
