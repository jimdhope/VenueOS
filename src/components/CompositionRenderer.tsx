'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { calculateMatrixCrop } from '../lib/matrix';
import EffectsOverlay from './EffectsOverlay';

interface CompositionRendererProps {
    data: string; // JSON string of the fabric canvas
    width?: number;
    height?: number;
    matrixRow?: number;
    matrixCol?: number;
    totalRows?: number;
    totalCols?: number;
}

export default function CompositionRenderer({ 
    data, 
    width = 1920, 
    height = 1080, 
    matrixRow, 
    matrixCol,
    totalRows = 1,
    totalCols = 1,
}: CompositionRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.StaticCanvas | null>(null);
    const [effect, setEffect] = useState<'none' | 'snow' | 'rain'>('none');
    const [compWidth, setCompWidth] = useState<number>(width);
    const [compHeight, setCompHeight] = useState<number>(height);
    const [finalWidth, setFinalWidth] = useState<number>(width);
    const [finalHeight, setFinalHeight] = useState<number>(height);
    const [scaleInfo, setScaleInfo] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [cropRegion, setCropRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const isMounted = useRef(true);
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        isMounted.current = true;
        console.log('Initializing Composition Renderer');

        if (!canvasRef.current) {
            const el = document.createElement('canvas');
            el.width = compWidth;
            el.height = compHeight;
            canvasRef.current = el;
        }

        if (!canvasWrapperRef.current) {
            canvasWrapperRef.current = document.createElement('div');
            canvasWrapperRef.current.style.position = 'absolute';
            canvasWrapperRef.current.style.top = '0';
            canvasWrapperRef.current.style.left = '0';
        }

        if (canvasRef.current && !canvasWrapperRef.current.contains(canvasRef.current)) {
            canvasWrapperRef.current.appendChild(canvasRef.current);
        }

        if (canvasContainerRef.current && !canvasContainerRef.current.contains(canvasWrapperRef.current)) {
            canvasContainerRef.current.appendChild(canvasWrapperRef.current);
        }

        const canvas = new fabric.StaticCanvas(canvasRef.current as HTMLCanvasElement, {
            renderOnAddRemove: false,
            selection: false,
        });

        const safeRender = () => {
            try {
                if (isMounted.current && canvas.getElement()) {
                    canvas.requestRenderAll();
                }
            } catch (e) {
                console.warn('safeRender error', e);
            }
        };

        if (data) {
            try {
                const parsed = JSON.parse(data);
                const objects = parsed.fabric || parsed;
                if (parsed.width) setCompWidth(parsed.width);
                if (parsed.height) setCompHeight(parsed.height);
                if (parsed.meta?.effect) setEffect(parsed.meta.effect);

                canvas.loadFromJSON(objects, () => {
                    if (isMounted.current) {
                        console.log('Composition Loaded');
                        safeRender();
                    }
                });

                setTimeout(safeRender, 100);
                setTimeout(safeRender, 500);
                setTimeout(safeRender, 1000);
            } catch (e) {
                console.error('Failed to parse composition data', e);
            }
        }

        setFabricCanvas(canvas);

        return () => {
            console.log('Disposing Composition Renderer');
            isMounted.current = false;
            try {
                canvas.dispose();
            } catch (e) {
                console.warn('Error disposing fabric canvas', e);
            }
            if (canvasRef.current && canvasRef.current.parentElement) {
                try {
                    canvasRef.current.parentElement.removeChild(canvasRef.current);
                } catch (e) {}
            }
        };
    }, [data]);

    useEffect(() => {
        if (!fabricCanvas || !containerRef.current) return;

        const handleResize = () => {
            try {
                if (!containerRef.current || !isMounted.current || !fabricCanvas.getContext()) return;

                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;

                const isMatrix = matrixRow != null && matrixCol != null && (totalRows > 1 || totalCols > 1);

                let logicalWidth = isMatrix ? compWidth / totalCols : compWidth;
                let logicalHeight = isMatrix ? compHeight / totalRows : compHeight;

                const scale = Math.min(containerWidth / logicalWidth, containerHeight / logicalHeight);
                
                const scaledCompWidth = Math.round(compWidth * scale);
                const scaledCompHeight = Math.round(compHeight * scale);

                fabricCanvas.setDimensions({ width: scaledCompWidth, height: scaledCompHeight });
                fabricCanvas.setZoom(scale);

                const finalSectionWidth = Math.round(logicalWidth * scale);
                const finalSectionHeight = Math.round(logicalHeight * scale);
                
                const offsetX = Math.round((containerWidth - finalSectionWidth) / 2);
                const offsetY = Math.round((containerHeight - finalSectionHeight) / 2);

                setFinalWidth(finalSectionWidth);
                setFinalHeight(finalSectionHeight);
                setScaleInfo({ scale, offsetX, offsetY });

                if (isMounted.current && fabricCanvas.getContext()) {
                    fabricCanvas.requestRenderAll();
                }
            } catch (e) {
                console.warn('handleResize error', e);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [fabricCanvas, compWidth, compHeight, matrixRow, matrixCol, totalRows, totalCols]);

    useEffect(() => {
        if (matrixRow !== undefined && matrixCol !== undefined && matrixRow !== null && matrixCol !== null) {
            const crop = calculateMatrixCrop(compWidth, compHeight, matrixRow, matrixCol, totalRows, totalCols);
            setCropRegion(crop);
            console.log(`Matrix crop calculated:`, crop, `for position [${matrixRow},${matrixCol}] of ${totalRows}x${totalCols}`);
        } else {
            setCropRegion(null);
        }
    }, [matrixRow, matrixCol, compWidth, compHeight, totalRows, totalCols]);

    useEffect(() => {
        if (canvasWrapperRef.current && cropRegion) {
            const x = -cropRegion.x * scaleInfo.scale;
            const y = -cropRegion.y * scaleInfo.scale;
            canvasWrapperRef.current.style.transform = `translate(${x}px, ${y}px)`;
        } else if (canvasWrapperRef.current) {
            canvasWrapperRef.current.style.transform = 'none';
        }
    }, [cropRegion, scaleInfo]);

    const [webpages, setWebpages] = useState<any[]>([]);

    useEffect(() => {
        if (!data) return;
        try {
            const parsed = JSON.parse(data);
            const objects = parsed.fabric?.objects || parsed.objects || [];
            const webs = objects.filter((o: any) => o.customType === 'webpage').map((o: any) => ({
                id: o.data?.id || Math.random().toString(),
                src: o.src,
                left: o.left,
                top: o.top,
                width: o.width * (o.scaleX || 1),
                height: o.height * (o.scaleY || 1),
                blendMode: o.blendMode || 'normal',
                opacity: o.opacity ?? 1
            }));
            setWebpages(webs);
        } catch (e) { }
    }, [data]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <div 
                ref={canvasContainerRef} 
                style={{ 
                    position: 'relative', 
                    width: finalWidth + 'px', 
                    height: finalHeight + 'px',
                    overflow: 'hidden', // Always hide overflow for matrix and single view consistency
                }}
            >
                <EffectsOverlay effect={effect} />

                {webpages.map((wp, i) => {
                    const isInCrop = cropRegion
                        ? (wp.left < cropRegion.x + cropRegion.width &&
                           wp.left + wp.width > cropRegion.x &&
                           wp.top < cropRegion.y + cropRegion.height &&
                           wp.top + wp.height > cropRegion.y)
                        : true;

                    if (!isInCrop) return null;

                    const croppedLeft = (cropRegion ? wp.left - cropRegion.x : wp.left) * scaleInfo.scale;
                    const croppedTop = (cropRegion ? wp.top - cropRegion.y : wp.top) * scaleInfo.scale;

                    return (
                        <iframe
                            key={i}
                            src={wp.src}
                            style={{
                                position: 'absolute',
                                left: (cropRegion ? 0 : scaleInfo.offsetX) + croppedLeft,
                                top: (cropRegion ? 0 : scaleInfo.offsetY) + croppedTop,
                                width: wp.width * scaleInfo.scale,
                                height: wp.height * scaleInfo.scale,
                                border: 'none',
                                opacity: wp.opacity,
                                zIndex: 10,
                                mixBlendMode: wp.blendMode as any,
                                pointerEvents: 'none'
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
