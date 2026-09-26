import type { SVGProps } from 'react';

type IconName = 'plus' | 'close' | 'chevronDown' | 'chevronUp' | 'share' | 'locate' | 'pin' | 'check';

const PATHS: Record<IconName, string> = {
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M6 15l6-6 6 6',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  check: 'M5 12l5 5L20 7',
};

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

// 아이콘 라이브러리 대신 필요한 8개만 인라인 SVG로 둔다. 번들 130KB 절감.
export const Icon = ({ name, size = 18, ...rest }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    <path d={PATHS[name]} />
  </svg>
);
