export const SetLocalStorage = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`[SetLocalStorage] Failed to save key "${key}":`, error);
    }
};
