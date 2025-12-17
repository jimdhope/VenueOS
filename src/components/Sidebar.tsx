'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sidebar.module.css';

const navItems = [
  { label: 'Overview', path: '/admin' },
  { label: 'Venues', path: '/admin/venues' },
  { label: 'Spaces', path: '/admin/spaces' },
  { label: 'Screens', path: '/admin/screens' },
  { label: 'Timecodes', path: '/admin/timecodes' },
  { label: 'Layouts', path: '/admin/layouts' },
  { label: 'Media', path: '/admin/media' },
  { label: 'Playlists', path: '/admin/playlists' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>VenueOS</h1>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.user}>
        <div className={styles.avatar}>J</div>
        <div className={styles.info}>
          <p className={styles.name}>Jim</p>
          <p className={styles.role}>Admin</p>
        </div>
      </div>
    </aside>
  );
}
