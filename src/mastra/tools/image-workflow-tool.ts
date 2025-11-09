import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ImageUploadSchema } from '@/types/image';

const workflowOutputSchema = z.object({
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

export const imageWorkflowTool = createTool({
  id: 'image_workflow_tool',
  description: 'Runs the full image processing workflow (compress → upload → describe).',
  inputSchema: ImageUploadSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ context, mastra }) => {
    const workflow = mastra?.getWorkflow('imageWorkflow');
    if (!workflow) {
      throw new Error('imageWorkflow is not registered in Mastra instance.');
    }

    const run = await workflow.createRunAsync({
      resourceId: context.fileName,
    });
    const result = await run.start({
      inputData: context,
    });

    if (result.status !== 'success') {
      const reason =
        result.status === 'failed'
          ? result.error?.message ?? 'Workflow failed'
          : 'Workflow suspended';
      throw new Error(reason);
    }

    return result.result;
  },
});
