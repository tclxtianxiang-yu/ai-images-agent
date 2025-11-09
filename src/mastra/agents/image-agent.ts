import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { compressImageTool } from '../tools/compress-image-tool';
import { uploadR2Tool } from '../tools/upload-r2-tool';
import { describeImageTool } from '../tools/describe-image-tool';

const instructions = `
你是 “AI 图像智能助手” 的核心执行体，负责通过工具链对图片进行压缩、上传和描述。
执行规则：
1. 严格按照顺序调用以下三个工具：
   a. compress_image_tool —— 将原始 base64 图片压缩，获取压缩结果。
   b. upload_r2_tool —— 使用压缩后的数据上传到 Cloudflare R2，获取 URL 与 key。
   c. describe_image_tool —— 使用同一份压缩数据生成中文描述与关键词。
2. 绝不能凭空编造返回值，所有结果必须来自工具输出。
3. 最终回答必须为 JSON，对象结构与调用方提供的 schema 完全一致，且使用 UTF-8 中文描述。
4. 不要输出多余的解释或 Markdown，仅输出 JSON。
`;

export const imageAgent = new Agent({
  name: 'image-agent',
  instructions,
  model: 'openai/gpt-4o-mini',
  tools: {
    compress_image_tool: compressImageTool,
    upload_r2_tool: uploadR2Tool,
    describe_image_tool: describeImageTool,
  },
  memory: new Memory(),
  defaultGenerateOptions: {
    toolChoice: 'required',
    maxSteps: 8,
  },
});
