import { GetEventDispatcher, NitroEvent } from '@nitrots/events';
import { DispatchEvent } from './DispatchEvent';

export const DispatchMainEvent = (event: NitroEvent) => DispatchEvent(GetEventDispatcher(), event);
