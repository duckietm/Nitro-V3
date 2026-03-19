import { ChangeEvent, FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const MODE_SKIP = 0;
const MODE_EXACT = 1;
const MODE_RANGE = 2;
const MODE_OPTIONS = [ MODE_SKIP, MODE_EXACT, MODE_RANGE ];

const clampValue = (value: number, min: number, max: number) =>
{
    if(isNaN(value)) return min;

    return Math.max(min, Math.min(max, Math.floor(value)));
};

interface TimeFilterSectionProps
{
    sectionId: string;
    titleKey: string;
    min: number;
    max: number;
    mode: number;
    fromValue: number;
    toValue: number;
    onModeChange: (value: number) => void;
    onFromChange: (value: number) => void;
    onToChange: (value: number) => void;
}

const parseInputValue = (event: ChangeEvent<HTMLInputElement>, min: number, max: number) =>
{
    return clampValue(parseInt(event.target.value || min.toString(), 10), min, max);
};

const InlineNumberInput: FC<{ value: number; min: number; max: number; onChange: (value: number) => void }> = props =>
{
    const { value = 0, min = 0, max = 0, onChange = null } = props;

    return (
        <input
            className="form-control form-control-sm text-center"
            max={ max }
            min={ min }
            style={ { width: 56 } }
            type="number"
            value={ value }
            onChange={ event => onChange(parseInputValue(event, min, max)) } />
    );
};

const TimeFilterSection: FC<TimeFilterSectionProps> = props =>
{
    const { sectionId = '', titleKey = '', min = 0, max = 0, mode = MODE_SKIP, fromValue = 0, toValue = 0, onModeChange = null, onFromChange = null, onToChange = null } = props;

    return (
        <div className="d-flex flex-column gap-2">
            <Text bold>{ LocalizeText(titleKey) }</Text>
            <div className="flex items-center gap-1">
                <input checked={ (mode === MODE_SKIP) } className="form-check-input" id={ `${ sectionId }0` } name={ sectionId } type="radio" onChange={ () => onModeChange(MODE_SKIP) } />
                <Text>{ LocalizeText('wiredfurni.params.time.skip') }</Text>
            </div>
            <div className="flex items-center gap-2">
                <input checked={ (mode === MODE_EXACT) } className="form-check-input" id={ `${ sectionId }1` } name={ sectionId } type="radio" onChange={ () => onModeChange(MODE_EXACT) } />
                <Text>{ LocalizeText('wiredfurni.params.time.exact') }</Text>
                <InlineNumberInput max={ max } min={ min } value={ fromValue } onChange={ onFromChange } />
            </div>
            <div className="flex items-center gap-2">
                <input checked={ (mode === MODE_RANGE) } className="form-check-input" id={ `${ sectionId }2` } name={ sectionId } type="radio" onChange={ () => onModeChange(MODE_RANGE) } />
                <Text>{ LocalizeText('wiredfurni.params.time.range') }</Text>
                <InlineNumberInput max={ max } min={ min } value={ fromValue } onChange={ onFromChange } />
                <Text>-</Text>
                <InlineNumberInput max={ max } min={ min } value={ toValue } onChange={ onToChange } />
            </div>
        </div>
    );
};

export const WiredConditionMatchTimeView: FC<{}> = () =>
{
    const { trigger = null, setIntParams = null } = useWired();
    const [ hourMode, setHourMode ] = useState(MODE_SKIP);
    const [ hourFrom, setHourFrom ] = useState(0);
    const [ hourTo, setHourTo ] = useState(0);
    const [ minuteMode, setMinuteMode ] = useState(MODE_SKIP);
    const [ minuteFrom, setMinuteFrom ] = useState(0);
    const [ minuteTo, setMinuteTo ] = useState(0);
    const [ secondMode, setSecondMode ] = useState(MODE_SKIP);
    const [ secondFrom, setSecondFrom ] = useState(0);
    const [ secondTo, setSecondTo ] = useState(0);

    useEffect(() =>
    {
        if(!trigger) return;

        setHourMode(MODE_OPTIONS.includes(trigger.intData[0]) ? trigger.intData[0] : MODE_SKIP);
        setHourFrom(clampValue(trigger.intData[1] ?? 0, 0, 23));
        setHourTo(clampValue(trigger.intData[2] ?? 0, 0, 23));
        setMinuteMode(MODE_OPTIONS.includes(trigger.intData[3]) ? trigger.intData[3] : MODE_SKIP);
        setMinuteFrom(clampValue(trigger.intData[4] ?? 0, 0, 59));
        setMinuteTo(clampValue(trigger.intData[5] ?? 0, 0, 59));
        setSecondMode(MODE_OPTIONS.includes(trigger.intData[6]) ? trigger.intData[6] : MODE_SKIP);
        setSecondFrom(clampValue(trigger.intData[7] ?? 0, 0, 59));
        setSecondTo(clampValue(trigger.intData[8] ?? 0, 0, 59));
    }, [ trigger ]);

    const save = () =>
    {
        setIntParams([
            hourMode,
            clampValue(hourFrom, 0, 23),
            clampValue(hourTo, 0, 23),
            minuteMode,
            clampValue(minuteFrom, 0, 59),
            clampValue(minuteTo, 0, 59),
            secondMode,
            clampValue(secondFrom, 0, 59),
            clampValue(secondTo, 0, 59)
        ]);
    };

    return (
        <WiredConditionBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save }>
            <div className="flex flex-col gap-3">
                <TimeFilterSection
                    fromValue={ hourFrom }
                    max={ 23 }
                    min={ 0 }
                    mode={ hourMode }
                    sectionId="matchTimeHour"
                    titleKey="wiredfurni.params.time.hour_selection"
                    toValue={ hourTo }
                    onFromChange={ value => setHourFrom(clampValue(value, 0, 23)) }
                    onModeChange={ setHourMode }
                    onToChange={ value => setHourTo(clampValue(value, 0, 23)) } />
                <TimeFilterSection
                    fromValue={ minuteFrom }
                    max={ 59 }
                    min={ 0 }
                    mode={ minuteMode }
                    sectionId="matchTimeMinute"
                    titleKey="wiredfurni.params.time.minute_selection"
                    toValue={ minuteTo }
                    onFromChange={ value => setMinuteFrom(clampValue(value, 0, 59)) }
                    onModeChange={ setMinuteMode }
                    onToChange={ value => setMinuteTo(clampValue(value, 0, 59)) } />
                <TimeFilterSection
                    fromValue={ secondFrom }
                    max={ 59 }
                    min={ 0 }
                    mode={ secondMode }
                    sectionId="matchTimeSecond"
                    titleKey="wiredfurni.params.time.second_selection"
                    toValue={ secondTo }
                    onFromChange={ value => setSecondFrom(clampValue(value, 0, 59)) }
                    onModeChange={ setSecondMode }
                    onToChange={ value => setSecondTo(clampValue(value, 0, 59)) } />
            </div>
        </WiredConditionBaseView>
    );
};
