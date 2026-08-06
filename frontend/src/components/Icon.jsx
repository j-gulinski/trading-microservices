const PATHS = {
  arrowRight: 'M5 12h14m-5-5 5 5-5 5',
  chevronDown: 'm7 10 5 5 5-5',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  chevronUp: 'm7 14 5-5 5 5',
  close: 'M6 6l12 12M18 6 6 18',
  sort: 'm8 8 4-4 4 4m0 8-4 4-4-4',
  sortAsc: 'm7 14 5-5 5 5',
  sortDesc: 'm7 10 5 5 5-5',
}

function Grip() {
  return (
    <>
      <circle cx="9" cy="7" r="1" />
      <circle cx="15" cy="7" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="17" r="1" />
      <circle cx="15" cy="17" r="1" />
    </>
  )
}

export default function Icon({ name, className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={name === 'grip' ? 'currentColor' : 'none'}
      stroke={name === 'grip' ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'grip' ? <Grip /> : <path d={PATHS[name]} />}
    </svg>
  )
}
