import type { ReactNode, FC } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  maxHeight?: string;
  className?: string;
}

const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'w-[400px]',
  maxHeight = 'max-h-[80vh]',
  className = '',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className={`bg-primary rounded shadow-lg p-6 ${width} ${maxHeight} overflow-auto ${className}`}>
        {title && (
          <h2 className="text-lg font-bold mb-2">{title}</h2>
        )}
        <div className="mb-4">
          {children}
        </div>
        {footer && (
          <div className="flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal; 
