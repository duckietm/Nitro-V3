import { useBetween } from 'use-between';
import { GetConfigurationValue, LocalStorageKeys } from '../../api';
import { useLocalStorage } from '../useLocalStorage';

// Per-user toggle for the catalog visual style.
//  - true  => classic (old) catalog look
//  - false => modern (rebuilt) catalog look
// The default for users who never touched the toggle comes from the global
// `catalog.classic.style` flag in ui-config.json, so an admin can flip the
// default for everyone (true = classic for all, false = modern for all)
// while still letting each user override it from the settings panel.
const useCatalogClassicStyleState = () => useLocalStorage<boolean>(LocalStorageKeys.CATALOG_CLASSIC_STYLE, GetConfigurationValue<boolean>('catalog.classic.style', false));

export const useCatalogClassicStyle = () => useBetween(useCatalogClassicStyleState);
