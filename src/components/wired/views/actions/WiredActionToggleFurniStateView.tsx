import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionToggleFurniStateView: FC<{}> = (props) => {
    const { trigger = null, setIntParams = null } = useWired();
    const [toggleType, setToggleType] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[0];
        return 0;
    });
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[1];
        if (trigger?.intData?.length >= 1) return trigger.intData[0];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    useEffect(() => {
        if (!trigger) return;

        if (trigger.intData.length > 1) {
            setToggleType(trigger.intData[0]);
            setFurniSource(trigger.intData[1]);
        } else if (trigger.intData.length >= 1) {
            setToggleType(0);
            setFurniSource(trigger.intData[0]);
        } else {
            setToggleType(0);
            setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
        }
    }, [trigger]);

    const onChangeFurniSource = (next: number) => setFurniSource(next);

    const save = () => setIntParams([toggleType, furniSource]);

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT;

    return (
        <WiredActionBaseView
            hasSpecialInput={true}
            requiresFurni={requiresFurni}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={onChangeFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.operator.2')}</Text>
                {[0, 1].map((option) => (
                    <label key={option} className="flex items-center gap-1">
                        <input
                            checked={toggleType === option}
                            className="form-check-input"
                            name="toggleType"
                            type="radio"
                            onChange={() => setToggleType(option)}
                        />
                        <Text>{LocalizeText(`wiredfurni.params.toggletype.${option}`)}</Text>
                    </label>
                ))}
            </div>
        </WiredActionBaseView>
    );
};
