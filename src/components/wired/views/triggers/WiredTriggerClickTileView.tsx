import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSourceOption, WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const CLICK_TILE_INTERACTION_TYPES = ['room_invisible_click_tile'];
const FURNI_SOURCE_OPTIONS: WiredSourceOption[] = [
    { value: 100, label: 'wiredfurni.params.sources.furni.100' },
    { value: 200, label: 'wiredfurni.params.sources.furni.200' }
];

const normalizeFurniSource = (value: number) => (FURNI_SOURCE_OPTIONS.some((option) => option.value === value) ? value : 100);

export const WiredTriggerClickTileView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setAllowedInteractionTypes = null, setAllowedInteractionErrorKey = null } = useWired();
    const [furniSource, setFurniSource] = useState(100);

    const save = () => setIntParams([furniSource]);

    useEffect(() => {
        setFurniSource(trigger?.intData?.length > 0 ? normalizeFurniSource(trigger.intData[0]) : 100);
    }, [trigger]);

    useEffect(() => {
        setAllowedInteractionTypes(CLICK_TILE_INTERACTION_TYPES);
        setAllowedInteractionErrorKey('wiredfurni.error.require_click_tiles');

        return () => {
            setAllowedInteractionTypes(null);
            setAllowedInteractionErrorKey(null);
        };
    }, [setAllowedInteractionErrorKey, setAllowedInteractionTypes]);

    return (
        <WiredTriggerBaseView
            hasSpecialInput={false}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT}
            save={save}
            footer={<WiredSourcesSelector showFurni={true} furniSource={furniSource} furniSources={FURNI_SOURCE_OPTIONS} onChangeFurni={setFurniSource} />}
        />
    );
};
