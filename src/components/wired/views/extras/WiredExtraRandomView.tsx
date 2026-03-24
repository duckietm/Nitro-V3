import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredExtraBaseView } from './WiredExtraBaseView';

const MIN_PICK_AMOUNT = 1;
const MIN_SKIP_EXECUTIONS = 0;
const MAX_RANDOM_VALUE = 1000;

const normalizePickAmount = (value: number) =>
{
    if(isNaN(value)) return MIN_PICK_AMOUNT;

    return Math.max(MIN_PICK_AMOUNT, Math.min(MAX_RANDOM_VALUE, Math.floor(value)));
};

const normalizeSkipExecutions = (value: number) =>
{
    if(isNaN(value)) return MIN_SKIP_EXECUTIONS;

    return Math.max(MIN_SKIP_EXECUTIONS, Math.min(MAX_RANDOM_VALUE, Math.floor(value)));
};

export const WiredExtraRandomView: FC<{}> = () =>
{
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [ pickAmount, setPickAmount ] = useState(MIN_PICK_AMOUNT);
    const [ skipExecutions, setSkipExecutions ] = useState(MIN_SKIP_EXECUTIONS);

    useEffect(() =>
    {
        if(!trigger) return;

        setPickAmount(normalizePickAmount((trigger.intData.length > 0) ? trigger.intData[0] : MIN_PICK_AMOUNT));
        setSkipExecutions(normalizeSkipExecutions((trigger.intData.length > 1) ? trigger.intData[1] : MIN_SKIP_EXECUTIONS));
    }, [ trigger ]);

    const save = () =>
    {
        setIntParams([ normalizePickAmount(pickAmount), normalizeSkipExecutions(skipExecutions) ]);
        setStringParam('');
    };

    return (
        <WiredExtraBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save } cardStyle={ { width: 380 } }>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text>{ LocalizeText('wiredfurni.params.pickamount', [ 'picks' ], [ pickAmount.toString() ]) }</Text>
                    <Slider
                        max={ MAX_RANDOM_VALUE }
                        min={ MIN_PICK_AMOUNT }
                        step={ 1 }
                        value={ pickAmount }
                        onChange={ value => setPickAmount(normalizePickAmount(Array.isArray(value) ? value[0] : Number(value))) } />
                    <Text small>{ pickAmount }</Text>
                </div>
                <div className="flex flex-col gap-1">
                    <Text>{ LocalizeText('wiredfurni.params.skipactions', [ 'skips' ], [ skipExecutions.toString() ]) }</Text>
                    <Slider
                        max={ MAX_RANDOM_VALUE }
                        min={ MIN_SKIP_EXECUTIONS }
                        step={ 1 }
                        value={ skipExecutions }
                        onChange={ value => setSkipExecutions(normalizeSkipExecutions(Array.isArray(value) ? value[0] : Number(value))) } />
                    <Text small>{ skipExecutions }</Text>
                </div>
            </div>
        </WiredExtraBaseView>
    );
};
