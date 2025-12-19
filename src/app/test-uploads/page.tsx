'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Test Uploads",
};

export default function TestUploadsPage() {
    const [testResults, setTestResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const runTests = async () => {
            const results = [];

            // Test 1: Can we fetch the diagnostics API?
            try {
                const res = await fetch('/api/diagnostics');
                const data = await res.json();
                results.push({
                    test: 'Fetch Diagnostics API',
                    status: res.ok ? 'PASS' : 'FAIL',
                    details: `${data.uploadedFiles?.length || 0} files found`
                });
            } catch (e) {
                results.push({
                    test: 'Fetch Diagnostics API',
                    status: 'FAIL',
                    details: String(e)
                });
            }

            // Test 2: Try to load a specific image
            const testImage = '1766004262561-sneak_peak.jpg';
            try {
                const res = await fetch(`/uploads/${testImage}`);
                results.push({
                    test: `Fetch /uploads/${testImage}`,
                    status: res.ok ? 'PASS' : 'FAIL',
                    details: `Status: ${res.status} ${res.statusText}, Content-Type: ${res.headers.get('content-type')}`
                });
            } catch (e) {
                results.push({
                    test: `Fetch /uploads/${testImage}`,
                    status: 'FAIL',
                    details: String(e)
                });
            }

            // Test 3: Get list of files from diagnostics
            try {
                const res = await fetch('/api/diagnostics');
                const data = await res.json();
                if (data.uploadedFiles && data.uploadedFiles.length > 0) {
                    results.push({
                        test: 'Uploaded Files List',
                        status: 'INFO',
                        details: data.uploadedFiles.join(', ')
                    });
                }
            } catch (e) {
                // ignore
            }

            setTestResults(results);
            setLoading(false);
        };

        runTests();
    }, []);

    return (
        <div style={{ 
            padding: '20px', 
            fontFamily: 'monospace',
            maxWidth: '1000px',
            margin: '0 auto',
            backgroundColor: '#000',
            minHeight: '100vh',
            color: '#fff'
        }}>
            <h1>Upload Files Test Page</h1>
            <p style={{ color: '#888', marginBottom: '30px' }}>
                Current URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
            </p>

            {loading ? (
                <p>Running tests...</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {testResults.map((result, i) => (
                        <div 
                            key={i}
                            style={{
                                padding: '15px',
                                backgroundColor: '#1a1a1a',
                                borderLeft: `4px solid ${
                                    result.status === 'PASS' ? '#4ade80' :
                                    result.status === 'FAIL' ? '#ef4444' :
                                    '#60a5fa'
                                }`,
                                borderRadius: '4px'
                            }}
                        >
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginBottom: '8px'
                            }}>
                                <strong>{result.test}</strong>
                                <span style={{
                                    color: result.status === 'PASS' ? '#4ade80' :
                                           result.status === 'FAIL' ? '#ef4444' :
                                           '#60a5fa'
                                }}>
                                    {result.status}
                                </span>
                            </div>
                            <div style={{ fontSize: '14px', color: '#aaa' }}>
                                {result.details}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '15px' }}>Test Image</h2>
                <p style={{ marginBottom: '10px', color: '#888' }}>If the image below loads, uploads are working:</p>
                <img 
                    src="/uploads/1766004262561-sneak_peak.jpg"
                    alt="Test"
                    style={{ 
                        maxWidth: '100%', 
                        border: '2px solid #333',
                        borderRadius: '4px'
                    }}
                    onLoad={() => console.log('✅ Image loaded successfully')}
                    onError={(e) => {
                        console.error('❌ Image failed to load');
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            const errorMsg = document.createElement('div');
                            errorMsg.textContent = '❌ Failed to load image';
                            errorMsg.style.color = '#ef4444';
                            errorMsg.style.padding = '20px';
                            errorMsg.style.border = '2px solid #ef4444';
                            errorMsg.style.borderRadius = '4px';
                            parent.appendChild(errorMsg);
                        }
                    }}
                />
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1e3a8a', borderRadius: '8px' }}>
                <strong>📱 Testing from iPhone?</strong>
                <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                    Make sure you're accessing: <code style={{ color: '#fbbf24' }}>http://192.168.1.123:3000/test-uploads</code>
                </p>
            </div>
        </div>
    );
}
