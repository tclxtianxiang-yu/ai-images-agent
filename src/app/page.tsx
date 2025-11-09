'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { ImageResult } from '@/components/image-result';
import { ImageHistory, addToHistory } from '@/components/image-history';
import { UploadStage, ImageProcessingResponse } from '@/types/image';

interface ProcessedImage {
  url: string;
  description: string;
  keywords: string[];
  fileName: string;
  compressionRatio: number;
  confidence: number;
}

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [stage, setStage] = useState<UploadStage>(UploadStage.IDLE);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setResult(null);
    setStage(UploadStage.VALIDATING);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      setStage(UploadStage.COMPRESSING);

      setStage(UploadStage.UPLOADING);
      // Call API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          language: 'zh',
        }),
      });

      setStage(UploadStage.DESCRIBING);
      const data: ImageProcessingResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Upload failed');
      }

      setStage(UploadStage.COMPLETED);

      const processedImage: ProcessedImage = {
        url: data.data.url,
        description: data.data.description,
        keywords: data.data.keywords,
        fileName: file.name,
        compressionRatio: data.data.compressionRatio,
        confidence: data.data.confidence,
      };

      setResult(processedImage);

      // Add to history
      addToHistory({
        fileName: file.name,
        url: data.data.url,
        description: data.data.description,
        keywords: data.data.keywords,
        uploadedAt: data.data.uploadedAt,
        thumbnailData: data.data.url,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '上传过程中出现问题，请稍后重试');
      setStage(UploadStage.FAILED);
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            AI 图像智能助手
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            上传任意图片，即可自动压缩、上传至云端，并生成中文 AI 描述
          </p>
        </header>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            <ImageUpload onUpload={handleUpload} isUploading={isUploading} stage={stage} />

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  上传失败
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setStage(UploadStage.IDLE);
                  }}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  重新上传
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Results or History */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            {result ? (
              <ImageResult {...result} />
            ) : (
              <ImageHistory onSelect={(item) => {
                setResult({
                  url: item.url,
                  description: item.description,
                  keywords: item.keywords,
                  fileName: item.fileName,
                  compressionRatio: 0,
                  confidence: 0.85,
                });
              }} />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            驱动自{' '}
            <a
              href="https://mastra.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Mastra
            </a>
            {' '}与{' '}
            <a
              href="https://www.cloudflare.com/products/r2/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Cloudflare R2
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
