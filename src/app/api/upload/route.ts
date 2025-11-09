import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ImageUploadSchema, ImageProcessingResponse } from '@/types/image';
import { mastra } from '@/mastra';

const AgentOutputSchema = z.object({
  url: z.string().describe('图片的完整访问地址'),
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
      throw new Error('Image agent not available');
    }

    const agentResult = await agent.generate(
      [
        {
          role: 'user',
          content: JSON.stringify({
            traceId,
            fileName,
            mimeType,
            fileSize,
            language,
            imageData,
          }),
        },
      ],
      {
        maxSteps: 8,
        structuredOutput: {
          schema: AgentOutputSchema,
          errorStrategy: 'strict',
        },
        toolChoice: 'required',
      },
    );

    const { object } = agentResult;

    // Build response
    const response: ImageProcessingResponse = {
      success: true,
      data: {
        url: object.url,
        key: object.key,
        description: object.description,
        keywords: object.keywords,
        confidence: object.confidence,
        compressionRatio: object.compressionRatio,
        originalSize: object.originalSize,
        compressedSize: object.compressedSize,
        uploadedAt: object.uploadedAt,
      },
      traceId,
    };

    console.log(`[${traceId}] Successfully processed image: ${object.url}`);

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
