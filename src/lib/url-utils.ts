/**
 * Ensures a URL is absolute by prepending the base URL if necessary
 */
export function ensureAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    
    // If already absolute (starts with http:// or https://), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // For client-side, use window.location to get the current server address
    // This ensures it works regardless of how the user accesses the app (localhost vs IP)
    if (typeof window !== 'undefined') {
        const baseUrl = `${window.location.protocol}//${window.location.host}`;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanUrl}`;
    }
    
    // For server-side rendering, use the environment variable
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
}
