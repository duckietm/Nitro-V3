export const GetLocalStorage = <T>(key: string): T | null => {
    try {
        const raw = window.localStorage.getItem(key);

        if (raw === null) return null;

        return JSON.parse(raw) as T;
    } catch (_e) {
        return null;
    }
};
