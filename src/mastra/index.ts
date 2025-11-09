import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

export const mastra = new Mastra({
  workflows: {},
  agents: {},
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: process.env.MASTRA_DB_URL || ':memory:',
  }),
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
