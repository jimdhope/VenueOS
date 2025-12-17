'use client';

import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { useEditor } from './EditorContext';
import styles from './editor.module.css';
import EffectsOverlay from '../EffectsOverlay';

interface EditorCanvasProps {
    width: number;
    height: number;
    effect: 'none' | 'snow' | 'rain';
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ width, height, effect }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setCanvas } = useEditor();

    useEffect(() => {
        if (canvasRef.current) {
            const fabricCanvas = new fabric.Canvas(canvasRef.current, {
                width: width,
                height: height,
                backgroundColor: '#333',
            });
            setCanvas(fabricCanvas);

            // Cleanup function
            return () => {
                fabricCanvas.dispose();
            };
        }
    }, [setCanvas, width, height]);

    return (
        <div className={styles.canvasContainer} style={{ width: width, height: height }}>
            <canvas ref={canvasRef} />
            <EffectsOverlay effect={effect} width={width} height={height} />
        </div>
    );
};

export default EditorCanvas;