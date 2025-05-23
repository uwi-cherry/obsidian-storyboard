import React from 'react';

interface PreviewCellProps {
  prompt?: string;
  onPromptChange: (newVal: string) => void;
}

const PreviewCell: React.FC<PreviewCellProps> = ({
  prompt,
  onPromptChange,
}) => {
  return (
    <textarea
      value={prompt || ''}
      onChange={e => onPromptChange(e.target.value)}
      placeholder="prompt"
      className="w-full border-none focus:border-none focus:outline-none focus:shadow-none shadow-none rounded-none bg-transparent p-0 text-text-normal placeholder-text-faint leading-tight resize-none field-sizing-content overflow-y-hidden [@supports_not(field-sizing:content)]:overflow-y-auto"
    />
  );
};

export default PreviewCell;
