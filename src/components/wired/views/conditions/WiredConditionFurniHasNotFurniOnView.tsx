import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionFurniHasNotFurniOnView: FC<{}> = (props) => {
    const [requireAll, setRequireAll] = useState(-1);
    const { trigger = null, setIntParams = null } = useWired();
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[1];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    const save = () => setIntParams([requireAll, furniSource]);

    useEffect(() => {
        setRequireAll(trigger.intData.length > 0 ? trigger.intData[0] : 0);
        if (trigger.intData.length > 1) setFurniSource(trigger.intData[1]);
        else setFurniSource((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
    }, [trigger]);

    const onChangeFurniSource = (next: number) => setFurniSource(next);

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID;

    return (
        <WiredConditionBaseView
            hasSpecialInput={true}
            requiresFurni={requiresFurni}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={onChangeFurniSource} />}
        >
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.not_requireall')}</Text>
                {[0, 1].map((value) => {
                    return (
                        <div key={value} className="flex items-center gap-1">
                            <input
                                checked={requireAll === value}
                                className="form-check-input"
                                id={`requireAll${value}`}
                                name="requireAll"
                                type="radio"
                                onChange={(event) => setRequireAll(value)}
                            />
                            <Text>{LocalizeText(`wiredfurni.params.not_requireall.${value}`)}</Text>
                        </div>
                    );
                })}
            </div>
        </WiredConditionBaseView>
    );
};
