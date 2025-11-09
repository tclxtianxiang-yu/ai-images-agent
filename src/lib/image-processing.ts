/**
 * Image processing utilities
 * These functions handle compression, upload, and AI description generation
 */

/**
 * Compress image (placeholder - in production use sharp-wasm)
 */
export async function compressImage(imageData: string, fileName: string) {
  const originalSize = Math.ceil((imageData.length * 3) / 4);

  // In production, use sharp-wasm or similar for actual compression
  const compressedData = imageData;
  const compressedSize = originalSize;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

  console.log(`Compressed ${fileName}: ${originalSize} -> ${compressedSize} bytes`);

  return {
    compressedData,
    originalSize,
    compressedSize,
    compressionRatio,
  };
}

/**
 * Upload image to Cloudflare R2
 */
export async function uploadToR2(
  imageData: string,
  fileName: string,
  mimeType: string
): Promise<{ url: string; key: string; uploadedAt: string }> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    const mockUrl = `https://static.mikasa-ackerman.vip/dev/${Date.now()}-${fileName}`;
    console.log(`[DEV MODE] Mock upload to R2: ${fileName}`);
    return {
      url: mockUrl,
      key: `dev/${Date.now()}-${fileName}`,
      uploadedAt: new Date().toISOString(),
    };
  }

  const cfEnv = getCloudflareEnv();
  const R2_BUCKET = cfEnv?.R2_BUCKET;

  if (!R2_BUCKET) {
    throw new Error('R2_BUCKET binding not found');
  }

  const timestamp = Date.now();
  const key = `images/${timestamp}-${fileName}`;
  const buffer = Buffer.from(imageData, 'base64');

  await R2_BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  const url = `https://static.mikasa-ackerman.vip/${key}`;
  console.log(`Uploaded to R2: ${key}`);

  return {
    url,
    key,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Generate AI description for image
 */
export async function generateImageDescription(
  imageData: string,
  mimeType: string,
  language: 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' = 'en'
): Promise<{ description: string; keywords: string[]; confidence: number }> {
  const cfEnv = getCloudflareEnv();
  // In Edge Runtime, env vars may come from process.env or Workers bindings
  const apiKey = process.env.AI_API_KEY || cfEnv?.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY environment variable is not set. Please check your .env file or Cloudflare secrets.');
  }

  const imageUrl = `data:${mimeType};base64,${imageData}`;

  const languagePrompts: Record<string, string> = {
    en: 'Describe this image in detail. Include what you see, the style, colors, mood, and any notable elements. Also provide 5-10 relevant keywords.',
    zh: '详细描述这张图片。包括你看到的内容、风格、颜色、氛围以及任何值得注意的元素。同时提供5-10个相关关键词。',
    es: 'Describe esta imagen en detalle. Incluye lo que ves, el estilo, los colores, el ambiente y cualquier elemento notable. También proporciona de 5 a 10 palabras clave relevantes.',
    fr: 'Décrivez cette image en détail. Incluez ce que vous voyez, le style, les couleurs, l\'ambiance et tous les éléments notables. Fournissez également 5 à 10 mots-clés pertinents.',
    de: 'Beschreiben Sie dieses Bild im Detail. Fügen Sie hinzu, was Sie sehen, den Stil, die Farben, die Stimmung und alle bemerkenswerten Elemente. Geben Sie auch 5-10 relevante Schlüsselwörter an.',
    ja: 'この画像を詳しく説明してください。見えるもの、スタイル、色、雰囲気、注目すべき要素を含めてください。また、関連するキーワードを5〜10個提供してください。',
  };

  const prompt = languagePrompts[language] || languagePrompts.en;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const description = data.choices?.[0]?.message?.content || 'No description generated';

  const keywords = extractKeywords(description);
  const confidence = 0.85;

  console.log(`Generated description in ${language}: ${description.substring(0, 100)}...`);

  return {
    description,
    keywords,
    confidence,
  };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'this', 'that',
    'these', 'those'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  const keywords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return keywords;
}

function getCloudflareEnv<
  T extends Record<string, unknown> & {
    R2_BUCKET?: {
      put: (key: string, data: ArrayBuffer | ArrayBufferView, options?: unknown) => Promise<unknown>;
    };
    AI_API_KEY?: string;
  }
>(): T | null {
  try {
    const context = (globalThis as typeof globalThis & {
      [Symbol.for('__cloudflare-context__')]?: { env?: T };
    })[Symbol.for('__cloudflare-context__')];

    return context?.env ?? null;
  } catch {
    return null;
  }
}
