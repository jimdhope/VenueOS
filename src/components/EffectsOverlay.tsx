'use client';

import { useEffect, useState } from 'react';
import styles from './EffectsOverlay.module.css';

interface EffectsOverlayProps {
    effect: 'none' | 'snow' | 'rain';
}

export default function EffectsOverlay({ effect }: EffectsOverlayProps) {
    if (effect === 'none') return null;

    // We can use CSS only for snow for performance
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 1000 }}>
            {effect === 'snow' && (
                <div className={styles.snowContainer}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className={styles.snowflake} style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                            opacity: Math.random()
                        }}>❄</div>
                    ))}
                </div>
            )}
            {effect === 'rain' && (
                <div className={styles.rainContainer}>
                    {[...Array(100)].map((_, i) => (
                        <div key={i} className={styles.raindrop} style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${0.5 + Math.random() * 0.5}s`
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
}
