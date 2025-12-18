'use client';

import { useEffect, useState } from 'react';
import { prisma } from '@/lib/db';

type DiagnosticsData = {
    uploadsDir: string;
    uploadsDirExists: boolean;
    uploadedFiles: Array<{ name: string; size: number }>;
    content: Array<{
        id: string;
        name: string;
        type: string;
        url: string | null;
    }>;
    compositionImages: Array<{
        contentId: string;
        contentName: string;
        src: string;
    }>;
};

type ScreenHealth = {
    id: string;
    name: string;
    space: string;
    status: 'online' | 'offline';
    lastSeen: string;
    scheduleCount: number;
    activeSchedule: { name: string; playlistName: string } | null;
};

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function DiagnosticsPage() {
    const [data, setData] = useState<DiagnosticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [screenHealth, setScreenHealth] = useState<ScreenHealth[]>([]);
    const [eventLog, setEventLog] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/diagnostics')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
                addEventLog('Diagnostics loaded successfully');
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
                addEventLog(`Error loading diagnostics: ${err.message}`);
            });

        // Poll screen health every 15 seconds
        const healthInterval = setInterval(() => {
            fetch('/api/screen-health')
                .then(res => res.json())
                .then(data => {
                    setScreenHealth(data);
                    addEventLog(`Screen health updated: ${data.length} screens monitored`);
                })
                .catch(err => {
                    addEventLog(`Error fetching screen health: ${err.message}`);
                });
        }, 15000);

        return () => clearInterval(healthInterval);
    }, []);

    const addEventLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setEventLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', fontFamily: 'monospace' }}>
                <h1>Loading diagnostics...</h1>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: '20px', fontFamily: 'monospace' }}>
                <h1 style={{ color: '#ef4444' }}>Error loading diagnostics</h1>
                <p>{error || 'Unknown error'}</p>
            </div>
        );
    }

    const { uploadsDir, uploadsDirExists, uploadedFiles, content, compositionImages } = data;
    const totalSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
    const largeFiles = uploadedFiles.filter(f => f.size > 5 * 1024 * 1024); // > 5MB

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px' }}>VenueOS Diagnostics</h1>

            {/* Real-Time Event Log */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#4ade80' }}>Real-Time Events</h2>
                <div style={{
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    padding: '15px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    border: '1px solid #333',
                }}>
                    {eventLog.length === 0 ? (
                        <div style={{ color: '#666' }}>No events yet...</div>
                    ) : (
                        eventLog.map((event, i) => (
                            <div key={i} style={{ color: '#4ade80', marginBottom: '4px' }}>
                                {event}
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Screen Health */}
            {screenHealth.length > 0 && (
                <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                    <h2 style={{ marginBottom: '15px', color: '#60a5fa' }}>Screen Health ({screenHealth.length})</h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {screenHealth.map((screen) => (
                            <div 
                                key={screen.id}
                                style={{
                                    padding: '15px',
                                    background: '#2a2a2a',
                                    borderRadius: '4px',
                                    borderLeft: `4px solid ${screen.status === 'online' ? '#4ade80' : '#ef4444'}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div>
                                        <strong>{screen.name}</strong>
                                        <div style={{ fontSize: '12px', color: '#888' }}>📍 {screen.space}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ 
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            backgroundColor: screen.status === 'online' ? '#1a5c3a' : '#5c1a1a',
                                            color: screen.status === 'online' ? '#4ade80' : '#ef4444',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                        }}>
                                            {screen.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                    Last seen: {new Date(screen.lastSeen).toLocaleTimeString()}
                                </div>
                                {screen.activeSchedule && (
                                    <div style={{ 
                                        padding: '8px',
                                        backgroundColor: '#1a3a2a',
                                        borderRadius: '3px',
                                        marginTop: '8px',
                                        borderLeft: '3px solid #4ade80'
                                    }}>
                                        <div style={{ fontSize: '12px', color: '#4ade80' }}>
                                            ▶ Now: {screen.activeSchedule.name} ({screen.activeSchedule.playlistName})
                                        </div>
                                    </div>
                                )}
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                    {screen.scheduleCount} schedule(s) configured
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* System Info */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#4ade80' }}>System Information</h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div><strong>Uploads Directory:</strong> {uploadsDir}</div>
                    <div><strong>Directory Exists:</strong> {uploadsDirExists ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Files in Uploads:</strong> {uploadedFiles.length}</div>
                    <div><strong>Total Storage Used:</strong> {formatFileSize(totalSize)}</div>
                    {largeFiles.length > 0 && (
                        <div style={{ color: '#f59e0b' }}>
                            <strong>⚠️ Large Files:</strong> {largeFiles.length} files over 5MB (may load slowly on mobile)
                        </div>
                    )}
                </div>
            </section>

            {/* Uploaded Files */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#60a5fa' }}>Uploaded Files ({uploadedFiles.length})</h2>
                {uploadedFiles.length === 0 ? (
                    <p style={{ color: '#888' }}>No files uploaded yet</p>
                ) : (
                    <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                        {uploadedFiles
                            .sort((a, b) => b.size - a.size) // Sort by size, largest first
                            .map((file, i) => {
                                const isLarge = file.size > 5 * 1024 * 1024;
                                const isHuge = file.size > 10 * 1024 * 1024;
                                return (
                                    <div 
                                        key={i} 
                                        style={{ 
                                            padding: '10px', 
                                            background: '#2a2a2a', 
                                            borderRadius: '4px',
                                            borderLeft: isHuge ? '3px solid #ef4444' : isLarge ? '3px solid #f59e0b' : '3px solid #4ade80'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div><strong>File:</strong> {file.name}</div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>
                                                    /uploads/{file.name}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontWeight: 'bold',
                                                    color: isHuge ? '#ef4444' : isLarge ? '#f59e0b' : '#4ade80'
                                                }}>
                                                    {formatFileSize(file.size)}
                                                </div>
                                                {isHuge && (
                                                    <div style={{ fontSize: '10px', color: '#ef4444' }}>
                                                        ⚠️ VERY LARGE
                                                    </div>
                                                )}
                                                {isLarge && !isHuge && (
                                                    <div style={{ fontSize: '10px', color: '#f59e0b' }}>
                                                        ⚠️ Large
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '8px' }}>
                                            <a 
                                                href={`/uploads/${file.name}`} 
                                                target="_blank" 
                                                style={{ color: '#4ade80', textDecoration: 'underline', fontSize: '12px' }}
                                            >
                                                Test Link
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </section>

            {/* Performance Warning */}
            {largeFiles.length > 0 && (
                <section style={{ marginBottom: '40px', padding: '20px', background: '#422006', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                    <h2 style={{ marginBottom: '15px', color: '#f59e0b' }}>⚠️ Performance Warning</h2>
                    <p style={{ marginBottom: '10px' }}>
                        You have {largeFiles.length} file(s) larger than 5MB. These may cause slow loading on:
                    </p>
                    <ul style={{ lineHeight: '1.8', paddingLeft: '20px', marginBottom: '15px' }}>
                        <li>Mobile devices (phones/tablets)</li>
                        <li>WiFi networks with limited bandwidth</li>
                        <li>Multiple screens loading simultaneously</li>
                    </ul>
                    <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '4px' }}>
                        <strong>Recommendations:</strong>
                        <ul style={{ marginTop: '10px', lineHeight: '1.8', paddingLeft: '20px' }}>
                            <li>Compress images before uploading (aim for under 2MB per image)</li>
                            <li>Use tools like TinyPNG, Squoosh, or Photoshop's "Save for Web"</li>
                            <li>For 1920x1080 displays, 1920px wide at 80% quality JPEG is usually sufficient</li>
                        </ul>
                    </div>
                </section>
            )}

            {/* Image/Video Content */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#f59e0b' }}>Image & Video Content ({content.filter(c => c.type === 'IMAGE' || c.type === 'VIDEO').length})</h2>
                {content.filter(c => c.type === 'IMAGE' || c.type === 'VIDEO').length === 0 ? (
                    <p style={{ color: '#888' }}>No image/video content found</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {content.filter(c => c.type === 'IMAGE' || c.type === 'VIDEO').map((item) => (
                            <div key={item.id} style={{ padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>{item.name}</strong> ({item.type})
                                </div>
                                <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
                                    <strong>URL:</strong> {item.url || 'No URL'}
                                </div>
                                {item.url && (
                                    <>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>URL Type:</strong> {
                                                item.url.startsWith('http://localhost') ? '❌ localhost (won\'t work on other devices)' :
                                                item.url.startsWith('http://') || item.url.startsWith('https://') ? '⚠️ Absolute URL' :
                                                item.url.startsWith('/') ? '✅ Relative URL (good!)' :
                                                '❓ Unknown format'
                                            }
                                        </div>
                                        {item.type === 'IMAGE' && (
                                            <div style={{ marginTop: '10px' }}>
                                                <div style={{ marginBottom: '8px' }}>Preview:</div>
                                                <img 
                                                    src={item.url} 
                                                    alt={item.name}
                                                    style={{ maxWidth: '300px', maxHeight: '200px', border: '1px solid #444' }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            const errorMsg = document.createElement('div');
                                                            errorMsg.textContent = '❌ Failed to load image';
                                                            errorMsg.style.color = '#ef4444';
                                                            errorMsg.style.padding = '10px';
                                                            parent.appendChild(errorMsg);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Composition Images */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#8b5cf6' }}>Images in Compositions ({compositionImages.length})</h2>
                {compositionImages.length === 0 ? (
                    <p style={{ color: '#888' }}>No images found in compositions</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {compositionImages.map((item, i) => (
                            <div key={i} style={{ padding: '15px', background: '#2a2a2a', borderRadius: '4px' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>Composition:</strong> {item.contentName}
                                </div>
                                <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
                                    <strong>Image URL:</strong> {item.src}
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>URL Type:</strong> {
                                        item.src.startsWith('http://localhost') ? '❌ localhost (won\'t work on other devices)' :
                                        item.src.startsWith('http://') || item.src.startsWith('https://') ? '⚠️ Absolute URL' :
                                        item.src.startsWith('data:') ? '✅ Embedded data URL' :
                                        item.src.startsWith('/') ? '✅ Relative URL (good!)' :
                                        '❓ Unknown format'
                                    }
                                </div>
                                {!item.src.startsWith('data:') && (
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ marginBottom: '8px' }}>Preview:</div>
                                        <img 
                                            src={item.src} 
                                            alt="Composition image"
                                            style={{ maxWidth: '300px', maxHeight: '200px', border: '1px solid #444' }}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    const errorMsg = document.createElement('div');
                                                    errorMsg.textContent = '❌ Failed to load image';
                                                    errorMsg.style.color = '#ef4444';
                                                    errorMsg.style.padding = '10px';
                                                    parent.appendChild(errorMsg);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Recommendations */}
            <section style={{ padding: '20px', background: '#1e1e1e', borderRadius: '8px', borderLeft: '4px solid #4ade80' }}>
                <h2 style={{ marginBottom: '15px', color: '#4ade80' }}>Best Practices</h2>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>All URLs should be <strong>relative paths</strong> starting with "/" (e.g., /uploads/image.jpg)</li>
                    <li>Keep image files under 2MB for best performance</li>
                    <li>Use JPEG for photos, PNG for graphics with transparency</li>
                    <li>For 1920x1080 screens, images don't need to be larger than 1920px wide</li>
                </ul>
            </section>

            <div style={{ marginTop: '40px', padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#888' }}>
                    💡 <strong>Tip:</strong> Access this page from other devices to verify images load correctly:<br />
                    <code style={{ color: '#4ade80' }}>http://192.168.1.123:3000/admin/diagnostics</code>
                </p>
            </div>
        </div>
    );
}
