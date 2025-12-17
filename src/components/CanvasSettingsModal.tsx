'use client';

import { useState } from 'react';
import styles from './styles.module.css'; // We'll need to ensure styles exist or use inline/existing

interface CanvasSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (width: number, height: number) => void;
    currentWidth: number;
    currentHeight: number;
}

export default function CanvasSettingsModal({ isOpen, onClose, onApply, currentWidth, currentHeight }: CanvasSettingsModalProps) {
    const [width, setWidth] = useState(currentWidth);
    const [height, setHeight] = useState(currentHeight);
    const [mode, setMode] = useState<'custom' | 'matrix'>('custom');
    const [rows, setRows] = useState(1);
    const [cols, setCols] = useState(2);

    const [baseRes, setBaseRes] = useState<'1080p' | '4k'>('1080p');

    if (!isOpen) return null;

    const handleApply = () => {
        if (mode === 'matrix') {
            const baseW = baseRes === '1080p' ? 1920 : 3840;
            const baseH = baseRes === '1080p' ? 1080 : 2160;
            onApply(cols * baseW, rows * baseH);
        } else {
            onApply(width, height);
        }
        onClose();
    };

    const presets = [
        { label: 'Full HD (1920x1080)', w: 1920, h: 1080 },
        { label: '4K UHD (3840x2160)', w: 3840, h: 2160 },
        { label: 'Portrait HD (1080x1920)', w: 1080, h: 1920 },
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: '#18181b', padding: '24px', borderRadius: '8px',
                width: '400px', border: '1px solid #27272a', color: '#fff'
            }}>
                <h2 style={{ margin: '0 0 20px 0' }}>Canvas Settings</h2>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={() => setMode('custom')}
                        style={{
                            flex: 1, padding: '8px',
                            background: mode === 'custom' ? '#2563eb' : '#27272a',
                            border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px'
                        }}
                    >
                        Resolution
                    </button>
                    <button
                        onClick={() => setMode('matrix')}
                        style={{
                            flex: 1, padding: '8px',
                            background: mode === 'matrix' ? '#2563eb' : '#27272a',
                            border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px'
                        }}
                    >
                        Matrix (Video Wall)
                    </button>
                </div>

                {mode === 'custom' ? (
                    <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Width</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #444', color: '#fff' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Height</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #444', color: '#fff' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {presets.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => { setWidth(p.w); setHeight(p.h); }}
                                    style={{
                                        fontSize: '0.8rem', padding: '4px 8px',
                                        background: '#27272a', border: '1px solid #3f3f46',
                                        color: '#ccc', cursor: 'pointer', borderRadius: '4px'
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '16px' }}>
                            Calculate total resolution based on screen grid.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Screen Type</label>
                            <select
                                value={baseRes}
                                onChange={(e) => setBaseRes(e.target.value as '1080p' | '4k')}
                                style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                            >
                                <option value="1080p">Full HD (1920 x 1080)</option>
                                <option value="4k">4K UHD (3840 x 2160)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Columns (Width)</label>
                                <input
                                    type="number" min="1"
                                    value={cols}
                                    onChange={(e) => setCols(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #444', color: '#fff' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>Rows (Height)</label>
                                <input
                                    type="number" min="1"
                                    value={rows}
                                    onChange={(e) => setRows(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #444', color: '#fff' }}
                                />
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', background: '#27272a', borderRadius: '4px', marginTop: '10px' }}>
                            Total: <strong>{cols * (baseRes === '1080p' ? 1920 : 3840)} x {rows * (baseRes === '1080p' ? 1080 : 2160)}</strong>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={handleApply} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '4px' }}>
                        Apply Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
