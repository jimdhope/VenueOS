'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';

export default function AdminClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={styles.layout}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main className={collapsed ? styles.mainCollapsed : styles.main}>
                {children}
            </main>
        </div>
    );
}
