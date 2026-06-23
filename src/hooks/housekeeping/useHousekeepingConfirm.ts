import { useCallback } from 'react';
import { LocalizeText } from '../../api';
import { useNotification } from '../notification';

/**
 * Themed confirmation wrapper around `useNotification().showConfirm`.
 *
 * Destructive HK actions (delete room, kick-all, bulk ban) used to
 * call `window.confirm` directly — that's a system-modal that breaks
 * out of the client visually and doesn't honor the LocalizeText
 * dictionary. `useHousekeepingConfirm` swaps in the in-client
 * NotificationConfirm modal, with the HK button labels and a
 * sensible default title.
 *
 * Returns a single function `confirm(message, onConfirm)` to keep
 * the call sites tight. Pass an `options.confirmText` override when
 * the action needs a custom label (e.g. "Delete forever" instead of
 * the generic confirm).
 */
export const useHousekeepingConfirm = () => {
    const { showConfirm } = useNotification();

    return useCallback(
        (message: string, onConfirm: () => void, options: { confirmText?: string; cancelText?: string; title?: string } = {}) => {
            const confirmText = options.confirmText ?? LocalizeText('housekeeping.confirm.proceed');
            const cancelText = options.cancelText ?? LocalizeText('housekeeping.confirm.cancel');
            const title = options.title ?? LocalizeText('housekeeping.confirm.title');

            showConfirm(message, onConfirm, () => {}, confirmText, cancelText, title);
        },
        [showConfirm]
    );
};
