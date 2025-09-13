export const UserIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="opacity-70 fill-none stroke-current text-zinc-500"
  >
    <path d="M20 21a8 8 0 0 0-16 0" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
  </svg>
);

export const MailIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="opacity-70 fill-none stroke-current text-zinc-500"
  >
    <path d="M4 7l8 5 8-5" strokeWidth="1.5" />
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="1.5" />
  </svg>
);

export const MessageIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="opacity-70 fill-none stroke-current text-zinc-500"
  >
    <path
      d="M21 15a4 4 0 0 1-4 4H8l-5 3V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7z"
      strokeWidth="1.5"
    />
  </svg>
);

export const LockIcon = (
 <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  className="opacity-70 fill-none stroke-current text-zinc-500"
>
  <path
    d="M8 10V7a4 4 0 1 1 8 0v3m-8 0h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
)


export const EyeIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="opacity-70 fill-none stroke-current text-zinc-500"
  >
    <path
      d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
    />
  </svg>
);

export const ShieldIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="opacity-70 fill-none stroke-current text-zinc-500"
  >
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function GoogleMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 31.9 29.4 35 24 35c-7 0-12.7-5.7-12.7-12.7S17 9.6 24 9.6c3.2 0 6.2 1.2 8.4 3.2l5.6-5.6C34.4 3.8 29.5 2 24 2 12.4 2 3 11.4 3 23s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.1-.1-2.1-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 12.6 24 12.6c3.2 0 6.2 1.2 8.4 3.2l5.6-5.6C34.4 6.8 29.5 5 24 5 16 5 9.2 9.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 41c5.3 0 9.7-1.7 12.9-4.7l-6-4.9C29 32.4 26.7 33.4 24 33.4c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5C9 36.4 15.9 41 24 41z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3.1-3.4 5.7-6.4 7.4l6 4.9C38.7 37.2 41 31.9 41 25c0-1.6-.2-3.1-.6-4.5z"/>
    </svg>
  );
}