import { IRoomObject, RoomObjectVariable } from '@nitrots/api';
import { GetSessionDataManager } from '@nitrots/session';

export function IsOwnerOfFurniture(roomObject: IRoomObject): boolean
{
    if(!roomObject || !roomObject.model) return false;

    const userId = GetSessionDataManager().userId;
    const objectOwnerId = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_OWNER_ID);

    return (userId === objectOwnerId);
}
