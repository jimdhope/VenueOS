'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

export default function TestEditorPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

    useEffect(() => {
        if (canvasRef.current && !fabricCanvas) {
            const canvas = new fabric.Canvas(canvasRef.current, {
                width: 1280,
                height: 720,
                backgroundColor: '#333',
            });
            setFabricCanvas(canvas);

            // Cleanup
            return () => {
                canvas.dispose();
            };
        }
    }, [canvasRef.current]);

    const addRect = () => {
        if (!fabricCanvas) return;
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'red',
            width: 100,
            height: 100,
        });
        fabricCanvas.add(rect);
    };

    const addText = () => {
        if (!fabricCanvas) return;
        const text = new fabric.IText('Hello World', {
            left: 200,
            top: 200,
            fill: 'white',
            fontSize: 40,
        });
        fabricCanvas.add(text);
    };

    const handleSave = () => {
        if (!fabricCanvas) return;
        const json = fabricCanvas.toJSON();
        console.log('Saved JSON:', json);
        alert('Canvas JSON saved to console');
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#111', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'white', padding: 10, background: '#222', display: 'flex', gap: 10, alignItems: 'center' }}>
                <h1>Custom Fabric Editor</h1>
                <button onClick={addRect} style={{ padding: '5px 10px' }}>Add Rect</button>
                <button onClick={addText} style={{ padding: '5px 10px' }}>Add Text</button>
                <button onClick={handleSave} style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none' }}>Save JSON</button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
