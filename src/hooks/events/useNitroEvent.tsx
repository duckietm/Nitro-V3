import { GetEventDispatcher, NitroEvent } from '@nitrots/events';
import { useEventDispatcher } from './useEventDispatcher';

export const useNitroEvent = <T extends NitroEvent>(
    type: string | string[],
    handler: (event: T) => void,
    enabled = true
) => useEventDispatcher(type, GetEventDispatcher(), handler, enabled);
