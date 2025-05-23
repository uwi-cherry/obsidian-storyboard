// Simple Context Sample for demonstration purposes
// シンプルなContextのサンプルです

import React, { createContext, useContext } from 'react';

// サンプルのContext値の型定義
interface SampleContextValue {
  message: string;
  count: number;
}

// Contextの作成（デフォルト値付き）
const SampleContext = createContext<SampleContextValue>({
  message: 'Hello, Context!',
  count: 0
});

// Contextの値を取得するシンプルなフック
export const useSampleContext = () => {
  return useContext(SampleContext);
};

export default SampleContext; 