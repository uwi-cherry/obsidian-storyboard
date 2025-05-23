import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function CanvasContainer({ children }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-auto bg-secondary">
      {children}
    </div>
  );
}
