/**
 * Admin authentication with server-side password validation.
 * This ensures .env passwords work correctly at runtime.
 */

export function isAuthed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_authed') === 'true';
}

export async function login(pass: string): Promise<boolean> {
    if (!pass || pass.length === 0) return false;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        });

        const result = await response.json();

        if (result.success && typeof window !== 'undefined') {
            localStorage.setItem('admin_authed', 'true');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
} export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_authed');
    }
}
