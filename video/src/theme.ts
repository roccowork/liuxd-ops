import { Easing, interpolate } from 'remotion';

export const C = {
  bg: '#060c17',
  panel: 'rgba(15, 29, 51, 0.86)',
  panel2: '#132540',
  line: 'rgba(255,255,255,0.10)',
  text: '#e9edf3',
  text2: '#a9b4c4',
  text3: '#6f7d92',
  gold: '#d2b17a',
  ok: '#4fc3a1',
  bad: '#e0644c',
  blue: '#7aa2dc',
};

export const F = {
  serif: '"Noto Serif CJK SC", "Noto Serif SC", serif',
  sans: 'Inter, "Noto Sans CJK SC", sans-serif',
  mono: '"JetBrains Mono", "Noto Sans Mono CJK SC", monospace',
};

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 从 start 帧开始 dur 帧内 0→1 */
export const fade = (f: number, start: number, dur = 14) =>
  interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: ease });

/** 打字效果 */
export const typed = (f: number, start: number, text: string, cps = 1.5) =>
  text.slice(0, Math.max(0, Math.floor((f - start) * cps)));

/** 数字滚动 */
export const count = (f: number, start: number, dur: number, to: number) =>
  Math.round(interpolate(f, [start, start + dur], [0, to], { ...clamp, easing: ease }));
