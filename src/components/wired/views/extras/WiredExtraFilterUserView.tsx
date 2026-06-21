import { ChangeEvent, FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const MIN_FILTER = 0;
const MAX_FILTER = 10000;

const clampValue = (value: number) => {
    if (isNaN(value)) return MIN_FILTER;

    return Math.max(MIN_FILTER, Math.min(MAX_FILTER, Math.floor(value)));
};

export const WiredExtraFilterUserView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        setAmount(clampValue(trigger.intData.length > 0 ? trigger.intData[0] : 0));
    }, [trigger]);

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        setAmount(clampValue(Number(event.target.value)));
    };

    const save = () => {
        setIntParams([clampValue(amount)]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={true} requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} save={save} cardStyle={{ width: 360 }}>
            <div className="flex flex-col gap-1">
                <Text bold>{LocalizeText('wiredfurni.params.setfilter')}</Text>
                <input className="form-control form-control-sm" max={MAX_FILTER} min={MIN_FILTER} type="number" value={amount} onChange={onChange} />
            </div>
        </WiredExtraBaseView>
    );
};
