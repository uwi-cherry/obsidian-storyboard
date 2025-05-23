import React from 'react';

interface ThumbnailViewerProps {
  src: string | null;
  alt?: string;
  title?: string;
  onDoubleClick?: () => void;
  onClear?: () => void;
  className?: string;
  clearButtonIcon?: string;
  clearButtonTitle?: string;
}

const ThumbnailViewer: React.FC<ThumbnailViewerProps> = ({
  src,
  alt = '',
  title = '',
  onDoubleClick,
  onClear,
  className = '',
  clearButtonIcon = '×',
  clearButtonTitle = 'クリア',
}) => {
  if (!src) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        title={title}
        className="w-auto object-contain bg-secondary rounded cursor-pointer"
        onDoubleClick={onDoubleClick}
        tabIndex={0}
      />
      {onClear && (
        <button
          className="absolute top-1 right-1 p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          title={clearButtonTitle}
          dangerouslySetInnerHTML={{ __html: clearButtonIcon }}
        />
      )}
    </div>
  );
};

export default ThumbnailViewer; 