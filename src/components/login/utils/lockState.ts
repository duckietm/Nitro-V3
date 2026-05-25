export const LOCK_KEY = 'nitro.login.lock';
export const MAX_ATTEMPTS = 5;
export const LOCK_WINDOW_MS = 60_000;
export const LOCK_DURATION_MS = 2 * 60_000;

export type AttemptState = { attempts: number; firstAt: number; lockedUntil: number };

export const readLock = (): AttemptState =>
{
    try
    {
        const raw = sessionStorage.getItem(LOCK_KEY);
        if(!raw) return { attempts: 0, firstAt: 0, lockedUntil: 0 };
        return JSON.parse(raw);
    }
    catch
    {
        return { attempts: 0, firstAt: 0, lockedUntil: 0 };
    }
};

export const writeLock = (state: AttemptState) =>
{
    try
    {
        sessionStorage.setItem(LOCK_KEY, JSON.stringify(state));
    }
    catch
    { }
};
