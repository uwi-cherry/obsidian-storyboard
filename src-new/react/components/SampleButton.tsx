// Simple Button Component Sample for demonstration purposes
// シンプルなボタンコンポーネントのサンプルです

import React from 'react';

interface SampleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const SampleButton: React.FC<SampleButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default SampleButton; 