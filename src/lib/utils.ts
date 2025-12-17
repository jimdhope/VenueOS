export function isScreenOnline(lastHeartbeat: Date | string | null): boolean {
    if (!lastHeartbeat) return false;
    const heartbeat = new Date(lastHeartbeat);
    const now = new Date();
    const diffInSeconds = (now.getTime() - heartbeat.getTime()) / 1000;
    return diffInSeconds < 60;
}

export function timeAgo(date: Date | string | null): string {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
