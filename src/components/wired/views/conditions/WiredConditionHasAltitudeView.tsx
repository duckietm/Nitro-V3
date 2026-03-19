import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const COUNTER_INTERACTION_TYPES = [ 'game_upcounter' ];
const MIN_ALTITUDE = 0;
const MAX_ALTITUDE = 40;
const ALTITUDE_STEP = 0.01;
const ALTITUDE_PATTERN = /^\d*(\.\d{0,2})?$/;

const clampAltitude = (value: number) =>
{
    if(isNaN(value)) return MIN_ALTITUDE;

    const clamped = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, value));

    return parseFloat(clamped.toFixed(2));
};

const formatAltitude = (value: number) =>
{
    const normalized = clampAltitude(value);
    const text = normalized.toFixed(2);

    return text.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};

const parseAltitude = (value: string) =>
{
    if(!value || !value.trim().length) return 0;

    const parsed = parseFloat(value);

    if(isNaN(parsed)) return 0;

    return clampAltitude(parsed);
};

export const WiredConditionHasAltitudeView: FC<{}> = () =>
{
    const { trigger = null, setIntParams = null, setStringParam = null, setAllowedInteractionTypes = null, setAllowedInteractionErrorKey = null } = useWired();
    const [ comparison, setComparison ] = useState(1);
    const [ furniSource, setFurniSource ] = useState<number>(() =>
    {
        if(trigger?.intData?.length > 1) return trigger.intData[1];
        return (trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0;
    });
    const [ quantifier, setQuantifier ] = useState(0);
    const [ showAdvanced, setShowAdvanced ] = useState(false);
    const [ altitude, setAltitude ] = useState(0);
    const [ altitudeInput, setAltitudeInput ] = useState('0');

    useEffect(() =>
    {
        setAllowedInteractionTypes(COUNTER_INTERACTION_TYPES);
        setAllowedInteractionErrorKey('wiredfurni.error.require_counter_furni');

        return () =>
        {
            setAllowedInteractionTypes(null);
            setAllowedInteractionErrorKey(null);
        };
    }, [ setAllowedInteractionErrorKey, setAllowedInteractionTypes ]);

    useEffect(() =>
    {
        if(!trigger) return;

        setComparison((trigger.intData.length > 0) ? trigger.intData[0] : 1);
        setFurniSource((trigger.intData.length > 1) ? trigger.intData[1] : ((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0));
        setQuantifier((trigger.intData.length > 2) ? trigger.intData[2] : 0);
        setShowAdvanced((trigger.intData.length > 1) ? (trigger.intData[1] !== 0 || trigger.intData[2] !== 0) : false);

        const nextAltitude = parseAltitude(trigger.stringData);
        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    }, [ trigger ]);

    const updateAltitude = (value: number) =>
    {
        const nextValue = clampAltitude(value);

        setAltitude(nextValue);
        setAltitudeInput(formatAltitude(nextValue));
    };

    const updateAltitudeInput = (value: string) =>
    {
        if(!ALTITUDE_PATTERN.test(value)) return;

        setAltitudeInput(value);

        if(!value.length)
        {
            setAltitude(0);
            return;
        }

        const parsedValue = parseFloat(value);

        if(isNaN(parsedValue)) return;

        if(parsedValue > MAX_ALTITUDE)
        {
            updateAltitude(MAX_ALTITUDE);
            return;
        }

        setAltitude(clampAltitude(parsedValue));
    };

    const save = () =>
    {
        setIntParams([
            comparison,
            furniSource,
            quantifier
        ]);
        setStringParam(formatAltitude(altitude));
    };

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            save={ save }
            footer={
                <div className="flex flex-col gap-2">
                    <button className="btn btn-link p-0 align-self-start" type="button" onClick={ () => setShowAdvanced(value => !value) }>
                        { LocalizeText(showAdvanced ? 'wiredfurni.params.sources.collapse' : 'wiredfurni.params.sources.expand') }
                    </button>
                    { showAdvanced &&
                        <>
                            <div className="flex flex-col gap-1">
                                <Text bold>{ LocalizeText('wiredfurni.params.quantifier_selection') }</Text>
                                { [ 0, 1 ].map(value =>
                                {
                                    return (
                                        <div key={ value } className="flex items-center gap-1">
                                            <input checked={ (quantifier === value) } className="form-check-input" id={ `altitudeQuantifier${ value }` } name="altitudeQuantifier" type="radio" onChange={ () => setQuantifier(value) } />
                                            <Text>{ LocalizeText(`wiredfurni.params.quantifier.furni.${ value }`) }</Text>
                                        </div>
                                    );
                                }) }
                            </div>
                            <WiredSourcesSelector showFurni={ true } furniSource={ furniSource } onChangeFurni={ setFurniSource } />
                        </> }
                </div>
            }>
            <div className="flex flex-col gap-2">
                { [ 0, 1, 2 ].map(value =>
                {
                    return (
                        <div key={ value } className="flex items-center gap-1">
                            <input checked={ (comparison === value) } className="form-check-input" id={ `altitudeComparison${ value }` } name="altitudeComparison" type="radio" onChange={ () => setComparison(value) } />
                            <Text>{ LocalizeText(`wiredfurni.params.comparison.${ value }`) }</Text>
                        </div>
                    );
                }) }
            </div>
            <div className="flex flex-col gap-1">
                <Text bold>{ LocalizeText('wiredfurni.params.setaltitude') }</Text>
                <input
                    className="form-control form-control-sm"
                    inputMode="decimal"
                    type="text"
                    value={ altitudeInput }
                    onBlur={ () => setAltitudeInput(formatAltitude(altitude)) }
                    onChange={ event => updateAltitudeInput(event.target.value) } />
            </div>
            <div className="flex flex-col gap-1">
                <Slider
                    max={ MAX_ALTITUDE }
                    min={ MIN_ALTITUDE }
                    step={ ALTITUDE_STEP }
                    value={ altitude }
                    onChange={ event => updateAltitude(event as number) } />
                <Text small>{ formatAltitude(altitude) }</Text>
            </div>
        </WiredConditionBaseView>
    );
};
