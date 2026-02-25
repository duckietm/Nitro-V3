import { WiredActionDefinition } from '@nitrots/nitro-renderer';
import { FC, PropsWithChildren, useEffect } from 'react';
import { GetWiredTimeLocale, LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredActionBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
}

export const WiredActionBaseView: FC<PropsWithChildren<WiredActionBaseViewProps>> = props =>
{
    const { requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, hasSpecialInput = false, children = null } = props;
    const { trigger = null, actionDelay = 0, setActionDelay = null } = useWired();

    useEffect(() =>
    {
        setActionDelay((trigger as WiredActionDefinition).delayInPulses);
    }, [ trigger, setActionDelay ]);

    return (
        <WiredBaseView hasSpecialInput={ hasSpecialInput } requiresFurni={ requiresFurni } save={ save } wiredType="action">
            { children }
            { !!children && <hr className="m-0 bg-dark" /> }
            <div className="flex flex-col">
                <Text bold>{ LocalizeText('wiredfurni.params.delay', [ 'seconds' ], [ GetWiredTimeLocale(actionDelay) ]) }</Text>
                <Slider
                    max={ 20 }
                    min={ 0 }
                    value={ actionDelay }
                    onChange={ event => setActionDelay(event) } />
            </div>
        </WiredBaseView>
    );
};
