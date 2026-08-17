const FILES = {
  full: ['/logo-text.png', '/logo-text-white.png'],
  compact: ['/logo-compact.png', '/logo-compact-white.png'],
  mark: ['/logo-mark.png', '/logo-mark-white.png'],
};

/**
 * Tech Hermanos logo.
 *
 * The source file is a wide lockup (icon + "TECH HERMANOS" + a "DIGITAL
 * AGENCY" tagline, ~4:1) that turns into mush at sidebar height -- the
 * tagline eats the budget the wordmark needs. `variant="compact"` (icon +
 * wordmark, tagline cropped) is the default for tight spots;
 * `variant="full"` keeps the tagline where there's room; `variant="mark"`
 * is the icon alone for the collapsed sidebar.
 *
 * `forceLight` selects the white artwork, for placement on the navy
 * chrome (sidebar, login panel). There's no dark mode, so this is an
 * explicit per-placement choice rather than a theme-driven swap.
 */
export default function Logo({ height = 28, variant = 'compact', forceLight = false }) {
  const [onLight, onDark] = FILES[variant] || FILES.compact;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={forceLight ? onDark : onLight} alt="Tech Hermanos" style={{ height }} className="block w-auto" />
  );
}
