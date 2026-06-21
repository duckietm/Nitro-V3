import { useFurniChooserActions } from './useFurniChooserActions';
import { useFurniChooserState } from './useFurniChooserState';

/**
 * @deprecated Use `useFurniChooserState` (data + close + populate)
 * and `useFurniChooserActions` (imperative selectItem) directly.
 * This shim preserves the `{ items, onClose, selectItem, populateChooser }`
 * shape for existing consumers.
 */
export const useFurniChooserWidget = () => {
    const { items, onClose, populateChooser } = useFurniChooserState();
    const { selectItem } = useFurniChooserActions();

    return { items, onClose, selectItem, populateChooser };
};
