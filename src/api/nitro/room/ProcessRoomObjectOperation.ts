import { GetRoomEngine } from '@nitrots/room';

export function ProcessRoomObjectOperation(objectId: number, category: number, operation: string): void
{
    GetRoomEngine().processRoomObjectOperation(objectId, category, operation);
}
