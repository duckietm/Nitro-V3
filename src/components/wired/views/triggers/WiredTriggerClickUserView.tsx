import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggerClickUserView: FC<{}> = () => {
    const [blockMenuOpen, setBlockMenuOpen] = useState(false);
    const [doNotRotate, setDoNotRotate] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([blockMenuOpen ? 1 : 0, doNotRotate ? 1 : 0]);

    useEffect(() => {
        setBlockMenuOpen(trigger?.intData?.length > 0 ? trigger.intData[0] === 1 : false);
        setDoNotRotate(trigger?.intData?.length > 1 ? trigger.intData[1] === 1 : false);
    }, [trigger]);

    return (
        <WiredTriggerBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save}>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <input
                        checked={blockMenuOpen}
                        className="form-check-input"
                        id="clickUserBlockMenuOpen"
                        type="checkbox"
                        onChange={(event) => setBlockMenuOpen(event.target.checked)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.click_user.block_menu_open')}</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input
                        checked={doNotRotate}
                        className="form-check-input"
                        id="clickUserDoNotRotate"
                        type="checkbox"
                        onChange={(event) => setDoNotRotate(event.target.checked)}
                    />
                    <Text>{LocalizeText('wiredfurni.params.click_user.do_not_rotate')}</Text>
                </div>
            </div>
        </WiredTriggerBaseView>
    );
};
