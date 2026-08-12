/**
 * Tech Hermanos logo -- both light and dark versions are rendered and
 * toggled with the `dark:` variant, avoiding a client-side flash while
 * the theme is being determined (no useState/onError roundtrip needed).
 */
export default function Logo({ height = 28 }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-text.png" alt="Tech Hermanos" style={{ height }} className="block dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-text-white.png" alt="Tech Hermanos" style={{ height }} className="hidden dark:block" />
    </>
  );
}
