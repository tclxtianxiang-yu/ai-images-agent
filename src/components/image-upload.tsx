'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadStage } from '@/types/image';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  stage: UploadStage;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({ onUpload, isUploading, stage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '文件类型不支持，请上传 PNG、JPEG 或 WebP 图片。';
    }
    if (file.size > MAX_SIZE) {
      return '文件过大，单张图片不能超过 10MB。';
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await onUpload(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStageMessage = () => {
    switch (stage) {
      case UploadStage.VALIDATING:
        return '正在校验图片...';
      case UploadStage.COMPRESSING:
        return '正在无损压缩图片...';
      case UploadStage.UPLOADING:
        return '正在上传到云端...';
      case UploadStage.DESCRIBING:
        return 'AI 正在生成中文描述...';
      case UploadStage.COMPLETED:
        return '处理完成！';
      case UploadStage.FAILED:
        return '处理失败，请重试';
      default:
        return '拖拽图片到此处，或点击选择图片';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-4">
          {/* Upload Icon */}
          <svg
            className={`w-16 h-16 ${
              isUploading ? 'text-blue-500 animate-pulse' : 'text-zinc-400 dark:text-zinc-600'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {/* Status Message */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {getStageMessage()}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              支持 PNG/JPEG/WebP，单张不超过 10MB
            </p>
          </div>

          {/* Progress indicator */}
          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
