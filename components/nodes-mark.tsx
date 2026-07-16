export function NodesMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
    >
      <path
        d="M13 14.5 24 24m0 0 11-9.5M24 24l11 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13.5" r="6" fill="currentColor" />
      <circle cx="36" cy="13.5" r="6" fill="currentColor" />
      <circle cx="36" cy="35" r="6" fill="currentColor" />
      <circle
        cx="24"
        cy="24"
        r="6"
        fill="white"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
