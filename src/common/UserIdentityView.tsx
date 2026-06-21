import { FC, Fragment, ReactNode, useMemo } from 'react';
import { GetNickIconUrl } from '../assets/images/user_custom/nick_icons';
import { getPrefixEffectStyle, getPrefixFontStyle, parseFontSegments, parsePrefixColors } from '../api';

const renderInlineFontMarkup = (text: string): ReactNode =>
{
    if(!text) return text;
    if(text.indexOf('<font') === -1) return text;

    const segments = parseFontSegments(text);

    if(!segments.length) return text;

    return segments.map((segment, index) =>
    {
        if(segment.color) return <span key={ index } style={ { color: segment.color } }>{ segment.text }</span>;

        return <Fragment key={ index }>{ segment.text }</Fragment>;
    });
};

interface UserIdentityViewProps
{
    username: string;
    nickIcon?: string;
    prefixText?: string;
    prefixColor?: string;
    prefixIcon?: string;
    prefixEffect?: string;
    prefixFont?: string;
    displayOrder?: string;
    showColon?: boolean;
    className?: string;
    iconClassName?: string;
    nameClassName?: string;
    prefixClassName?: string;
}

const sanitizeDisplayOrder = (displayOrder?: string) =>
{
    const fallback = [ 'icon', 'prefix', 'name' ];

    if(!displayOrder?.length) return fallback;

    const parts = displayOrder.toLowerCase().split('-');

    if(parts.length !== 3) return fallback;

    const unique = new Set(parts);

    if(unique.size !== 3) return fallback;

    if(parts.some(part => !fallback.includes(part))) return fallback;

    return parts;
};

export const UserIdentityView: FC<UserIdentityViewProps> = ({
    username = '',
    nickIcon = '',
    prefixText = '',
    prefixColor = '',
    prefixIcon = '',
    prefixEffect = '',
    prefixFont = '',
    displayOrder = 'icon-prefix-name',
    showColon = false,
    className = '',
    iconClassName = 'inline-block w-auto h-auto align-[-1px]',
    nameClassName = 'username font-bold',
    prefixClassName = ''
}) =>
{
    const nickIconUrl = GetNickIconUrl(nickIcon);
    const prefixColors = useMemo(() => parsePrefixColors(prefixText, prefixColor), [ prefixText, prefixColor ]);
    const hasMultiColor = (prefixColors.length > 1) && (new Set(prefixColors).size > 1);
    const prefixStyle = getPrefixEffectStyle(prefixEffect, prefixColors[0] || '#FFFFFF');
    const prefixFontStyle = getPrefixFontStyle(prefixFont);
    const displayParts = sanitizeDisplayOrder(displayOrder);

    const parts = displayParts.map(part =>
    {
        switch(part)
        {
            case 'icon':
                if(!nickIconUrl) return null;

                return <img key="identity-icon" className={ `${ iconClassName } mr-1` } src={ nickIconUrl } alt="" />;
            case 'prefix':
                if(!prefixText?.length) return null;

                return (
                    <span key="identity-prefix" className={ `prefix inline-block whitespace-nowrap font-bold mr-1 ${ prefixClassName }` } style={ { ...prefixFontStyle, ...prefixStyle } }>
                        { prefixIcon && <span className="mr-0.5 text-[13px] leading-none">{ prefixIcon }</span> }
                        <span style={ hasMultiColor ? { ...prefixFontStyle, ...prefixStyle } : { ...prefixFontStyle, ...prefixStyle, color: prefixColors[0] || '#FFFFFF' } }>
                            {'{'}
                            { hasMultiColor
                                ? [ ...prefixText ].map((char, index) => (
                                    <span key={ index } style={ { ...prefixFontStyle, color: prefixColors[index] || prefixColors[prefixColors.length - 1], ...getPrefixEffectStyle(prefixEffect, prefixColors[index]) } }>{ char }</span>
                                ))
                                : prefixText }
                            {'}'}
                        </span>
                    </span>
                );
            case 'name':
                return <span key="identity-name" className={ `${ nameClassName } whitespace-nowrap` }>{ renderInlineFontMarkup(username) }{ showColon ? ':' : '' }{ showColon ? ' ' : '' }</span>;
            default:
                return null;
        }
    }).filter(Boolean);

    return (
        <span className={ `inline-flex items-center whitespace-nowrap align-middle ${ className }` }>
            { parts }
        </span>
    );
};
