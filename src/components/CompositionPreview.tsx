import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface CompositionPreviewProps {
  data: string; // JSON string of the composition, now containing Fabric.js data
}

const CompositionPreview: React.FC<CompositionPreviewProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log("CompositionPreview: Running on server, skipping Fabric.js init.");
      return;
    }

    if (!canvasRef.current) {
      console.log("CompositionPreview: Canvas ref not available.");
      return;
    }

    // Ensure canvas element has dimensions before proceeding
    if (canvasRef.current.width === 0 || canvasRef.current.height === 0) {
      console.warn("CompositionPreview: Canvas element has zero dimensions, retrying...");
      // This might indicate a timing issue, could re-trigger useEffect or wait
      // For now, we'll just return and hope a re-render fixes it, or the setTimeout helps.
      return;
    }

    // Add a small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      console.log("CompositionPreview: Initializing Fabric.js canvas...");
      console.log(`Canvas element dimensions: ${canvasRef.current?.width}x${canvasRef.current?.height}`);

      let parsedData: any;
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
      const originalWidth = parsedData.width || 1920; // Default to 1920 if not found
      const originalHeight = parsedData.height || 1080; // Default to 1080 if not found

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
        console.log("CompositionPreview: Fabric.js canvas loaded and rendered.");
      });

      return () => {
        console.log("CompositionPreview: Disposing Fabric.js canvas.");
        canvas.dispose();
      };
    }, 0); // Delay initialization to next event loop tick

    return () => clearTimeout(timeoutId); // Cleanup timeout if component unmounts
  }, [data, previewWidth, previewHeight]);

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