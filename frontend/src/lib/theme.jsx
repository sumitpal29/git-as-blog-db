import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = ['light', 'dark', 'solarised'];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('cms-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach(t => root.classList.remove(t));
    if (theme !== 'light') root.classList.add(theme);
    localStorage.setItem('cms-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
