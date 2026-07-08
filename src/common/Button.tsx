import { FC, useMemo } from 'react';
import { Flex, FlexProps } from './Flex';
import { ButtonSizeType, ColorVariantType } from './types';

export interface ButtonProps extends FlexProps {
    variant?: ColorVariantType;
    size?: ButtonSizeType;
    active?: boolean;
    disabled?: boolean;
}

export const Button: FC<ButtonProps> = (props) => {
    const { variant = 'primary', size = 'sm', active = false, disabled = false, classNames = [], ...rest } = props;

    const getClassNames = useMemo(() => {
        // fucked up method i know (i dont have a clue what im doing because im a ninja)

        const newClassNames: string[] = [
            'pointer-events-auto font-normal leading-normal text-[#fff] text-center no-underline cursor-pointer select-none border border-[solid] border-transparent px-[.75rem] py-[.375rem] text-[.9rem] rounded-[.25rem] [transition:color_.15s_ease-in-out,background-color_.15s_ease-in-out,border-color_.15s_ease-in-out,box-shadow_.15s_ease-in-out]'
        ];

        if (variant) {
            if (variant == 'primary')
                newClassNames.push(
                    'text-white bg-[#418db0] border-[#2e6f8a] [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-white hover:bg-[#3789a8] hover:border-[#2e6f8a]'
                );

            if (variant == 'success')
                newClassNames.push(
                    'text-white  bg-[#00800b] border-[#00800b] [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-white  hover:bg-[#006d09] hover:border-[#006609]'
                );

            if (variant == 'danger')
                newClassNames.push(
                    'text-white bg-[#a81a12] border-[#a81a12] [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-white  hover:bg-[#8f160f] hover:border-[#86150e]'
                );

            if (variant == 'warning')
                newClassNames.push(
                    'text-white bg-[#ffc107] border-[#ffc107] [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-[#000] hover:bg-[#ffca2c] hover:border-[#ffc720]'
                );

            if (variant == 'black')
                newClassNames.push(
                    'text-white  bg-[#000] border-[#000] [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-white  hover:bg-[#000] hover:border-[#000]'
                );

            if (variant == 'secondary')
                newClassNames.push(
                    'text-[#151515] bg-[#d4e6ef] border-[#376275] [box-shadow:inset_0_2px_#ffffff80,inset_0_-2px_#00000014,0_1px_#00000014] hover:text-[#151515] hover:bg-[#e0eff6] hover:border-[#376275]'
                );

            if (variant == 'dark')
                newClassNames.push(
                    'text-white bg-dark [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-white hover:bg-[#18181bfb] hover:border-[#161619fb]'
                );

            if (variant == 'gray')
                newClassNames.push(
                    'text-white bg-[#418db0] border-[#2e6f8a] [box-shadow:inset_0_2px_#ffffff26,inset_0_-2px_#0000001a,0_1px_#0000001a] hover:text-white hover:bg-[#3789a8] hover:border-[#2e6f8a]'
                );
        }

        if (size) {
            if (size == 'sm') {
                newClassNames.push('px-[.5rem]! py-[.25rem]! text-[.7875rem]! rounded-[.2rem]! min-h-[28px]!');
            }
        }

        if (active) newClassNames.push('active');

        if (disabled) newClassNames.push('pointer-events-none opacity-[.65] [box-shadow:none]');

        if (classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [variant, size, active, disabled, classNames]);

    return <Flex center display="inline-flex" classNames={getClassNames} {...rest} />;
};
