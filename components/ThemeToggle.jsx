'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(null); // null until mounted, avoids SSR/client mismatch flash

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  if (dark === null) return <div className="h-8 w-20" />; // placeholder, same size, no flash

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      {dark ? '☽ Dark' : '☀ Light'}
    </button>
  );
}
