import { FC } from 'react';
import { COLORMAP, FloorAction, HEIGHT_SCHEME } from '@nitrots/nitro-renderer';
import { FloorplanEditor } from '@nitrots/nitro-renderer';
import { Column, Text } from '../../../common';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

const colormap = COLORMAP as Record<string, string>;

export const FloorplanHeightSelector: FC<{}> = () =>
{
    const { floorHeight, setFloorHeight, setFloorAction } = useFloorplanEditorContext();

    const onSelectHeight = (height: number) =>
    {
        setFloorHeight(height);
        setFloorAction(FloorAction.SET);

        FloorplanEditor.instance.actionSettings.currentAction = FloorAction.SET;
        FloorplanEditor.instance.actionSettings.currentHeight = height.toString(36);
    };

    const heights: number[] = [];

    for(let i = 26; i >= 0; i--) heights.push(i);

    return (
        <Column className="h-full w-[30px] min-w-[30px] select-none">
            <Text bold small center>{ floorHeight }</Text>
            <div className="flex flex-col flex-1 rounded overflow-hidden border-2 border-muted">
                { heights.map(h =>
                {
                    const char = HEIGHT_SCHEME[h + 1];
                    const color = colormap[char] || '101010';
                    const isActive = (floorHeight === h);

                    return (
                        <div
                            key={ h }
                            className="flex-1 cursor-pointer relative flex items-center justify-center"
                            style={ {
                                backgroundColor: `#${ color }`,
                                outline: isActive ? '2px solid #fff' : 'none',
                                outlineOffset: '-2px',
                                zIndex: isActive ? 1 : 0
                            } }
                            onClick={ () => onSelectHeight(h) }
                            title={ `${ h }` }
                        />
                    );
                }) }
            </div>
        </Column>
    );
};
