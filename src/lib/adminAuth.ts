/**
 * Super-lightweight "auth" based on a single localStorage flag.
 * Exposes the password to the browser via NEXT_PUBLIC_ADMIN_PASS.
 */

export const ADMIN_PASS =
    process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin';

export function isAuthed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_authed') === 'true';
}

export function login(pass: string): boolean {
    // Debug logging for password validation
    if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt - Expected:', ADMIN_PASS, 'Provided:', pass);
    }

    const ok = pass === ADMIN_PASS && pass.length > 0;
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
