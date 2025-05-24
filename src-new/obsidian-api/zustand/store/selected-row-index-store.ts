import { create } from 'zustand';

interface SelectedRowIndexState {
  selectedRowIndex: number | null;
  setSelectedRowIndex: (index: number | null) => void;
  clearSelectedRowIndex: () => void;
}

export const useSelectedRowIndexStore = create<SelectedRowIndexState>((set) => ({
  selectedRowIndex: null,
  setSelectedRowIndex: (index) => set({ selectedRowIndex: index }),
  clearSelectedRowIndex: () => set({ selectedRowIndex: null }),
})); 