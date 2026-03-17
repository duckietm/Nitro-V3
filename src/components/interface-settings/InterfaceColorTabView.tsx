import { RgbaColorPicker, RgbaColor } from 'react-colorful';
import { FC, useCallback, useMemo, useState } from 'react';
import { FaUndo, FaTrash, FaPen, FaFillDrip, FaSave } from 'react-icons/fa';
import { PRESET_COLORS, useUiSettings } from '../../api';
import { Flex, Text } from '../../common';

const hexToRgba = (hex: string, a = 1): RgbaColor =>
{
    const num = parseInt(hex.replace('#', ''), 16);
    return { r: (num >> 16) & 0xFF, g: (num >> 8) & 0xFF, b: num & 0xFF, a };
};

const rgbaToHex = (rgba: RgbaColor): string =>
{
    return '#' + ((1 << 24) + (rgba.r << 16) + (rgba.g << 8) + rgba.b).toString(16).slice(1);
};

export const InterfaceColorTabView: FC<{}> = () =>
{
    const { settings, updateSettings, resetSettings } = useUiSettings();
    const [ color, setColor ] = useState<RgbaColor>(() => hexToRgba(settings.headerColor, settings.headerAlpha / 100));

    const hexColor = useMemo(() => rgbaToHex(color), [ color ]);
    const alphaPercent = useMemo(() => Math.round((color.a ?? 1) * 100), [ color ]);

    const onHexInput = useCallback((value: string) =>
    {
        const clean = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
        if(clean.length === 6)
        {
            const rgba = hexToRgba('#' + clean, color.a);
            setColor(rgba);
        }
    }, [ color.a ]);

    const onRgbInput = useCallback((channel: 'r' | 'g' | 'b', value: number) =>
    {
        const clamped = Math.max(0, Math.min(255, value || 0));
        setColor(prev => ({ ...prev, [channel]: clamped }));
    }, []);

    const onAlphaInput = useCallback((value: number) =>
    {
        const clamped = Math.max(0, Math.min(100, value || 0));
        setColor(prev => ({ ...prev, a: clamped / 100 }));
    }, []);

    const onPresetClick = useCallback((presetHex: string) =>
    {
        setColor(hexToRgba(presetHex, color.a));
    }, [ color.a ]);

    const onSave = useCallback(() =>
    {
        updateSettings({
            colorMode: 'color',
            headerColor: hexColor,
            headerAlpha: alphaPercent
        });
    }, [ updateSettings, hexColor, alphaPercent ]);

    const onReset = useCallback(() =>
    {
        resetSettings();
        setColor(hexToRgba('#1E7295', 1));
    }, [ resetSettings ]);

    const onDelete = useCallback(() =>
    {
        updateSettings({ colorMode: 'default' });
        setColor(hexToRgba('#1E7295', 1));
    }, [ updateSettings ]);

    return (
        <Flex column gap={ 2 } className="items-center p-2">
            <div className="w-[280px]">
                <RgbaColorPicker color={ color } onChange={ setColor } style={ { width: '100%', height: '180px' } } />
            </div>
            <Flex gap={ 1 } className="items-center mt-1">
                <Flex column className="items-center">
                    <input
                        className="form-control form-control-sm text-center w-[70px]"
                        value={ hexColor.replace('#', '').toUpperCase() }
                        onChange={ e => onHexInput(e.target.value) }
                        maxLength={ 6 }
                    />
                    <Text small className="text-black">Hex</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ color.r }
                        onChange={ e => onRgbInput('r', parseInt(e.target.value)) }
                        min={ 0 } max={ 255 }
                    />
                    <Text small className="text-black">R</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ color.g }
                        onChange={ e => onRgbInput('g', parseInt(e.target.value)) }
                        min={ 0 } max={ 255 }
                    />
                    <Text small className="text-black">G</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ color.b }
                        onChange={ e => onRgbInput('b', parseInt(e.target.value)) }
                        min={ 0 } max={ 255 }
                    />
                    <Text small className="text-black">B</Text>
                </Flex>
                <Flex column className="items-center">
                    <input
                        type="number"
                        className="form-control form-control-sm text-center w-[45px]"
                        value={ alphaPercent }
                        onChange={ e => onAlphaInput(parseInt(e.target.value)) }
                        min={ 0 } max={ 100 }
                    />
                    <Text small className="text-black">A</Text>
                </Flex>
            </Flex>
            <div className="grid grid-cols-10 gap-0.5 mt-1">
                { PRESET_COLORS.map((presetHex, i) => (
                    <div
                        key={ i }
                        className="w-[24px] h-[24px] rounded cursor-pointer border border-black/20 hover:scale-110 transition-transform"
                        style={ { backgroundColor: presetHex } }
                        onClick={ () => onPresetClick(presetHex) }
                    />
                )) }
            </div>
            <Flex gap={ 1 } className="w-full mt-2">
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white"
                    style={ { backgroundColor: '#5f9ea0' } }
                    onClick={ onReset }
                >
                    <FaUndo size={ 14 } />
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white"
                    style={ { backgroundColor: '#5f9ea0' } }
                    onClick={ onDelete }
                >
                    <FaTrash size={ 14 } />
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white"
                    style={ { backgroundColor: '#b0b0b0' } }
                >
                    <FaPen size={ 14 } />
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded cursor-pointer text-white"
                    style={ { backgroundColor: '#5f9ea0' } }
                    onClick={ onSave }
                >
                    <FaFillDrip size={ 14 } />
                </button>
            </Flex>
            <button
                className="w-full py-2 rounded cursor-pointer text-white font-bold flex items-center justify-center gap-2"
                style={ { backgroundColor: '#008000' } }
                onClick={ onSave }
            >
                <FaSave size={ 14 } />
                Salva colore
            </button>
        </Flex>
    );
};
