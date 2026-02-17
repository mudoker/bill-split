// Chart color palette
export const CHART_COLORS = [
    'hsl(220, 90%, 56%)',
    'hsl(160, 60%, 45%)',
    'hsl(30, 90%, 55%)',
    'hsl(340, 75%, 55%)',
    'hsl(270, 60%, 55%)',
    'hsl(190, 80%, 42%)',
    'hsl(50, 90%, 50%)',
    'hsl(0, 70%, 55%)',
    'hsl(140, 50%, 40%)',
    'hsl(300, 50%, 50%)',
];

// Avatar gradient palette
export const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-fuchsia-600',
    'from-amber-500 to-orange-600',
    'from-lime-500 to-emerald-600',
    'from-rose-500 to-red-600',
    'from-sky-500 to-cyan-600',
];

/** Deterministic color from a name string */
export function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Extract initials from a full name (max 2 chars) */
export function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
