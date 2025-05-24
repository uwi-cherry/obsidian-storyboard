import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StoryboardFrame } from '../../types/storyboard';

interface StoryboardContextValue {
  selectedRowIndex: number | null;
  selectedFrame: StoryboardFrame | null;
  setSelectedRow: (index: number | null, frame: StoryboardFrame | null) => void;
}

const StoryboardContext = createContext<StoryboardContextValue | null>(null);

interface StoryboardProviderProps {
  children: ReactNode;
}

export function StoryboardProvider({ children }: StoryboardProviderProps) {
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<StoryboardFrame | null>(null);

  const setSelectedRow = (index: number | null, frame: StoryboardFrame | null) => {
    setSelectedRowIndex(index);
    setSelectedFrame(frame);
  };

  const value: StoryboardContextValue = {
    selectedRowIndex,
    selectedFrame,
    setSelectedRow,
  };

  return (
    <StoryboardContext.Provider value={value}>
      {children}
    </StoryboardContext.Provider>
  );
}

export function useStoryboardContext(): StoryboardContextValue {
  const context = useContext(StoryboardContext);
  if (!context) {
    throw new Error('useStoryboardContext must be used within a StoryboardProvider');
  }
  return context;
} 