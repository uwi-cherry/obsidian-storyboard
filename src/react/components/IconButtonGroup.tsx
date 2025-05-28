import type { FC, MouseEvent } from 'react';
import MenuIconButton from './MenuIconButton';
import type { MenuOption } from '../../types/ui';

interface IconButton {
	icon: string;
      onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
	title?: string;
	disabled?: boolean;
	variant?: 'primary' | 'accent' | 'secondary' | 'danger';
	className?: string;
	menuOptions?: MenuOption[];
}

interface IconButtonGroupProps {
	buttons: IconButton[];
	className?: string;
	gap?: string;
	direction?: 'horizontal' | 'vertical';
}

const IconButtonGroup: FC<IconButtonGroupProps> = ({
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
			{buttons.map((button, index) => {
			if (button.menuOptions && button.menuOptions.length > 0) {
				return (
				<MenuIconButton
					key={index}
					icon={button.icon}
					title={button.title}
					options={button.menuOptions}
					className={button.className}
					disabled={button.disabled}
					variant={button.variant}
				/>
				);
			}
			
			return (
				<button
				key={index}
				className={`p-1 rounded cursor-pointer disabled:opacity-50 flex items-center justify-center ${getVariantClasses(button.variant)} ${button.className || ''}`}
				onClick={button.onClick}
				disabled={button.disabled}
				title={button.title}
				dangerouslySetInnerHTML={{ __html: button.icon }}
				/>
			);
			})}
		</div>
	);
};

export default IconButtonGroup; 
