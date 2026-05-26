import React from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'refresh'
  | 'x'
  | 'shield-check'
  | 'shield-alert'
  | 'sidebar'
  | 'settings'
  | 'plus'
  | 'globe'
  | 'chevron-left'
  | 'chevron-down'
  | 'clock'
  | 'note'
  | 'bookmark'
  | 'cloud'
  | 'rss'
  | 'checklist'
  | 'timer'
  | 'calculator'
  | 'trash'
  | 'sparkles'
  | 'palette'
  | 'lock'
  | 'search'
  | 'user'
  | 'info'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'layout'
  | 'bolt'
  | 'history'
  | 'download'
  | 'folder'
  | 'launch';

interface AppIconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const iconPaths: Record<IconName, React.ReactNode> = {
  'arrow-left': <path d="M15 18l-6-6 6-6M21 12H9" />,
  'arrow-right': <path d="M9 6l6 6-6 6M3 12h12" />,
  refresh: (
    <>
      <path d="M20 5v5h-5" />
      <path d="M20 10a8 8 0 1 0 2.34 5.66" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
  'shield-check': (
    <>
      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8 3.7-3.7" />
    </>
  ),
  'shield-alert': (
    <>
      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
  sidebar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  settings: (
    <>
      <path d="M12 3v3M12 18v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M3 12h3M18 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  note: (
    <>
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  bookmark: (
    <>
      <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18a4 4 0 1 1 .6-7.96A5.5 5.5 0 0 1 18 11a3.5 3.5 0 1 1-.5 7H7Z" />
    </>
  ),
  rss: (
    <>
      <path d="M5 19h.01" />
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
    </>
  ),
  checklist: (
    <>
      <path d="m9 6 1.5 1.5L13 5" />
      <path d="m9 12 1.5 1.5L13 11" />
      <path d="m9 18 1.5 1.5L13 17" />
      <path d="M15 6h4M15 12h4M15 18h4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13 16 9M9 2h6M12 2v3" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m8 7 1 13h6l1-13" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18h1.2a2.3 2.3 0 0 0 0-4.6H12a3 3 0 0 1 0-6h6A6.4 6.4 0 0 0 12 3Z" />
      <path d="M7.5 10h.01M9.5 6.5h.01M14.5 6.5h.01M16.5 10h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </>
  ),
  minimize: <path d="M6 12h12" />,
  maximize: <rect x="5" y="5" width="14" height="14" rx="2" />,
  restore: (
    <>
      <path d="M8 8V5h11v11h-3" />
      <rect x="5" y="8" width="11" height="11" rx="2" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M10 10v10" />
    </>
  ),
  bolt: <path d="m13 2-7 11h5l-1 9 8-12h-5l0-8Z" />,
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z" />
    </>
  ),
  launch: (
    <>
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </>
  ),
};

const AppIcon: React.FC<AppIconProps> = ({ name, size = 16, strokeWidth = 1.85, className }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {iconPaths[name]}
  </svg>
);

export default AppIcon;
