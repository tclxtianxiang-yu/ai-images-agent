import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { imageWorkflow } from './workflows/image-workflow';
import { imageAgent } from './agents/image-agent';

export const mastra = new Mastra({
  workflows: { imageWorkflow },
  agents: { imageAgent },
  logger: new PinoLogger({
    name: 'AI-Images-Agent',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
