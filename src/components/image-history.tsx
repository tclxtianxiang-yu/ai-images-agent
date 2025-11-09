'use client';

import { useState } from 'react';
import { ImageHistoryItem } from '@/types/image';

const HISTORY_KEY = 'ai-images-history';
const MAX_HISTORY_ITEMS = 5;

interface ImageHistoryProps {
  onSelect?: (item: ImageHistoryItem) => void;
}

export function ImageHistory({ onSelect }: ImageHistoryProps) {
  const [history, setHistory] = useState<ImageHistoryItem[]>(() => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored) as ImageHistoryItem[];
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
    return [];
  });
  const [isEnabled, setIsEnabled] = useState(true);

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const toggleHistory = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    if (!newEnabled) {
      clearHistory();
    }
  };

  if (!isEnabled || history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {isEnabled ? 'No upload history yet' : 'History is disabled'}
        </p>
        <button
          onClick={toggleHistory}
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isEnabled ? 'Disable History' : 'Enable History'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent Uploads</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleHistory}
            className="text-sm text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Disable
          </button>
          <button
            onClick={clearHistory}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect?.(item)}
            className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
          >
            {item.thumbnailData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnailData}
                alt={item.fileName}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {item.fileName}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {item.description.substring(0, 100)}...
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                {new Date(item.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Utility function to add an item to history
 */
export function addToHistory(item: Omit<ImageHistoryItem, 'id'>): void {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const history: ImageHistoryItem[] = stored ? JSON.parse(stored) : [];

    const newItem: ImageHistoryItem = {
      ...item,
      id: Date.now().toString(),
    };

    // Add to beginning and limit size
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}
