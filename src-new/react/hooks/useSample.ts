// Sample Custom Hook for demonstration purposes  
// このファイルはサンプル用のカスタムフックです

import { useState, useCallback } from 'react';

interface UseSampleCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
  incrementBy: (value: number) => void;
}

/**
 * Sample counter hook with basic increment/decrement functionality
 * 基本的なカウンター機能を持つサンプルフック
 */
export const useSampleCounter = (initialValue: number = 0): UseSampleCounterReturn => {
  const [count, setCount] = useState<number>(initialValue);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const incrementBy = useCallback((value: number) => {
    setCount(prev => prev + value);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
    incrementBy
  };
};

export default useSampleCounter; 