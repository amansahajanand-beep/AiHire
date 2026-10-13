import { getInitials } from '../../utils/helpers';

/** Round profile picture, falling back to the user's initials. `size` is a Tailwind size class pair. */
export default function Avatar({ name, src, size = 'w-9 h-9', textClass = 'text-xs', tone = 'bg-indigo-600 text-white' }) {
  return (
    <div className={`${size} rounded-full overflow-hidden flex items-center justify-center shrink-0 ${src ? '' : tone}`}>
      {src ? (
        <img src={src} alt={name || 'Profile'} className="w-full h-full object-cover" />
      ) : (
        <span className={`font-semibold ${textClass}`}>{getInitials(name)}</span>
      )}
    </div>
  );
}
