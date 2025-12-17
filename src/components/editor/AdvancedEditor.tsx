import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';
import anime from 'animejs';
import styles from './AdvancedEditor.module.css';
import EffectsOverlay from '../EffectsOverlay';
import MediaPickerModal from './MediaPickerModal';

export interface AdvancedEditorRef {
    triggerSave: () => void;
}

// Helper component for properties to handle controlled inputs smoothly
const PropertyInput = ({ label, value, onChange, type = "number", ...props }: any) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div className={styles.inputGroup} style={{ flex: 1 }}>
            <span className={styles.label}>{label}</span>
            <input
                type={type}
                className={styles.input}
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    onChange(e.target.value);
                }}
                {...props}
            />
        </div>
    );
};

interface AdvancedEditorProps {
    initialData?: any;
    onSave?: (data: any) => void;
    width?: number;
    height?: number;
    effect?: 'none' | 'snow' | 'rain';
}

const AdvancedEditor = forwardRef<AdvancedEditorRef, AdvancedEditorProps>(({ initialData, onSave, width = 1920, height = 1080, effect = 'none' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const currentAnimation = useRef<anime.AnimeInstance | null>(null);

    // Helper to calculate countdown text from config
    const getCountdownText = (config: any): string => {
        const target = new Date(config.targetDate);
        const now = new Date();
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) return '🎉 Now!';

        const totalSeconds = Math.floor(diff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);
        const totalMonths = Math.floor(totalDays / 30.44);
        const totalYears = Math.floor(totalDays / 365.25);

        const parts: string[] = [];
        const hideLabels = config.hideLabels || false;

        if (config.showYears) {
            parts.push(hideLabels ? `${totalYears}` : `${totalYears}y`);
        }
        if (config.showMonths) {
            const months = config.showYears ? Math.floor((totalDays % 365.25) / 30.44) : totalMonths;
            parts.push(hideLabels ? `${months}` : `${months}mo`);
        }
        if (config.showDays) {
            let days = totalDays;
            if (config.showYears) days = Math.floor(totalDays % 365.25);
            if (config.showMonths && !config.showYears) days = Math.floor(totalDays % 30.44);
            if (config.showMonths && config.showYears) days = Math.floor((totalDays % 365.25) % 30.44);
            parts.push(hideLabels ? `${days}` : `${days}d`);
        }
        if (config.showHours) {
            parts.push(hideLabels ? `${totalHours % 24}` : `${totalHours % 24}h`);
        }
        if (config.showMinutes) {
            parts.push(hideLabels ? `${totalMinutes % 60}` : `${totalMinutes % 60}m`);
        }
        if (config.showSeconds) {
            parts.push(hideLabels ? `${totalSeconds % 60}` : `${totalSeconds % 60}s`);
        }

        return parts.length > 0 ? parts.join(' ') : `${totalDays}d`;
    };

    // UI State
    const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
    const [scale, setScale] = useState(1);
    const [_, setUpdateCounter] = useState(0);
    const [activeTab, setActiveTab] = useState<'properties' | 'layers' | 'effects'>('properties');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Expose Save Trigger
    useImperativeHandle(ref, () => ({
        triggerSave: () => {
            if (fabricCanvas.current && onSave) {
                stopAnimation(); // ensuring clean state before save

                // Reset zoom for saving
                const currentZoom = fabricCanvas.current.getZoom();
                const currentWidth = fabricCanvas.current.getWidth();
                const currentHeight = fabricCanvas.current.getHeight();

                fabricCanvas.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
                fabricCanvas.current.setDimensions({ width, height });

                // Ensure custom properties are exported (including countdown and webpage)
                const json = fabricCanvas.current.toObject(['effects', 'id', 'name', 'isCountdown', 'countdownData', 'isWebpage', 'webpageUrl']);

                // Restore zoom
                fabricCanvas.current.setZoom(currentZoom);
                fabricCanvas.current.setDimensions({ width: currentWidth, height: currentHeight });
                fabricCanvas.current.renderAll();

                onSave(json);
            }
        }
    }));

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricCanvas.current) return;

        console.log('Initializing Fabric Canvas');
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: width,
            height: height,
            backgroundColor: '#000000',
            preserveObjectStacking: true,
        });

        fabricCanvas.current = canvas;

        // Selection Events
        canvas.on('selection:created', (e) => {
            stopAnimation();
            setActiveObject(e.selected?.[0] || null);
        });
        canvas.on('selection:updated', (e) => {
            stopAnimation();
            setActiveObject(e.selected?.[0] || null);
        });
        canvas.on('selection:cleared', () => {
            stopAnimation();
            setActiveObject(null);
        });

        // State Update Trigger
        const triggerUpdate = () => {
            setUpdateCounter(c => c + 1);
        };
        canvas.on('object:added', triggerUpdate);
        canvas.on('object:removed', triggerUpdate);
        canvas.on('object:modified', triggerUpdate);

        if (initialData) {
            canvas.loadFromJSON(initialData, () => {
                canvas.renderAll();
                console.log('Initial data loaded');
            });
        }

        return () => {
            console.log('Disposing Fabric Canvas');
            stopAnimation();
            canvas.dispose();
            fabricCanvas.current = null;
        };
    }, []);

    // Live countdown updates in editor
    useEffect(() => {
        const updateCountdowns = () => {
            if (!fabricCanvas.current) return;
            const objects = fabricCanvas.current.getObjects();
            let needsRender = false;

            objects.forEach((obj: any) => {
                if (obj.isCountdown && obj.countdownData) {
                    try {
                        const config = JSON.parse(obj.countdownData);
                        const newText = getCountdownText(config);
                        if (obj.text !== newText) {
                            obj.set('text', newText);
                            needsRender = true;
                        }
                    } catch (e) { }
                }
            });

            if (needsRender) {
                fabricCanvas.current.renderAll();
            }
        };

        updateCountdowns(); // Initial update
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, []);


    // Handle Resize & Auto-scale
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && fabricCanvas.current) {
                const containerWidth = containerRef.current.clientWidth - 40;
                const containerHeight = containerRef.current.clientHeight - 40;

                const scaleX = containerWidth / width;
                const scaleY = containerHeight / height;

                const finalScale = Math.max(0.1, Math.min(scaleX, scaleY, 1));
                setScale(finalScale);

                fabricCanvas.current.setDimensions({
                    width: width * finalScale,
                    height: height * finalScale
                });
                fabricCanvas.current.setZoom(finalScale);
                fabricCanvas.current.renderAll();
            }
        };

        window.addEventListener('resize', handleResize);

        // Initial resize
        if (fabricCanvas.current) {
            handleResize();
        }

        // Observer for container size changes
        const observer = new ResizeObserver(handleResize);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [width, height]);


    // --- Tools ---

    const addRect = () => {
        if (!fabricCanvas.current) return;
        const rect = new fabric.Rect({
            left: 100, top: 100, fill: '#ef4444', width: 200, height: 200,
        });
        fabricCanvas.current.add(rect);
        fabricCanvas.current.setActiveObject(rect);
    };

    const addCircle = () => {
        if (!fabricCanvas.current) return;
        const circle = new fabric.Circle({
            radius: 50, left: 150, top: 150, fill: '#10b981'
        });
        fabricCanvas.current.add(circle);
        fabricCanvas.current.setActiveObject(circle);
    };

    const addTriangle = () => {
        if (!fabricCanvas.current) return;
        const triangle = new fabric.Triangle({
            width: 100, height: 100, left: 200, top: 200, fill: '#f59e0b'
        });
        fabricCanvas.current.add(triangle);
        fabricCanvas.current.setActiveObject(triangle);
    };

    const addText = () => {
        if (!fabricCanvas.current) return;
        const text = new fabric.IText('Double Click to Edit', {
            left: 300, top: 300, fill: '#ffffff', fontSize: 40, fontFamily: 'Arial',
        });
        fabricCanvas.current.add(text);
        fabricCanvas.current.setActiveObject(text);
    };

    // Old Image Add (File Picker) - Retained as "Upload"
    const addImageFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && fabricCanvas.current) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    const data = f.target?.result as string;
                    fabric.Image.fromURL(data, (img) => {
                        img.set({ left: width / 2, top: height / 2, originX: 'center', originY: 'center' });
                        // Scale to 25% of canvas width by default
                        const targetWidth = width * 0.25;
                        img.scaleToWidth(targetWidth);
                        fabricCanvas.current?.add(img);
                        fabricCanvas.current?.setActiveObject(img);
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const addWebpage = () => {
        if (!fabricCanvas.current) return;
        const url = prompt("Enter Webpage URL", "https://example.com");
        if (!url) return;

        const rect = new fabric.Rect({
            left: 100, top: 100, width: 400, height: 300,
            fill: '#E0E0E0', stroke: '#2563eb', strokeWidth: 2
        });
        (rect as any).isWebpage = true;
        (rect as any).webpageUrl = url;

        fabricCanvas.current.add(rect);
        fabricCanvas.current.setActiveObject(rect);
    };

    const addCountdown = () => {
        if (!fabricCanvas.current) return;

        // Default to 30 days from now
        const defaultTarget = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const text = new fabric.IText('00', {
            left: 300, top: 300, fill: '#ffffff', fontSize: 80, fontFamily: 'Arial',
            fontWeight: 'bold',
        });
        (text as any).isCountdown = true;
        (text as any).countdownData = JSON.stringify({
            targetDate: defaultTarget.toISOString(),
            showYears: false,
            showMonths: false,
            showDays: true,
            showHours: false,
            showMinutes: false,
            showSeconds: false,
        });

        fabricCanvas.current.add(text);
        fabricCanvas.current.setActiveObject(text);
    };

    // Media Modal Selection
    const onSelectMedia = (item: any) => {
        if (fabricCanvas.current && item.url) {
            // Always store relative URLs to ensure cross-device compatibility
            const relativeUrl = item.url.startsWith('http') 
                ? new URL(item.url).pathname 
                : item.url;
            
            fabric.Image.fromURL(item.url, (img) => {
                img.set({ left: width / 2, top: height / 2, originX: 'center', originY: 'center' });
                // Store the relative URL in the image source
                img.setSrc(relativeUrl, () => {
                    // Scale to 25% of canvas width by default
                    const targetWidth = width * 0.25;
                    img.scaleToWidth(targetWidth);
                    fabricCanvas.current?.add(img);
                    fabricCanvas.current?.setActiveObject(img);
                });
            });
        }
        setMediaModalOpen(false);
    };


    // --- Layer Management ---
    const bringForward = () => {
        if (activeObject && fabricCanvas.current) {
            activeObject.bringForward();
            fabricCanvas.current.renderAll();
            setUpdateCounter(c => c + 1);
        }
    };

    const sendBackwards = () => {
        if (activeObject && fabricCanvas.current) {
            activeObject.sendBackwards();
            fabricCanvas.current.renderAll();
            setUpdateCounter(c => c + 1);
        }
    };

    const deleteActive = () => {
        const active = fabricCanvas.current?.getActiveObjects();
        if (active?.length) {
            fabricCanvas.current?.discardActiveObject();
            active.forEach((obj) => fabricCanvas.current?.remove(obj));
            setUpdateCounter(c => c + 1);
        }
    };

    // --- Effects Management ---
    const stopAnimation = () => {
        if (currentAnimation.current) {
            currentAnimation.current.pause();
            currentAnimation.current = null;
        }
        setIsPlaying(false);
    };

    const updateEffect = (type: 'enter' | 'exit' | 'loop', data: any) => {
        if (!activeObject) return;
        stopAnimation(); // Stop any running animation when settings change

        const effects = (activeObject as any).effects || {};
        effects[type] = { ...effects[type], ...data };
        (activeObject as any).effects = effects;
        setUpdateCounter(c => c + 1);
    };

    const previewEffect = (type: 'enter' | 'exit' | 'loop') => {
        if (!activeObject || !fabricCanvas.current) return;

        stopAnimation(); // Stop previous first

        const effects = (activeObject as any).effects || {};
        const config = effects[type];
        if (!config || config.type === 'none') return;

        setIsPlaying(true);

        const originalState = {
            opacity: activeObject.opacity,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
            angle: activeObject.angle,
            left: activeObject.left,
            top: activeObject.top
        };

        if (type === 'enter') {
            const startScale = config.startScale !== undefined ? config.startScale : 0;
            const distance = config.distance || 200;
            const direction = config.direction || 'left';

            if (config.type === 'fade') activeObject.set('opacity', 0);
            if (config.type === 'scale-up') { activeObject.scale(startScale); }
            if (config.type === 'slide-in') {
                if (direction === 'left') activeObject.set('left', (originalState.left || 0) - distance);
                if (direction === 'right') activeObject.set('left', (originalState.left || 0) + distance);
                if (direction === 'top') activeObject.set('top', (originalState.top || 0) - distance);
                if (direction === 'bottom') activeObject.set('top', (originalState.top || 0) + distance);
            }
        }

        fabricCanvas.current.renderAll();

        const targets = activeObject;

        const animConfig: any = {
            targets: targets,
            duration: config.duration || 1000,
            delay: config.delay || 0,
            easing: config.easing || 'easeInOutQuad',
            update: () => fabricCanvas.current?.renderAll(),
            complete: () => {
                if (type === 'exit') {
                    setTimeout(() => {
                        // optional restore
                        setIsPlaying(false);
                    }, 500);
                } else if (type === 'enter') {
                    setIsPlaying(false);
                }
            }
        };

        if (type === 'enter') {
            if (config.type === 'fade') animConfig.opacity = [0, originalState.opacity || 1];
            if (config.type === 'scale-up') {
                const startScale = config.startScale !== undefined ? config.startScale : 0;
                animConfig.scaleX = [startScale, originalState.scaleX || 1];
                animConfig.scaleY = [startScale, originalState.scaleY || 1];
            }
            if (config.type === 'slide-in') {
                if (config.direction === 'left' || !config.direction) animConfig.left = [(originalState.left || 0) - (config.distance || 200), originalState.left];
                if (config.direction === 'right') animConfig.left = [(originalState.left || 0) + (config.distance || 200), originalState.left];
                if (config.direction === 'top') animConfig.top = [(originalState.top || 0) - (config.distance || 200), originalState.top];
                if (config.direction === 'bottom') animConfig.top = [(originalState.top || 0) + (config.distance || 200), originalState.top];
            }

        } else if (type === 'exit') {
            if (config.type === 'fade') animConfig.opacity = 0;
            if (config.type === 'scale-down') {
                const endScale = config.endScale !== undefined ? config.endScale : 0;
                animConfig.scaleX = endScale;
                animConfig.scaleY = endScale;
            }
        } else if (type === 'loop') {
            animConfig.loop = true;
            animConfig.direction = 'alternate';
            if (config.type === 'pulse') {
                const scaleFactor = config.scaleFactor || 1.1;
                animConfig.scaleX = (originalState.scaleX || 1) * scaleFactor;
                animConfig.scaleY = (originalState.scaleY || 1) * scaleFactor;
            }
            if (config.type === 'spin') {
                const angle = config.angle || 360;
                animConfig.angle = (originalState.angle || 0) + angle;
                animConfig.loop = true;
                animConfig.direction = 'normal';
                animConfig.easing = 'linear';
            }
        }

        currentAnimation.current = anime(animConfig);
    };

    const EffectControls = ({ type, title, color }: { type: 'enter' | 'exit' | 'loop', title: string, color: string }) => {
        if (!activeObject) return null;
        const effect = (activeObject as any).effects?.[type] || {};

        return (
            <div className={styles.propertyRow} style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: 15, borderLeft: `3px solid ${color}`, paddingLeft: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                    <span className={styles.label} style={{ color: color, fontWeight: 'bold' }}>{title}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                        {isPlaying && currentAnimation.current && (
                            <button onClick={stopAnimation} style={{ background: '#7f1d1d', border: '1px solid #991b1b', cursor: 'pointer', color: 'white', borderRadius: 3, padding: '2px 5px', fontSize: '0.7rem' }}>Stop</button>
                        )}
                        {effect.type && effect.type !== 'none' && (
                            <button onClick={() => previewEffect(type)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>▶️</button>
                        )}
                    </div>
                </div>

                <select
                    className={styles.input}
                    value={effect.type || 'none'}
                    onChange={(e) => updateEffect(type, { type: e.target.value })}
                    style={{ marginBottom: 5 }}
                >
                    <option value="none">None</option>
                    {type === 'enter' && <option value="fade">Fade In</option>}
                    {type === 'enter' && <option value="scale-up">Scale Up</option>}
                    {type === 'enter' && <option value="slide-in">Slide In</option>}

                    {type === 'exit' && <option value="fade">Fade Out</option>}
                    {type === 'exit' && <option value="scale-down">Scale Down</option>}

                    {type === 'loop' && <option value="pulse">Pulse</option>}
                    {type === 'loop' && <option value="spin">Spin</option>}
                </select>

                {effect.type && effect.type !== 'none' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                            <PropertyInput
                                label="Duration"
                                value={effect.duration || (type === 'loop' ? 2000 : 1000)}
                                onChange={(val: any) => updateEffect(type, { duration: Number(val) })}
                            />
                            <PropertyInput
                                label="Delay"
                                value={effect.delay || 0}
                                onChange={(val: any) => updateEffect(type, { delay: Number(val) })}
                            />
                        </div>
                        <div className={styles.inputGroup} style={{ width: '100%' }}>
                            <span className={styles.label}>Easing</span>
                            <select
                                className={styles.input}
                                value={effect.easing || 'easeInOutQuad'}
                                onChange={(e) => updateEffect(type, { easing: e.target.value })}
                            >
                                <option value="linear">Linear</option>
                                <option value="easeInOutQuad">Smooth (Quad)</option>
                                <option value="easeOutElastic">Elastic</option>
                                <option value="easeInOutSine">Sine</option>
                                <option value="easeOutBounce">Bounce</option>
                            </select>
                        </div>

                        {/* Specific Parameters */}
                        {effect.type === 'slide-in' && (
                            <div style={{ display: 'flex', gap: 5 }}>
                                <div className={styles.inputGroup} style={{ width: '100%' }}>
                                    <span className={styles.label}>Direction</span>
                                    <select
                                        className={styles.input}
                                        value={effect.direction || 'left'}
                                        onChange={(e) => updateEffect(type, { direction: e.target.value })}
                                    >
                                        <option value="left">From Left</option>
                                        <option value="right">From Right</option>
                                        <option value="top">From Top</option>
                                        <option value="bottom">From Bottom</option>
                                    </select>
                                </div>
                                <PropertyInput
                                    label="Dist (px)"
                                    value={effect.distance || 200}
                                    onChange={(val: any) => updateEffect(type, { distance: Number(val) })}
                                />
                            </div>
                        )}

                        {(effect.type === 'scale-up' || effect.type === 'scale-down') && (
                            <div style={{ display: 'flex', gap: 5 }}>
                                <PropertyInput
                                    label={effect.type === 'scale-up' ? "Start Scale" : "End Scale"}
                                    value={effect.type === 'scale-up' ? (effect.startScale ?? 0) : (effect.endScale ?? 0)}
                                    onChange={(val: any) => updateEffect(type, effect.type === 'scale-up' ? { startScale: Number(val) } : { endScale: Number(val) })}
                                />
                            </div>
                        )}

                        {effect.type === 'spin' && (
                            <div style={{ display: 'flex', gap: 5 }}>
                                <PropertyInput
                                    label="Angle (deg)"
                                    value={effect.angle ?? 360}
                                    onChange={(val: any) => updateEffect(type, { angle: Number(val) })}
                                />
                            </div>
                        )}

                        {effect.type === 'pulse' && (
                            <div style={{ display: 'flex', gap: 5 }}>
                                <PropertyInput
                                    label="Scale Factor"
                                    value={effect.scaleFactor ?? 1.1}
                                    onChange={(val: any) => updateEffect(type, { scaleFactor: Number(val) })}
                                />
                            </div>
                        )}

                    </div>
                )}
            </div>
        );
    };


    return (
        <div className={styles.editorContainer}>
            {/* Toolbar */}
            <div className={styles.sidebar}>
                <button className={styles.sidebarButton} onClick={addRect} title="Square">
                    <span style={{ fontSize: '1.2rem' }}>⬜</span>
                    <span style={{ fontSize: '0.6rem' }}>Square</span>
                </button>
                <button className={styles.sidebarButton} onClick={addCircle} title="Circle">
                    <span style={{ fontSize: '1.2rem' }}>⚪</span>
                    <span style={{ fontSize: '0.6rem' }}>Circle</span>
                </button>
                <button className={styles.sidebarButton} onClick={addTriangle} title="Triangle">
                    <span style={{ fontSize: '1.2rem' }}>▲</span>
                    <span style={{ fontSize: '0.6rem' }}>Tri</span>
                </button>

                <div style={{ height: 1, width: '80%', background: '#444', margin: '4px 0' }} />

                <button className={styles.sidebarButton} onClick={addText} title="Text">
                    <span style={{ fontSize: '1.2rem' }}>T</span>
                    <span>Text</span>
                </button>
                <button className={styles.sidebarButton} onClick={() => setMediaModalOpen(true)} title="Media Library">
                    <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                    <span>Media</span>
                </button>
                <button className={styles.sidebarButton} onClick={addImageFile} title="Upload Image">
                    <span style={{ fontSize: '1.2rem' }}>📁</span>
                    <span>Upload</span>
                </button>
                <button className={styles.sidebarButton} onClick={addWebpage} title="Add Webpage">
                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                    <span>Web</span>
                </button>
                <button className={styles.sidebarButton} onClick={addCountdown} title="Add Countdown">
                    <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                    <span>Timer</span>
                </button>
            </div>

            {/* Canvas Area */}
            <div className={styles.canvasArea} ref={containerRef}>
                <div
                    className={styles.canvasWrapper}
                    style={{
                        width: width * scale,
                        height: height * scale,
                    }}
                >
                    <canvas ref={canvasRef} />
                    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
                        <EffectsOverlay effect={effect} />
                    </div>
                </div>
            </div>

            {/* Properties Panel */}
            <div className={styles.propertiesPanel}>
                <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: 10 }}>
                    <button
                        style={{ flex: 1, padding: 10, background: activeTab === 'properties' ? '#333' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                        onClick={() => setActiveTab('properties')}
                    >
                        Properties
                    </button>
                    <button
                        style={{ flex: 1, padding: 10, background: activeTab === 'effects' ? '#333' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                        onClick={() => setActiveTab('effects')}
                    >
                        Effects
                    </button>
                    <button
                        style={{ flex: 1, padding: 10, background: activeTab === 'layers' ? '#333' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                        onClick={() => setActiveTab('layers')}
                    >
                        Layers
                    </button>
                </div>

                {activeTab === 'layers' && (
                    <div className={styles.panelSection} style={{ flex: 1, overflowY: 'auto' }}>
                        <div className={styles.panelTitle}>Layers</div>
                        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                            {fabricCanvas.current?.getObjects().map((obj, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '8px 10px',
                                        background: activeObject === obj ? '#2563eb' : 'transparent',
                                        borderBottom: '1px solid #333',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => {
                                        fabricCanvas.current?.setActiveObject(obj);
                                        fabricCanvas.current?.renderAll();
                                    }}
                                >
                                    <span>{obj.type} {i}</span>
                                    {activeObject === obj && <span>✓</span>}
                                </div>
                            ))}
                            {(!fabricCanvas.current || fabricCanvas.current.getObjects().length === 0) && (
                                <div style={{ color: '#666', padding: 10 }}>No layers</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'effects' && (
                    <div className={styles.panelSection}>
                        <div className={styles.panelTitle}>Animations</div>
                        {activeObject ? (
                            <>
                                <EffectControls type="enter" title="Enter Animation" color="#4ade80" />
                                <EffectControls type="exit" title="Exit Animation" color="#f87171" />
                                <EffectControls type="loop" title="Loop Animation" color="#60a5fa" />
                            </>
                        ) : (
                            <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                                Select an object to add effects
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className={styles.panelSection}>
                        <div className={styles.panelTitle}>Design</div>
                        {activeObject ? (
                            <>
                                {/* Text Specific (but NOT for countdown objects) */}
                                {activeObject.type === 'i-text' && !(activeObject as any).isCountdown && (
                                    <div className={styles.propertyRow} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                        <div className={styles.inputGroup}>
                                            <span className={styles.label}>Content</span>
                                            <textarea
                                                className={styles.input}
                                                value={(activeObject as fabric.IText).text}
                                                onChange={(e) => { (activeObject as fabric.IText).set('text', e.target.value); fabricCanvas.current?.renderAll(); }}
                                                rows={3}
                                            />
                                        </div>
                                        <div className={styles.propertyRow} style={{ marginTop: 8 }}>
                                            <PropertyInput
                                                label="Size"
                                                value={(activeObject as fabric.IText).fontSize}
                                                onChange={(val: any) => { (activeObject as fabric.IText).set('fontSize', Number(val)); fabricCanvas.current?.renderAll(); }}
                                            />
                                            <div className={styles.inputGroup} style={{ flex: 1, marginLeft: 8 }}>
                                                <span className={styles.label}>Color</span>
                                                <input
                                                    type="color" className={styles.input} style={{ padding: 0, height: 30 }}
                                                    value={activeObject.fill as string}
                                                    onChange={(e) => { activeObject.set('fill', e.target.value); fabricCanvas.current?.renderAll(); }}
                                                />
                                            </div>
                                        </div>

                                        {/* Font Family */}
                                        <div className={styles.inputGroup} style={{ marginTop: 8 }}>
                                            <span className={styles.label}>Font</span>
                                            <select
                                                className={styles.formatSelect}
                                                value={(activeObject as fabric.IText).fontFamily || 'Arial'}
                                                onChange={(e) => {
                                                    (activeObject as fabric.IText).set('fontFamily', e.target.value);
                                                    fabricCanvas.current?.renderAll();
                                                }}
                                            >
                                                <option value="Arial">Arial</option>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Georgia">Georgia</option>
                                                <option value="Verdana">Verdana</option>
                                                <option value="Courier New">Courier New</option>
                                                <option value="Impact">Impact</option>
                                                <option value="Comic Sans MS">Comic Sans MS</option>
                                            </select>
                                        </div>

                                        {/* Bold / Italic / Underline */}
                                        <div className={styles.formattingToolbar}>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).fontWeight === 'bold' ? styles.active : ''}`}
                                                onClick={() => {
                                                    const isBold = (activeObject as fabric.IText).fontWeight === 'bold';
                                                    (activeObject as fabric.IText).set('fontWeight', isBold ? 'normal' : 'bold');
                                                    fabricCanvas.current?.renderAll();
                                                    setUpdateCounter(c => c + 1);
                                                }}
                                                title="Bold"
                                            >
                                                <strong>B</strong>
                                            </button>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).fontStyle === 'italic' ? styles.active : ''}`}
                                                onClick={() => {
                                                    const isItalic = (activeObject as fabric.IText).fontStyle === 'italic';
                                                    (activeObject as fabric.IText).set('fontStyle', isItalic ? 'normal' : 'italic');
                                                    fabricCanvas.current?.renderAll();
                                                    setUpdateCounter(c => c + 1);
                                                }}
                                                title="Italic"
                                            >
                                                <em>I</em>
                                            </button>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).underline ? styles.active : ''}`}
                                                onClick={() => {
                                                    const isUnderline = (activeObject as fabric.IText).underline;
                                                    (activeObject as fabric.IText).set('underline', !isUnderline);
                                                    fabricCanvas.current?.renderAll();
                                                    setUpdateCounter(c => c + 1);
                                                }}
                                                title="Underline"
                                            >
                                                <u>U</u>
                                            </button>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).linethrough ? styles.active : ''}`}
                                                onClick={() => {
                                                    const isStrike = (activeObject as fabric.IText).linethrough;
                                                    (activeObject as fabric.IText).set('linethrough', !isStrike);
                                                    fabricCanvas.current?.renderAll();
                                                    setUpdateCounter(c => c + 1);
                                                }}
                                                title="Strikethrough"
                                            >
                                                <s>S</s>
                                            </button>
                                        </div>

                                        {/* Text Alignment */}
                                        <div className={styles.formattingToolbar} style={{ marginTop: 4 }}>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).textAlign === 'left' ? styles.active : ''}`}
                                                onClick={() => { (activeObject as fabric.IText).set('textAlign', 'left'); fabricCanvas.current?.renderAll(); setUpdateCounter(c => c + 1); }}
                                                title="Align Left"
                                                style={{ fontSize: '0.7rem' }}
                                            >◧</button>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).textAlign === 'center' ? styles.active : ''}`}
                                                onClick={() => { (activeObject as fabric.IText).set('textAlign', 'center'); fabricCanvas.current?.renderAll(); setUpdateCounter(c => c + 1); }}
                                                title="Align Center"
                                                style={{ fontSize: '0.7rem' }}
                                            >◫</button>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).textAlign === 'right' ? styles.active : ''}`}
                                                onClick={() => { (activeObject as fabric.IText).set('textAlign', 'right'); fabricCanvas.current?.renderAll(); setUpdateCounter(c => c + 1); }}
                                                title="Align Right"
                                                style={{ fontSize: '0.7rem' }}
                                            >◨</button>
                                            <button
                                                className={`${styles.formatBtn} ${(activeObject as fabric.IText).textAlign === 'justify' ? styles.active : ''}`}
                                                onClick={() => { (activeObject as fabric.IText).set('textAlign', 'justify'); fabricCanvas.current?.renderAll(); setUpdateCounter(c => c + 1); }}
                                                title="Justify"
                                                style={{ fontSize: '0.7rem' }}
                                            >▣</button>
                                        </div>
                                    </div>
                                )}

                                {/* Countdown Specific */}
                                {(activeObject as any).isCountdown && (() => {
                                    const cdData = JSON.parse((activeObject as any).countdownData || '{}');
                                    const updateCountdownData = (updates: any) => {
                                        const newData = { ...cdData, ...updates };
                                        (activeObject as any).countdownData = JSON.stringify(newData);
                                        fabricCanvas.current?.renderAll();
                                        setUpdateCounter(c => c + 1);
                                    };
                                    // Convert ISO to datetime-local format
                                    const targetLocal = cdData.targetDate
                                        ? new Date(cdData.targetDate).toISOString().slice(0, 16)
                                        : '';

                                    return (
                                        <div className={styles.propertyRow} style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: 12, paddingTop: 12, borderTop: '1px solid #444' }}>
                                            <div className={styles.panelTitle} style={{ marginBottom: 8 }}>Countdown Settings</div>

                                            <div className={styles.inputGroup}>
                                                <span className={styles.label}>Target Date & Time</span>
                                                <input
                                                    type="datetime-local"
                                                    className={styles.input}
                                                    value={targetLocal}
                                                    onChange={(e) => {
                                                        const dt = new Date(e.target.value);
                                                        updateCountdownData({ targetDate: dt.toISOString() });
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginTop: 8 }}>
                                                <span className={styles.label}>Display Units</span>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
                                                    {[
                                                        { key: 'showYears', label: 'Years' },
                                                        { key: 'showMonths', label: 'Months' },
                                                        { key: 'showDays', label: 'Days' },
                                                        { key: 'showHours', label: 'Hours' },
                                                        { key: 'showMinutes', label: 'Minutes' },
                                                        { key: 'showSeconds', label: 'Seconds' },
                                                    ].map(({ key, label }) => (
                                                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#ccc', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={cdData[key] || false}
                                                                onChange={(e) => updateCountdownData({ [key]: e.target.checked })}
                                                            />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Hide Labels Option */}
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.8rem', color: '#ccc', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={cdData.hideLabels || false}
                                                    onChange={(e) => updateCountdownData({ hideLabels: e.target.checked })}
                                                />
                                                Hide unit labels (show numbers only)
                                            </label>

                                            {/* Text Formatting */}
                                            <div style={{ marginTop: 12 }}>
                                                <span className={styles.label}>Text Formatting</span>
                                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                                    <button
                                                        className={`${styles.formatBtn} ${(activeObject as fabric.IText).fontWeight === 'bold' ? styles.active : ''}`}
                                                        onClick={() => {
                                                            const isBold = (activeObject as fabric.IText).fontWeight === 'bold';
                                                            (activeObject as fabric.IText).set('fontWeight', isBold ? 'normal' : 'bold');
                                                            fabricCanvas.current?.renderAll();
                                                            setUpdateCounter(c => c + 1);
                                                        }}
                                                        title="Bold"
                                                    ><strong>B</strong></button>
                                                    <button
                                                        className={`${styles.formatBtn} ${(activeObject as fabric.IText).fontStyle === 'italic' ? styles.active : ''}`}
                                                        onClick={() => {
                                                            const isItalic = (activeObject as fabric.IText).fontStyle === 'italic';
                                                            (activeObject as fabric.IText).set('fontStyle', isItalic ? 'normal' : 'italic');
                                                            fabricCanvas.current?.renderAll();
                                                            setUpdateCounter(c => c + 1);
                                                        }}
                                                        title="Italic"
                                                    ><em>I</em></button>
                                                    <button
                                                        className={`${styles.formatBtn} ${(activeObject as fabric.IText).underline ? styles.active : ''}`}
                                                        onClick={() => {
                                                            (activeObject as fabric.IText).set('underline', !(activeObject as fabric.IText).underline);
                                                            fabricCanvas.current?.renderAll();
                                                            setUpdateCounter(c => c + 1);
                                                        }}
                                                        title="Underline"
                                                    ><u>U</u></button>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                                    <span className={styles.label}>Color</span>
                                                    <input
                                                        type="color"
                                                        className={styles.input}
                                                        style={{ padding: 0, height: 28, width: 50 }}
                                                        value={(activeObject as fabric.IText).fill as string || '#ffffff'}
                                                        onChange={(e) => { (activeObject as fabric.IText).set('fill', e.target.value); fabricCanvas.current?.renderAll(); }}
                                                    />
                                                    <span className={styles.label}>Size</span>
                                                    <input
                                                        type="number"
                                                        className={styles.input}
                                                        style={{ width: 60 }}
                                                        value={(activeObject as fabric.IText).fontSize || 80}
                                                        onChange={(e) => { (activeObject as fabric.IText).set('fontSize', Number(e.target.value)); fabricCanvas.current?.renderAll(); }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Common Transforms */}
                                <div className={styles.propertyRow}>
                                    <PropertyInput
                                        label="X"
                                        value={Math.round(activeObject.left || 0)}
                                        onChange={(val: any) => { activeObject.set('left', Number(val)); fabricCanvas.current?.renderAll(); }}
                                    />
                                    <div style={{ width: 8 }} />
                                    <PropertyInput
                                        label="Y"
                                        value={Math.round(activeObject.top || 0)}
                                        onChange={(val: any) => { activeObject.set('top', Number(val)); fabricCanvas.current?.renderAll(); }}
                                    />
                                </div>
                                <div className={styles.propertyRow}>
                                    <PropertyInput
                                        label="W"
                                        value={Math.round(activeObject.getScaledWidth())}
                                        onChange={(val: any) => {
                                            const v = Number(val);
                                            if (activeObject.type === 'image') {
                                                const scale = v / (activeObject.width || 1);
                                                activeObject.scale(scale);
                                            } else {
                                                activeObject.scaleToWidth(v);
                                            }
                                            activeObject.setCoords();
                                            fabricCanvas.current?.renderAll();
                                        }}
                                    />
                                    <div style={{ width: 8 }} />
                                    <PropertyInput
                                        label="H"
                                        value={Math.round(activeObject.getScaledHeight())}
                                        onChange={(val: any) => {
                                            const v = Number(val);
                                            if (activeObject.type === 'image') {
                                                const scale = v / (activeObject.height || 1);
                                                activeObject.scale(scale);
                                            } else {
                                                activeObject.scaleToHeight(v);
                                            }
                                            activeObject.setCoords();
                                            fabricCanvas.current?.renderAll();
                                        }}
                                    />
                                </div>
                                <div className={styles.propertyRow}>
                                    <PropertyInput
                                        label="Rotation"
                                        value={Math.round(activeObject.angle || 0)}
                                        onChange={(val: any) => { activeObject.rotate(Number(val)); fabricCanvas.current?.renderAll(); }}
                                    />
                                    <div style={{ width: 8 }} />
                                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                                        <span className={styles.label}>Opacity</span>
                                        <input
                                            type="range" min="0" max="1" step="0.1"
                                            value={activeObject.opacity || 1}
                                            onChange={(e) => { activeObject.set('opacity', Number(e.target.value)); fabricCanvas.current?.renderAll(); }}
                                        />
                                    </div>
                                </div>

                                {activeObject.type !== 'i-text' && (
                                    <div className={styles.propertyRow}>
                                        <div className={styles.inputGroup} style={{ flex: 1 }}>
                                            <span className={styles.label}>Fill</span>
                                            <input
                                                type="color" className={styles.input} style={{ padding: 0, height: 30 }}
                                                value={activeObject.fill as string || '#000000'}
                                                onChange={(e) => { activeObject.set('fill', e.target.value); fabricCanvas.current?.renderAll(); }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className={styles.propertyRow}>
                                    <div className={styles.inputGroup} style={{ width: '100%' }}>
                                        <span className={styles.label}>Blend Mode</span>
                                        <select
                                            className={styles.input}
                                            value={activeObject.globalCompositeOperation || 'source-over'}
                                            onChange={(e) => { activeObject.set('globalCompositeOperation', e.target.value); fabricCanvas.current?.renderAll(); }}
                                        >
                                            <option value="source-over">Normal</option>
                                            <option value="multiply">Multiply</option>
                                            <option value="screen">Screen</option>
                                            <option value="overlay">Overlay</option>
                                            <option value="darken">Darken</option>
                                            <option value="lighten">Lighten</option>
                                            <option value="color-dodge">Color Dodge</option>
                                            <option value="color-burn">Color Burn</option>
                                            <option value="hard-light">Hard Light</option>
                                            <option value="soft-light">Soft Light</option>
                                            <option value="difference">Difference</option>
                                            <option value="exclusion">Exclusion</option>
                                            <option value="hue">Hue</option>
                                            <option value="saturation">Saturation</option>
                                            <option value="color">Color</option>
                                            <option value="luminosity">Luminosity</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ height: 1, width: '100%', background: '#333', margin: '10px 0' }} />

                                {/* Alignment */}
                                <div className={styles.propertyRow} style={{ gap: 4 }}>
                                    <button
                                        className={styles.input}
                                        onClick={() => {
                                            if (!activeObject) return;
                                            // Manual centering based on Virtual Width (prop) rather than physical canvas width
                                            // Fabric's centerH uses viewport/canvas width which is scaled down here.
                                            const objectWidth = activeObject.getScaledWidth();
                                            const targetLeft = (width - objectWidth) / 2;
                                            // Assuming default originX='left' for most objects. 
                                            // If origin is center, logic differs, but we haven't changed defaults.
                                            // To be robust:
                                            activeObject.set({
                                                left: activeObject.originX === 'center' ? width / 2 : targetLeft
                                            });
                                            activeObject.setCoords();
                                            fabricCanvas.current?.renderAll();
                                        }}
                                        style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
                                        title="Center Horizontally"
                                    >
                                        H-Center
                                    </button>
                                    <button
                                        className={styles.input}
                                        onClick={() => {
                                            if (!activeObject) return;
                                            const objectHeight = activeObject.getScaledHeight();
                                            const targetTop = (height - objectHeight) / 2;
                                            activeObject.set({
                                                top: activeObject.originY === 'center' ? height / 2 : targetTop
                                            });
                                            activeObject.setCoords();
                                            fabricCanvas.current?.renderAll();
                                        }}
                                        style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
                                        title="Center Vertically"
                                    >
                                        V-Center
                                    </button>
                                </div>
                                <div className={styles.propertyRow} style={{ gap: 4, marginTop: 4 }}>
                                    <button className={styles.input} onClick={bringForward} style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>↑ Up</button>
                                    <button className={styles.input} onClick={sendBackwards} style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>↓ Down</button>
                                </div>

                                <div className={styles.propertyRow} style={{ marginTop: 10 }}>
                                    <button className={styles.input} onClick={deleteActive} style={{ width: '100%', background: '#7f1d1d', borderColor: '#991b1b', cursor: 'pointer' }}>
                                        🗑️ Delete Object
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                                Select an object to edit properties
                            </div>
                        )}
                    </div>
                )}

                {/* Actions (Save) */}
                <div className={styles.panelSection} style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: 10 }}>
                    <div className={styles.panelTitle}>Actions</div>
                    <button
                        className={styles.input}
                        style={{ width: '100%', cursor: 'pointer', background: '#2563eb', borderColor: '#1d4ed8' }}
                        onClick={() => {
                            if (!fabricCanvas.current) return;
                            const currentZoom = fabricCanvas.current.getZoom();
                            const currentWidth = fabricCanvas.current.getWidth();
                            const currentHeight = fabricCanvas.current.getHeight();

                            fabricCanvas.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
                            fabricCanvas.current.setDimensions({ width, height });

                            // Serialize with effects
                            const json = fabricCanvas.current.toObject(['effects', 'id', 'name']);

                            fabricCanvas.current.setZoom(currentZoom);
                            fabricCanvas.current.setDimensions({ width: currentWidth, height: currentHeight });
                            fabricCanvas.current.renderAll();

                            onSave?.(json);
                        }}
                    >
                        Save Layout
                    </button>
                </div>
            </div>

            {/* Media Modal */}
            <MediaPickerModal
                isOpen={mediaModalOpen}
                onClose={() => setMediaModalOpen(false)}
                onSelect={onSelectMedia}
                allowedTypes={['IMAGE']}
            />
        </div>
    );
});

export default AdvancedEditor;
