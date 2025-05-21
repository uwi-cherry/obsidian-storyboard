import React, { useState, useEffect } from 'react';
import { t } from 'src/i18n';
import { NOTE_ICON_SVG } from 'src/icons';

interface PreviewCellProps {
  sePrompt?: string;
  cameraPrompt?: string;
  timecode?: string;
  onSePromptChange: (newVal: string) => void;
  onCameraPromptChange: (newVal: string) => void;
  onTimecodeChange: (newVal: string) => void;
}

const PreviewCell: React.FC<PreviewCellProps> = ({
  sePrompt,
  cameraPrompt,
  timecode,
  onSePromptChange,
  onCameraPromptChange,
  onTimecodeChange,
}) => {
  const [showSe, setShowSe] = useState(!!sePrompt);
  const [showCamera, setShowCamera] = useState(!!cameraPrompt);
  const [showTime, setShowTime] = useState(!!timecode);

  useEffect(() => {
    setShowSe(!!sePrompt);
  }, [sePrompt]);
  useEffect(() => {
    setShowCamera(!!cameraPrompt);
  }, [cameraPrompt]);
  useEffect(() => {
    setShowTime(!!timecode);
  }, [timecode]);

  return (
    <div className="flex flex-col gap-1 items-start">
      {showSe ? (
        <textarea
          value={sePrompt || ''}
          onChange={e => onSePromptChange(e.target.value)}
          placeholder={t('SE_PROMPT_PLACEHOLDER')}
          className="w-full border-2 border-modifier-border p-1 text-xs bg-transparent"
        />
      ) : (
        <button
          className="text-xs text-accent hover:underline flex items-center gap-1"
          onClick={() => setShowSe(true)}
        >
          <span dangerouslySetInnerHTML={{ __html: NOTE_ICON_SVG }} />
          {t('ADD_SE')}
        </button>
      )}
      {showCamera ? (
        <textarea
          value={cameraPrompt || ''}
          onChange={e => onCameraPromptChange(e.target.value)}
          placeholder={t('CAMERA_PROMPT_PLACEHOLDER')}
          className="w-full border-2 border-modifier-border p-1 text-xs bg-transparent"
        />
      ) : (
        <button
          className="text-xs text-accent hover:underline"
          onClick={() => setShowCamera(true)}
        >
          {t('ADD_CAMERA_ANGLE')}
        </button>
      )}
      {timecode && (
        <span className="text-xs border-2 border-modifier-border p-1 bg-transparent">
          {timecode}
        </span>
      )}
    </div>
  );
};

export default PreviewCell;
