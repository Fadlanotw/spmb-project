'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminShell.module.css';

const svg = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

function Icon({ name, size = 16 }) {
  const p = { ...svg, width: size, height: size };
  switch (name) {
    case 'grid': return (<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>);
    case 'users': return (<svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    case 'file': return (<svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></svg>);
    case 'calendar': return (<svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
    case 'clipboard': return (<svg {...p}><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4.5h6a1.5 1.5 0 0 0-3-0 1.5 1.5 0 0 0-3 0ZM9 12h6M9 16h6" /></svg>);
    case 'megaphone': return (<svg {...p}><path d="M9.26 9.26 3 11v3l14.14 3.14" /><path d="M21 15.34V6l-7.31 2.63" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /><path d="m2 2 20 20" /></svg>);
    case 'payment': return (<svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h3" /></svg>);
    case 'settings': return (<svg {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>);
    case 'bell': return (<svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>);
    default: return (<svg {...p}><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" /></svg>); // perisai
  }
}

const NAV = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { href: '/dashboard/admin/data-pendaftar', label: 'Data Pendaftar', icon: 'users' },
  { href: '/dashboard/admin/verifikasi-berkas', label: 'Verifikasi Berkas', icon: 'file' },
  { href: '/dashboard/admin/jadwal-tes', label: 'Jadwal Tes', icon: 'calendar' },
  { href: '/dashboard/admin/soal-ujian', label: 'Soal Ujian', icon: 'clipboard' },
  { href: '/dashboard/admin/pengumuman', label: 'Pengumuman', icon: 'megaphone' },
  { href: '/dashboard/admin/tagihan', label: 'Tagihan Pembayaran', icon: 'payment' },
  { href: '/dashboard/admin/pengaturan', label: 'Pengaturan', icon: 'settings' },
  { href: '/dashboard/admin/akun', label: 'Kelola Akun', icon: 'users' },
];

// Foto dengan cadangan: kalau file gambar tidak ditemukan, tampilkan inisial / perisai.
function Photo({ src, alt, className, style, fallback }) {
  const [broken, setBroken] = useState(!src);
  if (broken) return fallback;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} onError={() => setBroken(true)} />;
}

export default function AdminShell({
  children,
  breadcrumb = 'Dashboard',
  logoSrc = '/avatars/logo.png',             // logo Garuda Utama (public/avatars/logo.png)
  avatarSrc = '/avatar-cowo.jpg',            // file di folder public
  namaAdmin = 'MUHAMMAD FADLAN SABANI',
  peranAdmin = 'Super Administrator',
  namaSidebar = 'MR. SABANI',
  peranSidebar = 'Kepala Admin SPMB',
}) {
  const pathname = usePathname();
  const isActive = (n) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + '/'));
  const initials = (s) => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.navGroup}>
          <div className={styles.brand}>
            <span className={styles.crest}>
              <Photo
                src={logoSrc}
                alt="Logo Garuda Utama"
                style={{ width: 40, height: 40, objectFit: 'contain', display: 'block' }}
                fallback={<Icon name="shield" size={34} />}
              />
            </span>
            <div className={styles.brandText}>
              <span className={styles.brandName}>GARUDA UTAMA</span>
              <span className={styles.brandSub}>SPMB ADMIN</span>
            </div>
          </div>

          <nav className={styles.nav} aria-label="Menu admin">
            {NAV.map((n) => {
              const on = isActive(n);
              return (
                <Link key={n.href} href={n.href} className={`${styles.item} ${on ? styles.active : ''}`} aria-current={on ? 'page' : undefined}>
                  <span className={styles.itemIcon}><Icon name={n.icon} /></span>
                  <span className={styles.itemLabel}>{n.label}</span>
                  {on && <span className={styles.bar} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.sideFoot}>
          <Photo src={avatarSrc} alt={namaSidebar} className={styles.sideAvatar}
            fallback={<span className={`${styles.initials} ${styles.sideAvatar}`}>{initials(namaSidebar)}</span>} />
          <div className={styles.sideText}>
            <div className={styles.sideName}>{namaSidebar}</div>
            <div className={styles.sideRole}>{peranSidebar}</div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumbs}>
            <span>SPMB Portal</span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbNow}>{breadcrumb}</span>
          </div>
          <div className={styles.right}>
            <button type="button" className={styles.bell} aria-label="Notifikasi"><Icon name="bell" /></button>
            <span className={styles.vline} />
            <div className={styles.who}>
              <div className={styles.whoText}>
                <span className={styles.whoName}>{namaAdmin}</span>
                <span className={styles.whoRole}>{peranAdmin}</span>
              </div>
              <Photo src={avatarSrc} alt={namaAdmin} className={styles.topAvatar}
                fallback={<span className={`${styles.initials} ${styles.topAvatar}`}>{initials(namaAdmin)}</span>} />
            </div>
          </div>
        </header>
        <main className={styles.workspace}>{children}</main>
      </div>
    </div>
  );
}