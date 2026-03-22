import type { ThemeMode } from './theme';

export interface SettingsUI {
  setTheme: (mode: ThemeMode) => void;
}

export function createSettingsUI(initialTheme: ThemeMode, onThemeChange: (mode: ThemeMode) => void): SettingsUI {
  const panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Settings');
  Object.assign(panel.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: '10',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(10, 10, 18, 0.78)',
    backdropFilter: 'blur(6px)',
    color: '#f4f7fb',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  } satisfies Partial<CSSStyleDeclaration>);

  const label = document.createElement('label');
  label.textContent = 'Light mode';
  label.htmlFor = 'theme-toggle';

  const toggle = document.createElement('input');
  toggle.id = 'theme-toggle';
  toggle.type = 'checkbox';
  toggle.checked = initialTheme === 'light';
  toggle.setAttribute('aria-label', 'Toggle light mode');
  toggle.addEventListener('change', () => {
    onThemeChange(toggle.checked ? 'light' : 'dark');
  });

  panel.append(label, toggle);
  document.body.appendChild(panel);

  return {
    setTheme(mode) {
      toggle.checked = mode === 'light';
      const isLight = mode === 'light';
      panel.style.background = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10, 10, 18, 0.78)';
      panel.style.border = isLight ? '1px solid rgba(15,23,42,0.15)' : '1px solid rgba(255,255,255,0.15)';
      panel.style.color = isLight ? '#0f172a' : '#f4f7fb';
    },
  };
}
