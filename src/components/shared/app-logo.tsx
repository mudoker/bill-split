import type { SVGProps } from 'react';

interface AppLogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export function AppLogo({ className = "w-6 h-6", ...props }: AppLogoProps) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      {...props}
    >
      <g
        transform="translate(0, 512) scale(0.1, -0.1)"
        fill="currentColor"
        stroke="none"
      >
        <path d="M1188 4671 c-167 -54 -300 -209 -327 -381 -7 -40 -11 -305 -11 -682 l0 -618 160 0 160 0 0 623 0 623 23 44 c12 25 37 55 56 67 l34 23 1277 0 1277 0 33 -23 c19 -12 43 -38 54 -57 21 -34 21 -50 24 -667 l3 -633 159 0 160 0 0 618 c0 377 -4 642 -11 682 -27 174 -161 329 -330 381 -58 18 -112 19 -1372 18 -1244 0 -1315 -1 -1369 -18z" />
        <path d="M512 2753 c-49 -24 -75 -68 -80 -132 -5 -70 22 -115 88 -148 l44 -23 1996 0 1996 0 44 23 c66 33 93 78 88 148 -5 65 -32 109 -82 133 -31 15 -210 16 -2048 16 -1834 0 -2016 -2 -2046 -17z" />
        <path d="M850 1613 c0 -694 2 -712 62 -825 65 -122 188 -214 325 -243 101 -22 2545 -22 2646 0 137 29 260 121 325 243 60 113 62 131 62 825 l0 627 -160 0 -160 0 0 -618 c0 -374 -4 -631 -10 -651 -13 -46 -65 -99 -110 -111 -48 -13 -2492 -13 -2540 0 -45 12 -97 65 -110 111 -6 20 -10 277 -10 651 l0 618 -160 0 -160 0 0 -627z" />
      </g>
    </svg>
  );
}
