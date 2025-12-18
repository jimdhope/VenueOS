import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface CompositionPreviewProps {
  data: string; // JSON string of the composition, now containing Fabric.js data
}

const CompositionPreview: React.FC<CompositionPreviewProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false, // Disable selection for preview
      hoverCursor: 'pointer',
      isDrawingMode: false,
    });
    fabricCanvasRef.current = canvas;

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error("CompositionPreview: Failed to parse composition data:", e);
      return;
    }

    if (parsedData && parsedData.fabric) {
      canvas.loadFromJSON(parsedData.fabric, () => {
        canvas.renderAll();
        // Optionally scale down the canvas content to fit the preview area
        const scaleX = canvasRef.current!.width / canvas.width;
        const scaleY = canvasRef.current!.height / canvas.height;
        const scale = Math.min(scaleX, scaleY);

        canvas.setZoom(scale);
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0]; // Reset viewport transform
        canvas.renderAll();
      });
    } else {
      console.log("CompositionPreview: No Fabric.js data found in composition.");
    }

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