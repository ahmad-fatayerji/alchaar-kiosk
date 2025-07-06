/**
 * Super-lightweight “auth” based on a single localStorage flag.
 * Exposes the password to the browser via NEXT_PUBLIC_ADMIN_PASS.
 */

export const ADMIN_PASS =
    process.env.NEXT_PUBLIC_ADMIN_PASS;

export function isAuthed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_authed') === 'true';
}

export function login(pass: string): boolean {
    const ok = pass === ADMIN_PASS;
    if (ok && typeof window !== 'undefined') {
        localStorage.setItem('admin_authed', 'true');
    }
    return ok;
}

export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_authed');
    }
}
