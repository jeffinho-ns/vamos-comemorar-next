/** Ilustrações SVG discretas para o Ideia RH (inline, sem assets externos). */

type Props = { className?: string };

export function IriHeroMark({ className = "h-16 w-16" }: Props) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="12" width="52" height="56" rx="6" fill="#f0fdfa" stroke="#0d9488" strokeWidth="2" />
      <path d="M20 28h28M20 38h22M20 48h18" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="58" cy="22" r="14" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
      <path
        d="M52 22h12M58 16v12"
        stroke="#4f46e5"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IriNotebookIllustration({ className = "h-28 w-28" }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="28" y="18" width="64" height="84" rx="5" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="28" y="18" width="10" height="84" rx="2" fill="#ccfbf1" stroke="#99f6e4" strokeWidth="1" />
      <path d="M48 40h34M48 52h28M48 64h32M48 76h20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="88" cy="88" r="18" fill="#eef2ff" stroke="#6366f1" strokeWidth="2" />
      <path d="M82 88h12M88 82v12" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IriTeamIllustration({ className = "h-28 w-28" }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="38" r="12" fill="#f0fdfa" stroke="#0d9488" strokeWidth="2" />
      <circle cx="80" cy="38" r="12" fill="#eef2ff" stroke="#6366f1" strokeWidth="2" />
      <circle cx="60" cy="52" r="14" fill="#fff" stroke="#64748b" strokeWidth="2" />
      <path
        d="M22 96c4-16 14-24 28-24s24 8 28 24"
        stroke="#0d9488"
        strokeWidth="2"
        strokeLinecap="round"
        fill="#f0fdfa"
      />
      <path
        d="M48 96c2-10 8-16 18-16s16 6 18 16"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="#eef2ff"
      />
      <path
        d="M38 96c3-12 10-20 22-20s19 8 22 20"
        stroke="#64748b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="#f8fafc"
      />
    </svg>
  );
}

export function IriHouseIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 48 L50 18 L82 48 V84 H18 Z"
        fill="#f8fafc"
        stroke="#64748b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="42" y="58" width="16" height="26" rx="2" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" />
      <rect x="28" y="52" width="12" height="12" rx="1.5" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
      <rect x="60" y="52" width="12" height="12" rx="1.5" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
    </svg>
  );
}
