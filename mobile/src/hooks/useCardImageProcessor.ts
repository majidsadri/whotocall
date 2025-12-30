import { useState, useCallback } from 'react';
import { Image } from 'react-native';

interface UseCardImageProcessorReturn {
  processedUri: string | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  processImage: (uri: string) => Promise<string | null>;
  reset: () => void;
}

/**
 * Hook for processing scanned business card images.
 */
export function useCardImageProcessor(): UseCardImageProcessorReturn {
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (uri: string): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Validate image exists
      setProgress(50);
      await new Promise<void>((resolve, reject) => {
        Image.getSize(
          uri,
          () => resolve(),
          () => reject(new Error('Failed to load image'))
        );
      });

      setProgress(100);
      setProcessedUri(uri);
      return uri;
    } catch (err) {
      console.error('Image processing error:', err);
      const message = err instanceof Error ? err.message : 'Failed to process image';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProcessedUri(null);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    processedUri,
    isProcessing,
    progress,
    error,
    processImage,
    reset,
  };
}
