import { FC, useEffect, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { IPrefixItem, LocalizeText, parsePrefixColors, getPrefixEffectStyle, PREFIX_EFFECT_KEYFRAMES } from '../../../../api';
import { useInventoryPrefixes, useNotification } from '../../../../hooks';
import { NitroButton } from '../../../../layout';

const PrefixPreview: FC<{ text: string; color: string; icon: string; effect?: string; className?: string; textSize?: string }> = ({ text, color, icon, effect = '', className = '', textSize = 'text-sm' }) =>
{
    const colors = parsePrefixColors(text, color);
    const hasMultiColor = colors.length > 1 && new Set(colors).size > 1;
    const fxStyle = getPrefixEffectStyle(effect, colors[0] || '#FFFFFF');

    return (
        <span className={ `font-bold ${ textSize } ${ className }` } style={ fxStyle }>
            { effect === 'pulse' && <style>{ PREFIX_EFFECT_KEYFRAMES }</style> }
            { icon && <span className="mr-0.5">{ icon }</span> }
            <span style={ hasMultiColor ? fxStyle : { ...fxStyle, color: colors[0] || '#FFFFFF' } }>
                {'{'}
                { hasMultiColor
                    ? [ ...text ].map((char, i) => (
                        <span key={ i } style={ { color: colors[i] || colors[colors.length - 1], ...getPrefixEffectStyle(effect, colors[i]) } }>{ char }</span>
                    ))
                    : text
                }
                {'}'}
            </span>
        </span>
    );
};

const PrefixItemView: FC<{
    prefix: IPrefixItem;
    isSelected: boolean;
    onClick: () => void;
}> = ({ prefix, isSelected, onClick }) =>
{
    return (
        <div
            className={ `flex items-center justify-center rounded-md border-2 cursor-pointer p-2 transition-colors
                ${ isSelected ? 'border-card-grid-item-active bg-card-grid-item-active' : 'border-card-grid-item-border bg-card-grid-item' }
                ${ prefix.active ? 'ring-2 ring-green-400' : '' }` }
            onClick={ onClick }>
            <PrefixPreview className="truncate" color={ prefix.color } effect={ prefix.effect } icon={ prefix.icon } text={ prefix.text } />
        </div>
    );
};

export const InventoryPrefixView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { prefixes = [], activePrefix = null, selectedPrefix = null, setSelectedPrefix = null, activatePrefix = null, deactivatePrefix = null, deletePrefix = null, activate = null, deactivate = null } = useInventoryPrefixes();
    const { showConfirm = null } = useNotification();

    const attemptDeletePrefix = () =>
    {
        if(!selectedPrefix) return;

        showConfirm(
            `Are you sure you want to delete the prefix {${selectedPrefix.text}}?`,
            () => deletePrefix(selectedPrefix.id),
            null,
            null,
            null,
            LocalizeText('inventory.delete.confirm_delete.title')
        );
    };

    useEffect(() =>
    {
        if(!isVisible) return;

        const id = activate();

        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    return (
        <div className="grid h-full grid-cols-12 gap-2">
            <div className="flex flex-col col-span-7 gap-1 overflow-auto">
                <div className="grid grid-cols-3 gap-1">
                    { prefixes.map(prefix => (
                        <PrefixItemView
                            key={ prefix.id }
                            isSelected={ selectedPrefix?.id === prefix.id }
                            prefix={ prefix }
                            onClick={ () => setSelectedPrefix(prefix) } />
                    )) }
                </div>
                { (!prefixes || prefixes.length === 0) &&
                    <div className="flex items-center justify-center h-full text-sm opacity-50">
                        { LocalizeText('inventory.empty.title') }
                    </div> }
            </div>
            <div className="flex flex-col justify-between col-span-5 overflow-auto">
                { activePrefix &&
                    <div className="flex flex-col gap-1">
                        <span className="text-sm truncate min-h-[1.25rem] leading-5">Active prefix</span>
                        <div className="flex items-center justify-center p-3 rounded-md border-2 border-green-400 bg-card-grid-item">
                            <PrefixPreview color={ activePrefix.color } effect={ activePrefix.effect } icon={ activePrefix.icon } text={ activePrefix.text } textSize="text-lg" />
                        </div>
                    </div> }
                { !activePrefix &&
                    <div className="flex flex-col gap-1">
                        <span className="text-sm truncate min-h-[1.25rem] leading-5">Active prefix</span>
                        <div className="flex items-center justify-center p-3 rounded-md border-2 border-dashed border-card-grid-item-border bg-card-grid-item opacity-50">
                            <span className="text-sm">No active prefix</span>
                        </div>
                    </div> }
                { !!selectedPrefix &&
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center justify-center gap-2 p-2 rounded bg-card-grid-item">
                            <PrefixPreview color={ selectedPrefix.color } effect={ selectedPrefix.effect } icon={ selectedPrefix.icon } text={ selectedPrefix.text } textSize="text-lg" />
                        </div>
                        <div className="flex items-center gap-2">
                            <NitroButton
                                className="grow"
                                onClick={ () => selectedPrefix.active ? deactivatePrefix() : activatePrefix(selectedPrefix.id) }>
                                { selectedPrefix.active ? 'Deactivate' : 'Activate' }
                            </NitroButton>
                            { !selectedPrefix.active &&
                                <NitroButton className="bg-danger! hover:bg-danger/80! p-1" onClick={ attemptDeletePrefix }>
                                    <FaTrashAlt className="fa-icon" />
                                </NitroButton> }
                        </div>
                    </div> }
            </div>
        </div>
    );
};
