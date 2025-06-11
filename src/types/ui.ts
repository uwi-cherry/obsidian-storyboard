export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MenuOption {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

export interface Attachment {
  type: 'image' | 'mask' | 'reference';
  url: string;
  data?: string;
  enabled?: boolean;
}
