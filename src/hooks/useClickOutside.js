import { useEffect } from 'react';

/** Calls onOutside when the user presses outside `ref` or hits Escape, while `active` is true. */
export default function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, onOutside, active]);
}
