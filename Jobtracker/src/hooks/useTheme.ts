import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../lib/db';

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    getSetting('theme').then((val) => {
      const isDark = val === 'dark';
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    await setSetting('theme', next ? 'dark' : 'light');
  };

  return { dark, toggleTheme };
}
