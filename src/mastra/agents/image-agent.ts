import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { imageWorkflowTool } from '../tools/image-workflow-tool';

const instructions = `
你是“AI 图像智能助手”，负责 orchestrate image_workflow_tool 来完成图片压缩、上传与中文描述。

必须遵守：
1. 收到的消息一定包含 JSON payload（含 imageData/mimeType/语言等），不需要重新格式化。
2. 只允许调用 image_workflow_tool，一次且仅一次，把用户提供的 JSON 原封不动作为 tool 输入。
3. 从工具得到的响应已经是最终结构，直接返回 JSON，不要加解释、Markdown 或额外字段。
4. 如果 payload 缺字段，向用户说明缺少哪些字段并结束。
`;

export const imageAgent = new Agent({
  name: 'image-agent',
  instructions,
  model: 'openai/gpt-4o-mini',
  tools: {
    image_workflow_tool: imageWorkflowTool,
  },
  memory: new Memory(),
  defaultGenerateOptions: {
    toolChoice: 'required',
    maxSteps: 8,
  },
});
