import React, { useState, useRef, useEffect } from 'react';

interface MenuOption {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface MenuIconButtonProps {
  icon: string;
  title?: string;
  options: MenuOption[];
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger';
}

const MenuIconButton: React.FC<MenuIconButtonProps> = ({
  icon,
  title,
  options,
  className = '',
  disabled = false,
  variant = 'secondary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getVariantClasses = (variant: MenuIconButtonProps['variant'] = 'secondary') => {
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

  const getMenuOptionClasses = (optionVariant: MenuOption['variant'] = 'default') => {
    return 'text-gray-700 hover:bg-gray-100';
  };

  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  
  const handleOptionClick = (option: MenuOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!option.disabled) {
      option.onClick();
      setIsOpen(false);
    }
  };

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={`p-1 rounded cursor-pointer disabled:opacity-50 flex items-center justify-center ${getVariantClasses(variant)} ${className}`}
        onClick={toggleMenu}
        disabled={disabled}
        title={title}
      >
        <span dangerouslySetInnerHTML={{ __html: icon }} />
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-xl py-2 z-[9999] whitespace-nowrap"
        >
          {options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors ${getMenuOptionClasses(option.variant)}`}
              onClick={(e) => handleOptionClick(option, e)}
              disabled={option.disabled}
            >
              {option.icon && (
                <span 
                  className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                  dangerouslySetInnerHTML={{ __html: option.icon }} 
                />
              )}
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuIconButton; 