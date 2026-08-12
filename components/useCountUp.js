'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number counting up from its previous value to `target`
 * whenever target changes. Non-numeric values (e.g. "42%") pass through
 * unchanged -- only used for the plain-integer stat cards.
 */
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(typeof target === 'number' ? 0 : target);
  const fromRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number') {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
