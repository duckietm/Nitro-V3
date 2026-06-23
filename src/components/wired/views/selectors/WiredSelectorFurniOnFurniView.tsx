import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

export const WiredSelectorFurniOnFurniView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [selectionType, setSelectionType] = useState(0);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);
    const [furniSource, setFurniSource] = useState<number>(() => {
        if (trigger?.intData?.length > 1) return trigger.intData[1];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });

    useEffect(() => {
        if (!trigger) return;

        setSelectionType(trigger.intData.length > 0 ? trigger.intData[0] : 0);
        setFurniSource(trigger.intData.length > 1 ? trigger.intData[1] : (trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0);
        setFilterExisting(trigger.intData.length > 2 ? trigger.intData[2] === 1 : false);
        setInvert(trigger.intData.length > 3 ? trigger.intData[3] === 1 : false);
    }, [trigger]);

    const save = () => setIntParams([selectionType, furniSource, filterExisting ? 1 : 0, invert ? 1 : 0]);

    return (
        <WiredSelectorBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            hideDelay={true}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} onChangeFurni={setFurniSource} />}
        >
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.selection_type')}</Text>
                    {[0, 1, 2, 3].map((value) => {
                        return (
                            <label key={value} className="flex items-center gap-1">
                                <input
                                    checked={selectionType === value}
                                    className="form-check-input"
                                    name="furniOnFurniSelectionType"
                                    type="radio"
                                    onChange={() => setSelectionType(value)}
                                />
                                <Text>{LocalizeText(`wiredfurni.params.onfurni.${value}`)}</Text>
                            </label>
                        );
                    })}
                </div>

                <hr className="m-0 bg-dark" />

                <Text bold>{LocalizeText('wiredfurni.params.selector_options_selector')}</Text>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={filterExisting}
                        onChange={(event) => setFilterExisting(event.target.checked)}
                    />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.0')}</Text>
                </label>

                <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-check-input" checked={invert} onChange={(event) => setInvert(event.target.checked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.1')}</Text>
                </label>
            </div>
        </WiredSelectorBaseView>
    );
};
