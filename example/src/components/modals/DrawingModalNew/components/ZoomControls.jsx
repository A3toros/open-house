import React from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, X, Maximize2 } from 'lucide-react';
import Button from '../../../ui/Button';

const ZoomControls = ({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onRotate, 
  onDownload, 
  onFullscreen, 
  isFullscreen 
}) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 items-center justify-center">
      <Button
        onClick={onZoomIn}
        variant="secondary"
        size="icon"
        className="w-10 h-10"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4 mx-auto my-auto" />
      </Button>
      
      <Button
        onClick={onZoomOut}
        variant="secondary"
        size="icon"
        className="w-10 h-10"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4 mx-auto my-auto" />
      </Button>
      
      <Button
        onClick={onRotate}
        variant="secondary"
        size="icon"
        className="w-10 h-10"
        title="Rotate"
      >
        <RotateCw className="w-4 h-4 mx-auto my-auto" />
      </Button>
      
      <Button
        onClick={onDownload}
        variant="secondary"
        size="icon"
        className="w-10 h-10"
        title="Download"
      >
        <Download className="w-4 h-4 mx-auto my-auto" />
      </Button>
      
      <Button
        onClick={onFullscreen}
        variant="secondary"
        size="icon"
        className="w-10 h-10"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <X className="w-4 h-4 mx-auto my-auto" />
        ) : (
          <Maximize2 className="w-4 h-4 mx-auto my-auto" />
        )}
      </Button>
    </div>
  );
};

export default ZoomControls;
