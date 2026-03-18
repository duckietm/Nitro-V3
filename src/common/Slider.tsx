import { FC } from 'react';
import ReactSlider, { ReactSliderProps } from 'react-slider';
import { Button } from './Button';
import { Flex } from './Flex';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

export interface SliderProps extends ReactSliderProps
{
    disabledButton?: boolean;
}

export const Slider: FC<SliderProps> = props =>
{
    const { disabledButton, max, min, step, value, onChange, ...rest } = props;
    const currentValue = Array.isArray(value) ? value[0] : ((typeof value === 'number') ? value : 0);
    const minimum = (typeof min === 'number') ? min : 0;
    const maximum = (typeof max === 'number') ? max : 0;
    const buttonStep = ((typeof step === 'number') && (step > 0)) ? step : 1;

    const roundToStep = (nextValue: number) =>
    {
        if(typeof buttonStep !== 'number') return nextValue;

        const decimalStep = buttonStep.toString();
        const precision = decimalStep.includes('.') ? (decimalStep.length - decimalStep.indexOf('.') - 1) : 0;

        return parseFloat(nextValue.toFixed(precision));
    };

    return <Flex fullWidth gap={ 1 }>
        { !disabledButton && <Button disabled={ minimum >= currentValue } onClick={ () => onChange(roundToStep(minimum < currentValue ? currentValue - buttonStep : minimum), 0) }><FaAngleLeft /></Button> }
        <ReactSlider className={ 'nitro-slider' } max={ max } min={ min } step={ step } value={ value } onChange={ onChange } { ...rest } />
        { !disabledButton && <Button disabled={ maximum <= currentValue } onClick={ () => onChange(roundToStep(maximum > currentValue ? currentValue + buttonStep : maximum), 0) }><FaAngleRight /></Button> }
    </Flex>;
}
