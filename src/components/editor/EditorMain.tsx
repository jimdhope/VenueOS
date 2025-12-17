'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { EditorProvider, useEditor } from './EditorContext';
// import EditorLayout from './EditorLayout';
import AdvancedEditor, { AdvancedEditorRef } from './AdvancedEditor';
// import EditorSidebar from './EditorSidebar';
// import EditorCanvas from './EditorCanvas';
// import EditorProperties from './EditorProperties';
import CanvasSettingsModal from '../CanvasSettingsModal';
import { createContent, updateContent } from '../../app/actions/content';
import { fabric } from 'fabric';

// Inner component to access context
function EditorShell({
    contentId,
    initialData
}: {
    contentId: string;
    initialData?: any
}) {
    const { canvas } = useEditor();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const editorRef = useRef<AdvancedEditorRef>(null);

    // Initialize state if data exists
    useEffect(() => {
        if (initialData?.data) {
            try {
                const parsed = JSON.parse(initialData.data);

                // Extract Width/Height if present in the top-level of stored JSON
                if (parsed.width) setCanvasWidth(parsed.width);
                if (parsed.height) setCanvasHeight(parsed.height);

                // Check if it's the new Fabric format or old custom format
                if (parsed.fabric) {
                    if (canvas) {
                        canvas.loadFromJSON(parsed.fabric, () => {
                            canvas.renderAll();
                        });
                    }
                } else if (parsed.layers) {
                    // ... legacy migration
                }
            } catch (e) {
                console.error('Failed to parse content data', e);
            }
        }

        // Update name if valid
        if (initialData?.name) setName(initialData.name);
    }, [initialData, canvas]); // Combine effects for simplicity or keep separate? 
    // Keeping separate might be cleaner if we want to ensure canvas loading waits for canvas ref.
    // actually merging them is fine or just updating the existing one.

    // The previous effect (lines 56-60) was checking initialData.width which doesn't exist on the db record.
    // I'll remove that effect effectively by replacing this block.

    const [name, setName] = useState(initialData?.name || 'New Composition');
    const [isEditingName, setIsEditingName] = useState(false);

    // Canvas dimensions state
    const [canvasWidth, setCanvasWidth] = useState(initialData?.width || 1920);
    const [canvasHeight, setCanvasHeight] = useState(initialData?.height || 1080);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Effects State
    const [effect, setEffect] = useState<'none' | 'snow' | 'rain'>('none');

    // Load Effect from initial data
    useEffect(() => {
        if (initialData?.data) {
            try {
                const parsed = JSON.parse(initialData.data);
                if (parsed.meta?.effect) setEffect(parsed.meta.effect);
            } catch (e) {
                // Ignore
            }
        }
    }, [initialData]);

    const handleSaveTrigger = async () => {
        if (editorRef.current) {
            editorRef.current.triggerSave();
        }
    };

    const handleEditorSave = async (fabricJson: any) => {
        setSaving(true);
        const payload = JSON.stringify({
            width: canvasWidth,
            height: canvasHeight,
            meta: { effect },
            fabric: fabricJson
        });

        const formData = new FormData();
        formData.append('name', name);
        formData.append('type', 'COMPOSITION');
        formData.append('data', payload);
        formData.append('duration', '30');

        try {
            if (contentId === 'new') {
                const result = await createContent(null, formData);
                if (result?.success) {
                    alert('Saved!');
                    router.push('/admin/layouts');
                } else {
                    alert('Error: ' + result?.message);
                }
            } else {
                const result = await updateContent(contentId, null, formData);
                if (result?.success) {
                    alert('Saved!');
                    router.push('/admin/layouts');
                } else {
                    alert('Error: ' + result?.message);
                }
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };


    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                height: '60px',
                background: '#18181b',
                borderBottom: '1px solid #27272a',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>← Back</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEditingName ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingName(false);
                                }}
                                onFocus={(e) => e.target.select()}
                                autoFocus
                                style={{
                                    fontSize: '1.2rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid #555',
                                    color: '#fff',
                                    outline: 'none',
                                    padding: '0',
                                    width: '300px'
                                }}
                            />
                        ) : (
                            <h1
                                onClick={() => setIsEditingName(true)}
                                style={{
                                    fontSize: '1.2rem',
                                    margin: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid transparent'
                                }}
                                title="Click to rename"
                            >
                                {name} <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '4px' }}>✎</span>
                            </h1>
                        )}
                        <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
                            {canvasWidth}x{canvasHeight}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                    <select
                        value={effect}
                        onChange={(e) => setEffect(e.target.value as any)}
                        style={{
                            background: '#27272a', color: '#fff', border: '1px solid #3f3f46',
                            padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'
                        }}
                    >
                        <option value="none">No Effect</option>
                        <option value="snow">❄️ Snow</option>
                        <option value="rain">🌧️ Rain</option>
                    </select>

                    <button
                        className="btn"
                        onClick={() => setIsSettingsOpen(true)}
                        style={{ background: '#27272a', color: '#fff' }}
                    >
                        Canvas Settings
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSaveTrigger}
                        disabled={saving}
                        style={{ marginLeft: 10, padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? 'Saving...' : 'Save Composition'}
                    </button>
                </div>
            </header>
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                <AdvancedEditor
                    ref={editorRef}
                    initialData={initialData?.data ? JSON.parse(initialData.data)?.fabric : null}
                    width={canvasWidth}
                    height={canvasHeight}
                    effect={effect}
                    onSave={handleEditorSave}
                />
            </div>

            {isSettingsOpen && (
                <CanvasSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    currentWidth={canvasWidth}
                    currentHeight={canvasHeight}
                    onApply={(w, h) => {
                        setCanvasWidth(w);
                        setCanvasHeight(h);
                    }}
                />
            )}
        </div>
    );

}

export default function EditorMain({ contentId, initialData }: { contentId: string; initialData?: any }) {
    return (
        <EditorProvider>
            <EditorShell contentId={contentId} initialData={initialData} />
        </EditorProvider>
    );
}