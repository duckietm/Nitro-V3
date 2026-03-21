import { IRoomSession } from '@nitrots/api';
import { GetRoomSessionManager } from '@nitrots/session';

export function StartRoomSession(session: IRoomSession): void
{
    GetRoomSessionManager().startSession(session);
}
