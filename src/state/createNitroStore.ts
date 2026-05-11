/**
 * Skeleton for proposal #5 (unified UI store).
 *
 * NOT YET ENABLED — `zustand` is not in package.json.
 * To activate:
 *
 *   yarn add zustand
 *
 * Then this file becomes:
 *
 *   import { create } from 'zustand';
 *   export const createNitroStore = create;
 *
 * The naming convention below documents the intended structure: each
 * feature owns one slice file under `src/features/<feature>/state/`,
 * importing `createNitroStore` from here.
 *
 * Example slice (to be created when zustand is installed):
 *
 *   // src/features/wired-tools/state/wiredToolsSlice.ts
 *   import { createNitroStore } from '../../../state/createNitroStore';
 *
 *   type WiredToolsState = {
 *       activeTab: 'monitor' | 'variables' | 'inspection' | 'chests' | 'settings';
 *       setActiveTab: (tab: WiredToolsState['activeTab']) => void;
 *   };
 *
 *   export const useWiredToolsStore = createNitroStore<WiredToolsState>()((set) => ({
 *       activeTab: 'monitor',
 *       setActiveTab: (tab) => set({ activeTab: tab }),
 *   }));
 *
 * First migration target suggested in docs/ARCHITECTURE.md is the
 * `let isCreatingRoom = false` / `createRoomTimeout` singleton pair in
 * NavigatorRoomCreatorView.tsx — a ~5-line conversion that removes a
 * react-compiler/react-compiler "writing outside component" violation.
 */

export const createNitroStore = (): never =>
{
    throw new Error('createNitroStore is not enabled. See docs/ARCHITECTURE.md proposal #5.');
};
