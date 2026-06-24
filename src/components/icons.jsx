// Lightweight inline SVG icon set (no icon dependency).
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const make = (paths) =>
  function Icon({ size, className = '', ...props }) {
    return (
      <svg {...base} width={size || base.width} height={size || base.height} className={className} {...props}>
        {paths}
      </svg>
    )
  }

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
)
export const KeyIcon = make(
  <>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 9.3-9.3M16 3l3 3M14 5l3 3" />
  </>,
)
export const UsersIcon = make(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
  </>,
)
export const BookmarkIcon = make(<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />)
export const BookmarkFilledIcon = ({ size, className = '', ...props }) => (
  <svg {...base} width={size || 18} height={size || 18} fill="currentColor" className={className} {...props}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
export const DownloadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </>,
)
export const XIcon = make(<path d="M18 6 6 18M6 6l12 12" />)
export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </>,
)
export const StarIcon = ({ size = 16, className = '', filled = false, ...props }) => (
  <svg {...base} width={size} height={size} fill={filled ? 'currentColor' : 'none'} className={className} {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </svg>
)
export const MenuIcon = make(<path d="M3 12h18M3 6h18M3 18h18" />)
export const TrashIcon = make(
  <>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </>,
)
export const ExternalIcon = make(
  <>
    <path d="M15 3h6v6M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>,
)
export const TrendUpIcon = make(<path d="M3 17l6-6 4 4 8-8M21 7v6h-6" />)
export const TrendDownIcon = make(<path d="M3 7l6 6 4-4 8 8M21 17v-6h-6" />)
export const TrendFlatIcon = make(<path d="M4 12h16" />)
export const SparkIcon = make(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" />
  </>,
)
export const ChartIcon = make(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 3 3 5-6" />
  </>,
)
export const GridIcon = make(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>,
)
export const BoardIcon = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M15 3v18" />
  </>,
)
export const FlameIcon = make(
  <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 9 11 11 11c0-2-1-3 1-5 .8 1.5 2 2 2 4M12 22a6 6 0 0 1-6-6c0-1.5.5-2.5 1-3" />
)
export const ShieldIcon = make(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </>,
)
