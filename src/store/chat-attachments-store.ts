import { create } from 'zustand';
import type { Attachment } from '../types/ui';

interface ChatAttachmentsState {
  attachments: Attachment[];
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (index: number) => void;
  toggleAttachment: (index: number) => void;
  clearAttachments: () => void;
}

export const useChatAttachmentsStore = create<ChatAttachmentsState>((set, get) => ({
  attachments: [],
  
  addAttachment: (attachment: Attachment) => {
    set((state) => ({
      attachments: [...state.attachments, attachment]
    }));
  },
  
  removeAttachment: (index: number) => {
    set((state) => {
      const newAttachments = [...state.attachments];
      const [removed] = newAttachments.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return { attachments: newAttachments };
    });
  },

  toggleAttachment: (index: number) => {
    set((state) => {
      const newAttachments = [...state.attachments];
      if (newAttachments[index]) {
        newAttachments[index] = {
          ...newAttachments[index],
          enabled: !newAttachments[index].enabled
        };
      }
      return { attachments: newAttachments };
    });
  },
  
  clearAttachments: () => {
    set((state) => {
      state.attachments.forEach(att => URL.revokeObjectURL(att.url));
      return { attachments: [] };
    });
  }
}));