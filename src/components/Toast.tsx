'use client';

import { useState, useEffect } from 'react';
import styles from './toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
};

type ToastContextType = {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number, action?: Toast['action']) => void;
    removeToast: (id: string) => void;
};

import React from 'react';

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType, duration = 3000, action?: Toast['action']) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, message, type, duration, action };
        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <div className={styles.container}>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    return (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
            <div className={styles.content}>
                <span>{toast.message}</span>
                {toast.action && (
                    <button
                        className={styles.actionBtn}
                        onClick={() => {
                            toast.action?.onClick();
                            onRemove(toast.id);
                        }}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                className={styles.closeBtn}
                onClick={() => onRemove(toast.id)}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );
}
