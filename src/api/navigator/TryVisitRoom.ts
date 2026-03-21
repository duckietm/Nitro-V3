import { GetGuestRoomMessageComposer } from '@nitrots/communication';
import { SendMessageComposer } from '../nitro';

export function TryVisitRoom(roomId: number): void
{
    SendMessageComposer(new GetGuestRoomMessageComposer(roomId, false, true));
}
