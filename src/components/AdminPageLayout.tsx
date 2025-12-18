import React from 'react';
import styles from './admin-page-layout.module.css';

type AdminPageLayoutProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export default function AdminPageLayout({ title, children, actions }: AdminPageLayoutProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
