import { useUserChooserActions } from './useUserChooserActions';
import { useUserChooserState } from './useUserChooserState';

/**
 * @deprecated Use `useUserChooserState` (data + close + populate) and
 * `useUserChooserActions` (imperative selectItem) directly. This shim
 * preserves the `{ items, onClose, selectItem, populateChooser }` shape
 * for existing consumers.
 */
export const useUserChooserWidget = () => {
    const { items, onClose, populateChooser } = useUserChooserState();
    const { selectItem } = useUserChooserActions();

    return { items, onClose, selectItem, populateChooser };
};
