import { GetRoomSessionManager } from '@nitrots/session';

export function CreateRoomSession(roomId: number, password: string = null): void
{
    GetRoomSessionManager().createSession(roomId, password);
}
