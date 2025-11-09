'use client';

import { useState } from 'react';

interface ImageResultProps {
  url: string;
  description: string;
  keywords: string[];
  fileName: string;
  compressionRatio: number;
  confidence: number;
}

export function ImageResult({
  url,
  description,
  keywords,
  fileName,
  compressionRatio,
  confidence,
}: ImageResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Image Preview */}
      <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={fileName} className="w-full h-auto max-h-96 object-contain bg-zinc-50 dark:bg-zinc-900" />
      </div>

      {/* Description */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Description</h3>
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{description}</p>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Image URL with Copy Button */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Image URL</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-zinc-700 dark:text-zinc-300"
          />
          <button
            onClick={handleCopy}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Compression</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {compressionRatio.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">AI Confidence</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {(confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
