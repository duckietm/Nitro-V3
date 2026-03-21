import { createContext, Dispatch, FC, ProviderProps, SetStateAction, useContext } from 'react';
import { IFloorplanSettings } from '@nitrots/room';
import { IVisualizationSettings } from '@nitrots/room';

interface IFloorplanEditorContext
{
    originalFloorplanSettings: IFloorplanSettings;
    setOriginalFloorplanSettings: Dispatch<SetStateAction<IFloorplanSettings>>;
    visualizationSettings: IVisualizationSettings;
    setVisualizationSettings: Dispatch<SetStateAction<IVisualizationSettings>>;
    floorHeight: number;
    setFloorHeight: Dispatch<SetStateAction<number>>;
    floorAction: number;
    setFloorAction: Dispatch<SetStateAction<number>>;
    tilemapVersion: number;
    areaInfo: { total: number; walkable: number };
}

const FloorplanEditorContext = createContext<IFloorplanEditorContext>({
    originalFloorplanSettings: null,
    setOriginalFloorplanSettings: null,
    visualizationSettings: null,
    setVisualizationSettings: null,
    floorHeight: 0,
    setFloorHeight: null,
    floorAction: 3,
    setFloorAction: null,
    tilemapVersion: 0,
    areaInfo: { total: 0, walkable: 0 }
});

export const FloorplanEditorContextProvider: FC<ProviderProps<IFloorplanEditorContext>> = props => <FloorplanEditorContext.Provider { ...props } />;

export const useFloorplanEditorContext = () => useContext(FloorplanEditorContext);
