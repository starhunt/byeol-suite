import type { ReactNode } from 'react'

export interface IconProps {
  size?: number
}

function Svg({ size = 16, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconSend(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.2 8 13.8 2.6 11 13.4 7.6 9.6z" strokeLinejoin="round" />
      <path d="M7.6 9.6 13.8 2.6" />
    </Svg>
  )
}

export function IconStop(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.25" />
      <path
        d="M6.7 1.8h2.6l.45 1.65c.35.14.68.33.98.56l1.64-.48 1.3 2.25-1.18 1.2c.03.18.04.36.04.55s-.01.37-.04.55l1.18 1.2-1.3 2.25-1.64-.48c-.3.23-.63.42-.98.56L9.3 13.2H6.7l-.45-1.65a5.4 5.4 0 0 1-.98-.56l-1.64.48-1.3-2.25 1.18-1.2a3.8 3.8 0 0 1 0-1.1l-1.18-1.2 1.3-2.25 1.64.48c.3-.23.63-.42.98-.56z"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/** Provider-neutral Byeol Suite mark used for AI entry points. */
export function ByeolMark({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#4338CA" />
      <path
        d="M16 5.5c.9 5.9 2.6 7.6 8.5 8.5-5.9.9-7.6 2.6-8.5 8.5-.9-5.9-2.6-7.6-8.5-8.5 5.9-.9 7.6-2.6 8.5-8.5Z"
        fill="white"
      />
      <circle cx="24" cy="23.5" r="2.2" fill="#67E8F9" />
    </svg>
  )
}

/** return/enter arrow (↵) for the icon-only send button */
export function IconEnter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3.5v4a2.5 2.5 0 0 1-2.5 2.5H3.5" />
      <path d="M6.5 7 3.5 10l3 3" />
    </Svg>
  )
}
