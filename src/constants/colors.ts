// Chart color palette
export const CHART_COLORS = [
    'hsl(142, 70%, 50%)', // Neon Green
    'hsl(217, 91%, 60%)', // Electric Blue
    'hsl(36, 100%, 55%)', // Vivid Orange
    'hsl(270, 67%, 55%)', // Vibrant Purple
    'hsl(180, 100%, 45%)', // Bright Cyan
    'hsl(330, 81%, 60%)', // Hot Pink
    'hsl(60, 100%, 50%)', // Neon Yellow
    'hsl(200, 100%, 50%)', // Deep Sky Blue
    'hsl(15, 100%, 50%)',  // Bright Red-Orange
    'hsl(300, 100%, 50%)', // Magenta
];

// Avatar gradient palette
export const AVATAR_COLORS = [
    'bg-neutral-800',
    'bg-neutral-700',
    'bg-neutral-600',
    'bg-neutral-500',
    'bg-zinc-800',
    'bg-zinc-700',
    'bg-stone-800',
    'bg-slate-800',
    'bg-slate-700',
    'bg-black',
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
