const FILES = {
  full: ['/logo-text.png', '/logo-text-white.png'],
  compact: ['/logo-compact.png', '/logo-compact-white.png'],
  mark: ['/logo-mark.png', '/logo-mark-white.png'],
};

/**
 * Tech Hermanos logo -- both light and dark versions are rendered and
 * toggled with the `dark:` variant, avoiding a client-side flash while
 * the theme is being determined (no useState/onError roundtrip needed).
 *
 * The source file is a wide lockup (icon + "TECH HERMANOS" + a "DIGITAL
 * AGENCY" tagline, ~4:1 aspect ratio) that turns into illegible mush
 * once squeezed down to a ~28px-tall sidebar header -- the tagline eats
 * into the height budget the wordmark actually needs. `variant="compact"`
 * (icon + wordmark, tagline cropped out, see public/logo-compact*.png)
 * is the default for anywhere tight on vertical space; `variant="full"`
 * keeps the tagline for spots with room to breathe (landing page, login
 * panel); `variant="mark"` is the icon alone, for the collapsed sidebar.
 */
export default function Logo({ height = 28, variant = 'compact' }) {
  const [light, dark] = FILES[variant] || FILES.compact;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt="Tech Hermanos" style={{ height }} className="block dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dark} alt="Tech Hermanos" style={{ height }} className="hidden dark:block" />
    </>
  );
}
