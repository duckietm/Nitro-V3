import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

// Server saveData expects [mode, furniSource]. furniSource 100 = SOURCE_SELECTED (the picked furni).
const MODE_RETURN = 0;
const MODE_DELETE = 1;
const SOURCE_SELECTED = 100;

export const WiredActionRemoveFurniView: FC<{}> = () => {
    const { trigger = null, setIntParams = null } = useWired();
    const [mode, setMode] = useState<number>(MODE_RETURN);

    useEffect(() => {
        if (!trigger) return;

        setMode((trigger.intData?.length ?? 0) > 0 ? trigger.intData[0] : MODE_RETURN);
    }, [trigger]);

    const save = () => setIntParams([mode, SOURCE_SELECTED]);

    return (
        <WiredActionBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID} save={save}>
            <div className="flex flex-col gap-2">
                <Text bold>Pick the furni to remove above, then choose what happens to them:</Text>
                <div className="flex items-center gap-1">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="removeMode"
                        checked={mode === MODE_RETURN}
                        onChange={() => setMode(MODE_RETURN)}
                    />
                    <Text>Return to owner's inventory</Text>
                </div>
                <div className="flex items-center gap-1">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="removeMode"
                        checked={mode === MODE_DELETE}
                        onChange={() => setMode(MODE_DELETE)}
                    />
                    <Text>Delete permanently (cannot be undone)</Text>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
