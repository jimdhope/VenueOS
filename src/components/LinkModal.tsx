'use client';

import { useState } from 'react';
import styles from './modal.module.css';

type LinkModalProps = {
    isOpen: boolean;
    onClose: () => void;
    screenName: string;
    url: string;
};

export default function LinkModal({ isOpen, onClose, screenName, url }: LinkModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy API key: ', err);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.linkModal}`}>
                <div className={styles.header}>
                    <h2>Player Link: {screenName}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.formGroup}>
                    <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
                        Enter this URL on your screen's browser:
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            readOnly
                            value={url}
                            className={styles.input}
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                            onClick={handleCopy}
                            className="btn btn-primary"
                            style={{ minWidth: '100px' }}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className="btn">Close</button>
                </div>
            </div>
        </div>
    );
}
