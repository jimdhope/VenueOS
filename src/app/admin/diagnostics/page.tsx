'use client';

import { useEffect, useState } from 'react';

type DiagnosticsData = {
    uploadsDir: string;
    uploadsDirExists: boolean;
    uploadedFiles: string[];
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

export default function DiagnosticsPage() {
    const [data, setData] = useState<DiagnosticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/diagnostics')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

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

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px' }}>VenueOS Diagnostics</h1>

            {/* System Info */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#4ade80' }}>System Information</h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div><strong>Uploads Directory:</strong> {uploadsDir}</div>
                    <div><strong>Directory Exists:</strong> {uploadsDirExists ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Files in Uploads:</strong> {uploadedFiles.length}</div>
                </div>
            </section>

            {/* Uploaded Files */}
            <section style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px', color: '#60a5fa' }}>Uploaded Files ({uploadedFiles.length})</h2>
                {uploadedFiles.length === 0 ? (
                    <p style={{ color: '#888' }}>No files uploaded yet</p>
                ) : (
                    <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                        {uploadedFiles.map((file, i) => (
                            <div key={i} style={{ padding: '10px', background: '#2a2a2a', borderRadius: '4px' }}>
                                <div><strong>File:</strong> {file}</div>
                                <div><strong>Path:</strong> /uploads/{file}</div>
                                <div style={{ marginTop: '8px' }}>
                                    <a 
                                        href={`/uploads/${file}`} 
                                        target="_blank" 
                                        style={{ color: '#4ade80', textDecoration: 'underline' }}
                                    >
                                        Test Link (click to test)
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

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
                <h2 style={{ marginBottom: '15px', color: '#4ade80' }}>Recommendations</h2>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>All URLs should be <strong>relative paths</strong> starting with "/" (e.g., /uploads/image.jpg)</li>
                    <li>Avoid absolute URLs with "localhost" - they won't work on other devices</li>
                    <li>If you see "localhost" URLs, you'll need to re-upload those images or recreate compositions</li>
                    <li>Images embedded as data URLs (data:image/...) will work but increase database size</li>
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
