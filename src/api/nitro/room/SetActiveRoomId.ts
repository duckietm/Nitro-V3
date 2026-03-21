import { GetRoomEngine } from '@nitrots/room';

export function SetActiveRoomId(roomId: number): void
{
    GetRoomEngine().setActiveRoomId(roomId);
}
