import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

const directionOptions: { value: number; icon: string }[] = [
    { value: 0, icon: 'ne' },
    { value: 2, icon: 'se' },
    { value: 4, icon: 'sw' },
    { value: 6, icon: 'nw' }
];

export const WiredActionMoveFurniAsGroupView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [direction, setDirection] = useState(-1);
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[1];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    useEffect(() => {
        if (!trigger) return;

        setDirection(trigger.intData.length > 0 ? trigger.intData[0] : -1);

        if (trigger.intData.length > 1) setFurniSource(trigger.intData[1]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
    }, [trigger]);

    const save = () => setIntParams([direction, furniSource]);

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={setFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.startdir')}</Text>
                <div className="flex gap-1">
                    {directionOptions.map((option) => (
                        <div key={option.value} className="flex items-center gap-1">
                            <input
                                checked={direction === option.value}
                                className="form-check-input"
                                id={`groupdir${option.value}`}
                                name="groupdir"
                                type="radio"
                                onChange={() => setDirection(option.value)}
                            />
                            <Text>
                                <i className={`icon icon-${option.icon}`} />
                            </Text>
                        </div>
                    ))}
                </div>
            </div>
        </WiredActionBaseView>
    );
};
