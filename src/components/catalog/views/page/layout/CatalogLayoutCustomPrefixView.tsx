import { PurchasePrefixComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText, SendMessageComposer, PRESET_PREFIX_EFFECTS, generateGradientColors } from '../../../../../api';
import { PrefixPreview } from '../../../../../layout';
import { CatalogLayoutProps } from './CatalogLayout.types';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const PRESET_COLORS: string[] = [
    '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#00CCFF',
    '#0066FF', '#9933FF', '#FF33CC', '#FFFFFF', '#CCCCCC',
    '#999999', '#333333', '#FF9999', '#99FF99', '#9999FF',
    '#FFD700', '#FF4500', '#00CED1', '#8A2BE2', '#DC143C'
];

export const CatalogLayoutCustomPrefixView: FC<CatalogLayoutProps> = props =>
{
    const { page = null, hideNavigation = null } = props;

    useEffect(() =>
    {
        hideNavigation();
    }, [ page, hideNavigation ]);

    const [ prefixText, setPrefixText ] = useState('');
    const [ colorMode, setColorMode ] = useState<'single' | 'perLetter' | 'gradient'>('single');
    const [ singleColor, setSingleColor ] = useState('#FFFFFF');
    const [ letterColors, setLetterColors ] = useState<Record<number, string>>({});
    const [ selectedLetterIndex, setSelectedLetterIndex ] = useState<number | null>(null);
    const [ customColorInput, setCustomColorInput ] = useState('#FFFFFF');
    const [ gradientStart, setGradientStart ] = useState('#FF0000');
    const [ gradientEnd, setGradientEnd ] = useState('#0066FF');
    const [ selectedIcon, setSelectedIcon ] = useState('');
    const [ showIconPicker, setShowIconPicker ] = useState(false);
    const [ selectedEffect, setSelectedEffect ] = useState('');
    const [ purchased, setPurchased ] = useState(false);
    const pickerContainerRef = useRef<HTMLDivElement>(null);

    // Inject style into emoji-mart Shadow DOM to remove backdrop-filter blur
    useEffect(() =>
    {
        if(!showIconPicker) return;

        const timer = setTimeout(() =>
        {
            const container = pickerContainerRef.current;
            if(!container) return;

            const emPicker = container.querySelector('em-emoji-picker');
            if(!emPicker?.shadowRoot) return;

            const existing = emPicker.shadowRoot.querySelector('#no-blur-fix');
            if(existing) return;

            const style = document.createElement('style');
            style.id = 'no-blur-fix';
            style.textContent = `.sticky { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background-color: rgb(var(--em-rgb-background)) !important; } .menu { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background-color: rgb(var(--em-rgb-background)) !important; }`;
            emPicker.shadowRoot.appendChild(style);
        }, 50);

        return () => clearTimeout(timer);
    }, [ showIconPicker ]);

    const colorString = useMemo(() =>
    {
        if(colorMode === 'single') return singleColor;

        if(colorMode === 'gradient')
        {
            const steps = Math.max(prefixText.length, 2);
            return generateGradientColors(gradientStart, gradientEnd, steps).join(',');
        }

        if(!prefixText.length) return singleColor;

        return [ ...prefixText ].map((_, i) => letterColors[i] || singleColor).join(',');
    }, [ colorMode, singleColor, letterColors, prefixText, gradientStart, gradientEnd ]);

    const isValid = useMemo(() =>
    {
        if(!prefixText.trim().length || prefixText.trim().length > 15) return false;

        if(colorMode === 'single') return /^#[0-9A-Fa-f]{6}$/.test(singleColor);

        if(colorMode === 'gradient')
            return /^#[0-9A-Fa-f]{6}$/.test(gradientStart) && /^#[0-9A-Fa-f]{6}$/.test(gradientEnd);

        const colors = colorString.split(',');
        return colors.every(c => /^#[0-9A-Fa-f]{6}$/.test(c));
    }, [ prefixText, colorMode, singleColor, colorString, gradientStart, gradientEnd ]);

    const handlePurchase = () =>
    {
        if(!isValid) return;

        SendMessageComposer(new PurchasePrefixComposer(prefixText.trim(), colorString, selectedIcon, selectedEffect));
        setPurchased(true);
        setTimeout(() => setPurchased(false), 2000);
    };

    const handleColorSelect = (color: string) =>
    {
        if(colorMode === 'single')
        {
            setSingleColor(color);
            setCustomColorInput(color);
        }
        else if(colorMode === 'perLetter' && selectedLetterIndex !== null)
        {
            setLetterColors(prev => ({ ...prev, [selectedLetterIndex]: color }));
            setCustomColorInput(color);

            // Auto-avanza alla lettera successiva
            if(selectedLetterIndex < prefixText.length - 1)
            {
                const nextIdx = selectedLetterIndex + 1;
                setSelectedLetterIndex(nextIdx);
                setCustomColorInput(letterColors[nextIdx] || singleColor);
            }
        }
    };

    const handleCustomColorChange = (value: string) =>
    {
        setCustomColorInput(value);
        if(/^#[0-9A-Fa-f]{6}$/.test(value))
        {
            if(colorMode === 'single')
            {
                setSingleColor(value);
            }
            else if(colorMode === 'perLetter' && selectedLetterIndex !== null)
            {
                setLetterColors(prev => ({ ...prev, [selectedLetterIndex]: value }));
            }
        }
    };

    const handleTextChange = (newText: string) =>
    {
        setPrefixText(newText);
        if(selectedLetterIndex !== null && selectedLetterIndex >= newText.length)
        {
            setSelectedLetterIndex(newText.length > 0 ? newText.length - 1 : null);
        }
    };

    const applyColorToAll = () =>
    {
        if(!prefixText.length) return;

        const newColors: Record<number, string> = {};
        [ ...prefixText ].forEach((_, i) => { newColors[i] = customColorInput; });
        setLetterColors(newColors);
    };

    const currentActiveColor = colorMode === 'single'
        ? singleColor
        : (selectedLetterIndex !== null ? (letterColors[selectedLetterIndex] || singleColor) : singleColor);

    return (
        <div className="flex flex-col gap-2 h-full overflow-auto p-1">
            { /* Header */ }
            { page.localization.getImage(0) &&
                <img alt="" className="w-full rounded" src={ page.localization.getImage(0) } /> }
            { page.localization.getText(0) &&
                <div className="text-sm mb-1" dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } /> }

            { /* Live Preview */ }
            <div className="relative flex items-center justify-center p-4 rounded-lg min-h-[56px]"
                style={ {
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)'
                } }>
                <div className="absolute inset-0 rounded-lg opacity-20"
                    style={ { background: 'radial-gradient(ellipse at center, rgba(100,149,237,0.3) 0%, transparent 70%)' } } />
                <span className="relative flex items-center">
                    <PrefixPreview
                        className="tracking-wide"
                        color={ colorString }
                        effect={ selectedEffect }
                        icon={ selectedIcon }
                        text={ prefixText || '...' }
                        textSize="text-xl" />
                    <span className="ml-2 text-white/80 text-lg font-medium">Username</span>
                </span>
            </div>

            { /* Chat Bubble Preview */ }
            <div className="relative rounded-lg overflow-hidden p-2"
                style={ { background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' } }>
                <div className="text-[10px] opacity-40 mb-1 uppercase font-bold tracking-wider">{ LocalizeText('catalog.prefix.chat.preview') }</div>
                <div className="chat-bubble bubble-0 type-0 max-w-[350px] relative z-1 wrap-break-word min-h-[26px] text-[14px]">
                    <div className="chat-content py-[5px] px-[6px] ml-[27px] leading-none min-h-[25px]">
                        { (prefixText || '...') &&
                            <PrefixPreview
                                className="mr-1"
                                color={ colorString }
                                effect={ selectedEffect }
                                icon={ selectedIcon }
                                text={ prefixText || '...' }
                                textSize="text-[inherit]" /> }
                        <b className="username">Username: </b>
                        <span className="message">Hello everyone!</span>
                    </div>
                    <div className="pointer absolute left-[50%] translate-x-[-50%] w-[9px] h-[6px] bottom-[-5px]" />
                </div>
            </div>

            { /* Text + Icon Row */ }
            <div className="flex gap-2">
                <div className="flex flex-col gap-0.5 flex-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.text') }</label>
                    <div className="relative">
                        <input
                            className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none transition-all"
                            maxLength={ 15 }
                            placeholder={ LocalizeText('catalog.prefix.text.placeholder') }
                            style={ {
                                background: 'rgba(0,0,0,0.15)',
                                border: '1px solid rgba(0,0,0,0.15)',
                                color: 'inherit'
                            } }
                            type="text"
                            value={ prefixText }
                            onChange={ e => handleTextChange(e.target.value) } />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-30 font-mono">
                            { prefixText.length }/15
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.icon') }</label>
                    <div className="flex gap-1">
                        <button
                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all min-w-[70px]"
                            style={ {
                                background: selectedIcon ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.15)',
                                border: selectedIcon ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(0,0,0,0.15)'
                            } }
                            onClick={ () => setShowIconPicker(!showIconPicker) }>
                            { selectedIcon
                                ? <><span className="text-base">{ selectedIcon }</span><span className="text-[10px] opacity-40">▼</span></>
                                : <span className="opacity-40 text-xs">Emoji ▼</span>
                            }
                        </button>
                        { selectedIcon &&
                            <button
                                className="flex items-center justify-center px-1.5 rounded-md text-xs transition-all"
                                style={ { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' } }
                                title={ LocalizeText('catalog.prefix.icon.remove') }
                                onClick={ () => setSelectedIcon('') }>
                                ✕
                            </button>
                        }
                    </div>
                </div>
            </div>

            { /* Emoji Picker (emoji-mart) - fixed overlay */ }
            { showIconPicker && (
                <>
                    <div className="fixed inset-0" style={ { zIndex: 999, background: 'rgba(0,0,0,0.5)' } } onClick={ () => setShowIconPicker(false) } />
                    <div ref={ pickerContainerRef } className="fixed rounded-xl overflow-hidden" style={ { zIndex: 1000, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' } }>
                        <Picker
                            data={ data }
                            locale="it"
                            onEmojiSelect={ (emoji: { native: string }) => { setSelectedIcon(emoji.native); setShowIconPicker(false); } }
                            theme="dark"
                            previewPosition="none"
                            skinTonePosition="search"
                            perLine={ 8 }
                            maxFrequentRows={ 2 }
                            emojiSize={ 22 }
                            emojiButtonSize={ 30 }
                            dynamicWidth={ false }
                            set="native"
                        />
                    </div>
                </>
            ) }

            { /* Effect Selector */ }
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.effect') }</label>
                <div className="flex flex-wrap gap-1">
                    { PRESET_PREFIX_EFFECTS.map(fx => (
                        <button
                            key={ fx.id }
                            className="px-2 py-1 rounded-md text-[11px] font-semibold transition-all"
                            style={ {
                                background: selectedEffect === fx.id ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)',
                                border: selectedEffect === fx.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(0,0,0,0.1)',
                                opacity: selectedEffect === fx.id ? 1 : 0.7
                            } }
                            onClick={ () => setSelectedEffect(fx.id) }>
                            <span className="mr-0.5">{ fx.icon }</span> { fx.label }
                        </button>
                    )) }
                </div>
            </div>

            { /* Color Mode Toggle */ }
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60">{ LocalizeText('catalog.prefix.color') }</label>
                <div className="flex rounded-md overflow-hidden" style={ { border: '1px solid rgba(0,0,0,0.15)' } }>
                    <button
                        className="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
                        style={ {
                            background: colorMode === 'single' ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)',
                            borderRight: '1px solid rgba(0,0,0,0.1)',
                            opacity: colorMode === 'single' ? 1 : 0.6
                        } }
                        onClick={ () => { setColorMode('single'); setSelectedLetterIndex(null); } }>
                        { LocalizeText('catalog.prefix.color.single') }
                    </button>
                    <button
                        className="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
                        style={ {
                            background: colorMode === 'perLetter' ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)',
                            borderRight: '1px solid rgba(0,0,0,0.1)',
                            opacity: colorMode === 'perLetter' ? 1 : 0.6
                        } }
                        onClick={ () => { setColorMode('perLetter'); if(prefixText.length > 0) setSelectedLetterIndex(0); } }>
                        { LocalizeText('catalog.prefix.color.per.letter') }
                    </button>
                    <button
                        className="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
                        style={ {
                            background: colorMode === 'gradient' ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)',
                            opacity: colorMode === 'gradient' ? 1 : 0.6
                        } }
                        onClick={ () => { setColorMode('gradient'); setSelectedLetterIndex(null); } }>
                        { LocalizeText('catalog.prefix.color.gradient') }
                    </button>
                </div>
            </div>

            { /* Gradient Controls */ }
            { colorMode === 'gradient' && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-1">
                            <label
                                className="relative cursor-pointer shrink-0"
                                style={ {
                                    width: '24px', height: '24px', borderRadius: '6px',
                                    backgroundColor: gradientStart,
                                    border: '2px solid rgba(0,0,0,0.2)',
                                    boxShadow: `0 0 6px ${ gradientStart }40`
                                } }>
                                <input className="absolute inset-0 opacity-0 cursor-pointer" style={ { width: '100%', height: '100%' } }
                                    type="color" value={ gradientStart }
                                    onChange={ e => setGradientStart(e.target.value) } />
                            </label>
                            <input className="flex-1 px-2 py-0.5 text-xs font-mono focus:outline-none"
                                maxLength={ 7 } placeholder="#FF0000"
                                style={ { background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.1)', color: 'inherit', borderRadius: '5px' } }
                                type="text" value={ gradientStart }
                                onChange={ e => { const v = e.target.value; setGradientStart(v); } } />
                        </div>
                        <span className="text-xs opacity-40">→</span>
                        <div className="flex items-center gap-1 flex-1">
                            <label
                                className="relative cursor-pointer shrink-0"
                                style={ {
                                    width: '24px', height: '24px', borderRadius: '6px',
                                    backgroundColor: gradientEnd,
                                    border: '2px solid rgba(0,0,0,0.2)',
                                    boxShadow: `0 0 6px ${ gradientEnd }40`
                                } }>
                                <input className="absolute inset-0 opacity-0 cursor-pointer" style={ { width: '100%', height: '100%' } }
                                    type="color" value={ gradientEnd }
                                    onChange={ e => setGradientEnd(e.target.value) } />
                            </label>
                            <input className="flex-1 px-2 py-0.5 text-xs font-mono focus:outline-none"
                                maxLength={ 7 } placeholder="#0066FF"
                                style={ { background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.1)', color: 'inherit', borderRadius: '5px' } }
                                type="text" value={ gradientEnd }
                                onChange={ e => { const v = e.target.value; setGradientEnd(v); } } />
                        </div>
                    </div>
                    { /* Gradient preview bar */ }
                    <div className="h-2 rounded-full"
                        style={ { background: `linear-gradient(to right, ${ gradientStart }, ${ gradientEnd })` } } />
                </div>
            ) }

            { /* Per-Letter Selector */ }
            { colorMode === 'perLetter' && prefixText.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-50">
                            { LocalizeText('catalog.prefix.color.hint') }
                        </span>
                        <button
                            className="text-[10px] px-1.5 py-0.5 rounded transition-all"
                            style={ {
                                background: 'rgba(0,0,0,0.1)',
                                border: '1px solid rgba(0,0,0,0.1)'
                            } }
                            title={ LocalizeText('catalog.prefix.color.apply.all.title') }
                            onClick={ applyColorToAll }>
                            { LocalizeText('catalog.prefix.color.apply.all') }
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg"
                        style={ {
                            background: 'rgba(0,0,0,0.12)',
                            border: '1px solid rgba(0,0,0,0.1)'
                        } }>
                        { [ ...prefixText ].map((char, i) =>
                        {
                            const charColor = letterColors[i] || singleColor;
                            const isSelected = selectedLetterIndex === i;
                            return (
                                <div
                                    key={ i }
                                    className="relative flex items-center justify-center cursor-pointer transition-all"
                                    style={ {
                                        width: '28px',
                                        height: '34px',
                                        borderRadius: '6px',
                                        background: isSelected
                                            ? 'rgba(59,130,246,0.2)'
                                            : 'rgba(0,0,0,0.12)',
                                        border: isSelected
                                            ? '2px solid rgba(59,130,246,0.6)'
                                            : '1px solid rgba(0,0,0,0.08)',
                                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                        zIndex: isSelected ? 10 : 1,
                                        boxShadow: isSelected ? '0 0 8px rgba(59,130,246,0.3)' : 'none'
                                    } }
                                    onClick={ () => { setSelectedLetterIndex(i); setCustomColorInput(charColor); } }>
                                    <span className="text-sm font-black" style={ { color: charColor } }>
                                        { char }
                                    </span>
                                    <div
                                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
                                        style={ {
                                            width: '14px',
                                            height: '3px',
                                            backgroundColor: charColor,
                                            boxShadow: `0 0 4px ${ charColor }`
                                        } } />
                                </div>
                            );
                        }) }
                    </div>
                </div>
            ) }

            { /* Color Palette (single & perLetter modes) */ }
            { colorMode !== 'gradient' && (
                <div className="flex flex-col gap-1">
                    { colorMode === 'perLetter' && selectedLetterIndex !== null &&
                        <span className="text-[10px] opacity-50 italic">
                            { LocalizeText('catalog.prefix.color.selected') } &quot;{ prefixText[selectedLetterIndex] || '' }&quot;
                        </span>
                    }
                    <div className="grid gap-1" style={ { gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))' } }>
                        { PRESET_COLORS.map((color, idx) =>
                        {
                            const isActive = currentActiveColor === color;
                            return (
                                <div
                                    key={ idx }
                                    className={ `aspect-square rounded cursor-pointer transition-all duration-100 border-2 ${ isActive ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105' }` }
                                    style={ {
                                        backgroundColor: color,
                                        boxShadow: isActive ? `0 0 8px ${ color }, 0 0 0 1px rgba(0,0,0,0.3)` : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.15)',
                                        zIndex: isActive ? 5 : 1
                                    } }
                                    onClick={ () => handleColorSelect(color) } />
                            );
                        }) }
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <label
                            className="relative cursor-pointer"
                            style={ {
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                backgroundColor: customColorInput,
                                border: '2px solid rgba(0,0,0,0.2)',
                                boxShadow: `0 0 6px ${ customColorInput }40, inset 0 1px 0 rgba(255,255,255,0.3)`
                            } }>
                            <input
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                style={ { width: '100%', height: '100%' } }
                                type="color"
                                value={ customColorInput }
                                onChange={ e => handleColorSelect(e.target.value) } />
                        </label>
                        <input
                            className="flex-1 px-2 py-0.5 text-xs font-mono focus:outline-none transition-all"
                            maxLength={ 7 }
                            placeholder="#FFFFFF"
                            style={ {
                                background: 'rgba(0,0,0,0.15)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                color: 'inherit',
                                maxWidth: '80px',
                                borderRadius: '5px'
                            } }
                            type="text"
                            value={ customColorInput }
                            onChange={ e => handleCustomColorChange(e.target.value) } />
                    </div>
                </div>
            ) }

            { /* Purchase Footer */ }
            <div className="flex items-center justify-between mt-auto pt-2"
                style={ { borderTop: '1px solid rgba(0,0,0,0.1)' } }>
                <div className="flex items-center gap-1">
                    <span className="text-xs opacity-60">{ LocalizeText('catalog.prefix.price') }</span>
                    <span className="text-sm font-bold">{ LocalizeText('catalog.prefix.price.amount') }</span>
                </div>
                <button
                    className="px-5 py-1.5 rounded-md text-sm font-bold transition-all"
                    disabled={ !isValid || purchased }
                    style={ {
                        background: !isValid
                            ? 'rgba(0,0,0,0.1)'
                            : purchased
                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: !isValid ? 'rgba(0,0,0,0.3)' : '#fff',
                        cursor: !isValid ? 'not-allowed' : 'pointer',
                        border: !isValid ? '1px solid rgba(0,0,0,0.1)' : 'none',
                        boxShadow: isValid && !purchased ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                        borderRadius: '6px'
                    } }
                    onClick={ handlePurchase }>
                    { purchased ? LocalizeText('catalog.prefix.purchased') : LocalizeText('catalog.prefix.purchase') }
                </button>
            </div>
        </div>
    );
};
