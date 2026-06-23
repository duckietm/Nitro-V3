import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WIRED_DIRECTION_GRID, WiredDirectionIcon } from '../WiredDirectionIcon';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const rotationOptions: number[] = [0, 1, 2, 3, 4, 5, 6];

export const WiredActionMoveAndRotateFurniView: FC<{}> = (props) => {
    const [movement, setMovement] = useState(-1);
    const [rotation, setRotation] = useState(-1);
    const [blockOnUserCollision, setBlockOnUserCollision] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 2) return trigger.intData[2];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () => setIntParams([movement, rotation, furniSource, blockOnUserCollision ? 1 : 0]);

    useEffect(() => {
        if (trigger.intData.length >= 2) {
            setMovement(trigger.intData[0]);
            setRotation(trigger.intData[1]);
        } else {
            setMovement(-1);
            setRotation(-1);
        }

        if (trigger.intData.length > 2) setFurniSource(trigger.intData[2]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);

        setBlockOnUserCollision((trigger.intData?.length ?? 0) > 3 ? trigger.intData[3] === 1 : false);
    }, [trigger]);

    const onChangeFurniSource = (next: number) => setFurniSource(next);

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT;

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={requiresFurni}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={onChangeFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.startdir')}</Text>
                <div className="grid grid-cols-4 gap-2 max-w-[240px]">
                    {WIRED_DIRECTION_GRID.flatMap((row, rowIndex) =>
                        row.map((direction, columnIndex) => {
                            if (direction === null) {
                                return <div key={`move-to-dir-empty-${rowIndex}-${columnIndex}`} />;
                            }

                            return (
                                <label key={`move-to-dir-${direction}`} className="flex items-center justify-center gap-[2px] cursor-pointer">
                                    <input
                                        checked={movement === direction}
                                        className="form-check-input"
                                        id={`movement${direction}`}
                                        name="movement"
                                        type="radio"
                                        onChange={() => setMovement(direction)}
                                    />
                                    <span className="inline-flex items-center justify-center">
                                        <WiredDirectionIcon direction={direction} selected={movement === direction} />
                                    </span>
                                </label>
                            );
                        })
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.turn')}</Text>
                {rotationOptions.map((option) => {
                    return (
                        <div key={option} className="flex items-center gap-1">
                            <input
                                checked={rotation === option}
                                className="form-check-input"
                                id={`rotation${option}`}
                                name="rotation"
                                type="radio"
                                onChange={(event) => setRotation(option)}
                            />
                            <Text>{LocalizeText(`wiredfurni.params.turn.${option}`)}</Text>
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.user_collide')}</Text>
                <label className="flex items-center gap-1 cursor-pointer">
                    <input
                        checked={blockOnUserCollision}
                        className="form-check-input"
                        type="checkbox"
                        onChange={(event) => setBlockOnUserCollision(event.target.checked)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.user_collide.0')}</Text>
                </label>
            </div>
        </WiredActionBaseView>
    );
};
