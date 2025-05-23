import { useCallback, RefObject } from 'react';

interface Options {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export default function useTextareaArrowNav(
  textareaRef: RefObject<HTMLTextAreaElement>,
  options: Options = {}
) {
  const { onArrowUp, onArrowDown } = options;

  return useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const { selectionStart, selectionEnd, value } = textarea;

      if (e.key === 'ArrowUp' && selectionStart === 0) {
        e.preventDefault();
        onArrowUp?.();
      } else if (e.key === 'ArrowDown' && selectionEnd === value.length) {
        e.preventDefault();
        onArrowDown?.();
      }
    },
    [textareaRef, onArrowUp, onArrowDown]
  );
} 