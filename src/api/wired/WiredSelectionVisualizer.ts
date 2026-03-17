import { GetRoomEngine, IRoomObject, IRoomObjectSpriteVisualization, RoomObjectCategory, WiredFilter } from '@nitrots/nitro-renderer';

export class WiredSelectionVisualizer
{
    private static _selectionShader: WiredFilter = new WiredFilter({
        lineColor: [ 0.45, 0.95, 0.55 ],
        color: [ 0.18, 0.78, 0.30 ]
    });
    private static _secondarySelectionShader: WiredFilter = new WiredFilter({
        lineColor: [ 0.45, 0.78, 1 ],
        color: [ 0.20, 0.52, 0.95 ]
    });

    public static show(furniId: number): void
    {
        WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._selectionShader);
    }

    public static hide(furniId: number): void
    {
        const roomObject = WiredSelectionVisualizer.getRoomObject(furniId);

        WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._selectionShader);
        WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static showSecondary(furniId: number): void
    {
        WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static hideSecondary(furniId: number): void
    {
        WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static clearSelectionShaderFromFurni(furniIds: number[]): void
    {
        for(const furniId of furniIds)
        {
            WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._selectionShader);
        }
    }

    public static applySelectionShaderToFurni(furniIds: number[]): void
    {
        for(const furniId of furniIds)
        {
            WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._selectionShader);
        }
    }

    public static clearSecondarySelectionShaderFromFurni(furniIds: number[]): void
    {
        for(const furniId of furniIds)
        {
            WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._secondarySelectionShader);
        }
    }

    public static applySecondarySelectionShaderToFurni(furniIds: number[]): void
    {
        for(const furniId of furniIds)
        {
            WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._secondarySelectionShader);
        }
    }

    public static clearAllSelectionShaders(): void
    {
        const roomEngine = GetRoomEngine();
        const roomId = roomEngine.activeRoomId;

        if(roomId < 0) return;

        const roomObjects = roomEngine.getRoomObjects(roomId, RoomObjectCategory.FLOOR);

        for(const roomObject of roomObjects)
        {
            WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._selectionShader);
            WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._secondarySelectionShader);
        }
    }

    private static getRoomObject(objectId: number): IRoomObject
    {
        const roomEngine = GetRoomEngine();

        return roomEngine.getRoomObject(roomEngine.activeRoomId, objectId, RoomObjectCategory.FLOOR);
    }

    private static applySelectionShader(roomObject: IRoomObject, filter: WiredFilter): void
    {
        if(!roomObject) return;

        const visualization = (roomObject.visualization as IRoomObjectSpriteVisualization);

        if(!visualization) return;

        for(const sprite of visualization.sprites)
        {
            if(sprite.blendMode === 'add') continue;

            if(!sprite.filters) sprite.filters = [];

            if(sprite.filters.includes(filter)) continue;

            sprite.filters.push(filter);

            sprite.increaseUpdateCounter();
        }
    }

    private static clearSelectionShader(roomObject: IRoomObject, filter: WiredFilter): void
    {
        if(!roomObject) return;

        const visualization = (roomObject.visualization as IRoomObjectSpriteVisualization);

        if(!visualization) return;

        for(const sprite of visualization.sprites)
        {
            if(!sprite.filters) continue;

            const index = sprite.filters.indexOf(filter);

            if(index >= 0)
            {
                sprite.filters.splice(index, 1);

                sprite.increaseUpdateCounter();
            }
        }
    }
}
