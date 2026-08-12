'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Renders /public/logo.png if present, falling back to a generic mark
 * automatically (no code change needed once the real logo file is
 * dropped into public/ -- see the missing-logo note left for the user).
 */
export default function Logo({ height = 28, showWordmark = true }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <ShieldCheck size={18} />
        </div>
        {showWordmark && <span className="font-semibold tracking-tight">ModShield</span>}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="Logo" style={{ height }} onError={() => setFailed(true)} />;
}
