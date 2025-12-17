'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sidebar.module.css';
import { Icons } from './Icons';

const navItems = [
  { label: 'Overview', path: '/admin', icon: 'Overview' },
  { label: 'Venues', path: '/admin/venues', icon: 'Venues' },
  { label: 'Spaces', path: '/admin/spaces', icon: 'Spaces' },
  { label: 'Screens', path: '/admin/screens', icon: 'Screens' },
  { label: 'Timecodes', path: '/admin/timecodes', icon: 'Timecodes' },
  { label: 'Layouts', path: '/admin/layouts', icon: 'Layouts' },
  { label: 'Media', path: '/admin/media', icon: 'Media' },
  { label: 'Playlists', path: '/admin/playlists', icon: 'Playlists' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <button
        onClick={onToggle}
        className={styles.toggleBtn}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
      </button>

      <div className={styles.logo}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Logo />
          <h1 className={styles.logoText} style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s', width: collapsed ? 0 : 'auto', overflow: 'hidden' }}>
            VenueOS
          </h1>
        </div>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const IconComponent = (Icons as any)[item.icon];

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : ''}
            >
              <div className={styles.iconWrapper}>
                {IconComponent && <IconComponent />}
              </div>
              <span className={styles.linkLabel} style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.user}>
        <div className={styles.avatar}>J</div>
        <div className={styles.info} style={{ opacity: collapsed ? 0 : 1 }}>
          <p className={styles.name}>Jim</p>
          <p className={styles.role}>Admin</p>
        </div>
      </div>
    </aside>
  );
}
