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
    'bg-gradient-to-br from-indigo-500 to-violet-600',
    'bg-gradient-to-br from-blue-500 to-cyan-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-fuchsia-500 to-purple-600',
    'bg-gradient-to-br from-teal-500 to-emerald-600',
    'bg-gradient-to-br from-sky-500 to-indigo-600',
    'bg-gradient-to-br from-red-500 to-rose-600',
    'bg-gradient-to-br from-violet-500 to-fuchsia-600',
];

/** Deterministic color from a name string */
export function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Extract clean initials from a name (max 2 characters, ignoring parentheses/symbols) */
export function getInitials(name: string): string {
    if (!name) return '?';
    // Clean brackets, parentheses and punctuation
    const clean = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return name.slice(0, 1).toUpperCase() || '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
