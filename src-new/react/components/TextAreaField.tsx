import React, { forwardRef } from 'react';

interface TextAreaFieldProps {
  value?: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(({
  value,
  onChange,
  placeholder = '',
  className = '',
  onKeyDown,
}, ref) => {
  return (
    <textarea
      ref={ref}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`w-full border-none focus:border-none focus:outline-none focus:shadow-none shadow-none rounded-none bg-transparent p-0 text-text-normal placeholder-text-faint leading-tight resize-none field-sizing-content overflow-y-hidden [@supports_not(field-sizing:content)]:overflow-y-auto ${className}`}
    />
  );
});

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField; 
