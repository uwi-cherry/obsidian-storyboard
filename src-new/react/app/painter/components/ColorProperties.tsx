import React, { useState, useEffect } from 'react';
import { LayoutDirection } from '../../../../obsidian-api/zustand/storage/painter-layout-store';
import ColorWheel from './ColorWheel';
import { hexToHsl, hslToHex } from '../../../utils/color';

interface ColorPropertiesProps {
  color: string;
  setColor: (color: string) => void;
  layoutDirection: LayoutDirection;
}

export default function ColorProperties({ color, setColor, layoutDirection }: ColorPropertiesProps) {
  const [hsl, setHsl] = useState(() => hexToHsl(color));

  useEffect(() => {
    setHsl(hexToHsl(color));
  }, [color]);

  useEffect(() => {
    setColor(hslToHex(hsl.h, hsl.s, hsl.l));
  }, [hsl, setColor]);

  const containerClass = layoutDirection === 'horizontal'
    ? 'p-2 bg-secondary border-r border-modifier-border w-[120px] flex flex-col items-center gap-2'
    : 'p-2 bg-secondary border-r border-modifier-border h-[120px] flex flex-row items-center gap-2';

  const handleWheelChange = (h: number, s: number, l: number) => {
    setHsl({ h, s: s * 100, l });
  };

  return (
    <div className={containerClass}>
      <div className="text-text-muted text-xs">カラー</div>
      <ColorWheel
        hue={hsl.h}
        saturation={hsl.s / 100}
        lightness={hsl.l}
        onChange={handleWheelChange}
        size={120}
      />
    </div>
  );
}
