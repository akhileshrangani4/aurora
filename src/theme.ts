export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'aurora-theme';

const THEMES: Record<ThemeMode, { background: number; ambient: number; ambientIntensity: number }> = {
  dark: {
    background: 0x0a0a12,
    ambient: 0x223355,
    ambientIntensity: 0.5,
  },
  light: {
    background: 0xe7edf7,
    ambient: 0xffffff,
    ambientIntensity: 0.9,
  },
};

export function getThemeConfig(mode: ThemeMode) {
  return THEMES[mode];
}

export function loadThemePreference(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function saveThemePreference(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
