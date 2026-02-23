import { useBetween } from 'use-between';
import { LocalStorageKeys } from '../api';
import { useLocalStorage } from './useLocalStorage';

const useChatWindowState = () => useLocalStorage(LocalStorageKeys.CHAT_WINDOW_ENABLED, false);

export const useChatWindow = () => useBetween(useChatWindowState);
