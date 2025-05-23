import React from 'react';

interface IconButton {
  icon: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger';
  className?: string;
}

interface IconButtonGroupProps {
  buttons: IconButton[];
  className?: string;
  gap?: string;
  direction?: 'horizontal' | 'vertical';
}

const IconButtonGroup: React.FC<IconButtonGroupProps> = ({
  buttons,
  className = '',
  gap = 'gap-2',
  direction = 'horizontal',
}) => {
  const getVariantClasses = (variant: IconButton['variant'] = 'primary') => {
    switch (variant) {
      case 'accent':
        return 'bg-accent text-on-accent hover:bg-accent-hover';
      case 'secondary':
        return 'bg-secondary border border-modifier-border text-text-normal hover:bg-modifier-hover';
      case 'danger':
        return 'bg-error text-on-error hover:bg-error-hover';
      case 'primary':
      default:
        return 'bg-primary border border-modifier-border text-text-normal hover:bg-modifier-hover';
    }
  };

  const directionClass = direction === 'vertical' ? 'flex-col' : '';

  return (
    <div className={`flex ${directionClass} ${gap} ${className}`}>
      {buttons.map((button, index) => (
        <button
          key={index}
          className={`p-1 rounded cursor-pointer disabled:opacity-50 flex items-center justify-center ${getVariantClasses(button.variant)} ${button.className || ''}`}
          onClick={button.onClick}
          disabled={button.disabled}
          title={button.title}
          dangerouslySetInnerHTML={{ __html: button.icon }}
        />
      ))}
    </div>
  );
};

export default IconButtonGroup; 