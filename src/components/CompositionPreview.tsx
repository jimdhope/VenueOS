import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface CompositionPreviewProps {
  data: string; // JSON string of the composition, now containing Fabric.js data
}

const CompositionPreview: React.FC<CompositionPreviewProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    let parsedData: any; // Declare without initializing to null

    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error("CompositionPreview: Failed to parse composition data:", e);
      return;
    }

    // Now check if parsedData is valid and contains fabric data
    if (!parsedData || !parsedData.fabric) {
      console.log("CompositionPreview: No Fabric.js data found or invalid structure.");
      return;
    }

    // Extract original composition dimensions from parsedData
    const originalWidth = parsedData.width || 1920; // Now parsedData is guaranteed to be an object
    const originalHeight = parsedData.height || 1080; // Now parsedData is guaranteed to be an object

    // Initialize Fabric.js canvas with original dimensions
    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false, // Disable selection for preview
      hoverCursor: 'pointer',
      isDrawingMode: false,
      width: originalWidth,   // Set Fabric.js canvas width
      height: originalHeight, // Set Fabric.js canvas height
    });
    fabricCanvasRef.current = canvas;

    canvas.loadFromJSON(parsedData.fabric, () => {
      // Calculate scale to fit content within preview dimensions
      const scaleX = previewWidth / originalWidth;
      const scaleY = previewHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      // Apply scaling and center the content
      canvas.setZoom(scale);
      // Calculate offset to center the scaled content
      const viewportCenterX = (previewWidth - originalWidth * scale) / 2;
      const viewportCenterY = (previewHeight - originalHeight * scale) / 2;

      canvas.viewportTransform = [scale, 0, 0, scale, viewportCenterX, viewportCenterY];
      canvas.renderAll();
    });

    return () => {
      canvas.dispose(); // Clean up Fabric.js canvas on unmount
    };
  }, [data]);

  // Define a fixed size for the preview area to maintain consistency
  const previewWidth = 200;
  const previewHeight = 150;

  return (
    <div
      style={{
        width: previewWidth,
        height: previewHeight,
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <canvas ref={canvasRef} width={previewWidth} height={previewHeight} />
    </div>
  );
};

export default CompositionPreview;