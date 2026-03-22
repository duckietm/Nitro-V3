import { FC, useMemo } from 'react';
import { parsePrefixColors, getPrefixEffectStyle } from '../api';

interface PrefixPreviewProps
{
    text: string;
    color: string;
    icon?: string;
    effect?: string;
    className?: string;
    textSize?: string;
}

export const PrefixPreview: FC<PrefixPreviewProps> = ({ text, color, icon = '', effect = '', className = '', textSize = 'text-sm' }) =>
{
    const colors = useMemo(() => parsePrefixColors(text, color), [ text, color ]);
    const hasMultiColor = colors.length > 1 && new Set(colors).size > 1;
    const fxStyle = useMemo(() => getPrefixEffectStyle(effect, colors[0] || '#FFFFFF'), [ effect, colors ]);
    const isWave = effect === 'wave';

    return (
        <span className={ `font-bold ${ textSize } ${ className }` } style={ fxStyle }>
            { icon && <span className="mr-0.5">{ icon }</span> }
            <span style={ hasMultiColor ? fxStyle : { ...fxStyle, color: colors[0] || '#FFFFFF' } }>
                {'{'}
                { (hasMultiColor || isWave)
                    ? [ ...text ].map((char, i) =>
                    {
                        const charStyle: Record<string, string | number> = {
                            color: colors[i] || colors[colors.length - 1],
                            ...getPrefixEffectStyle(effect, colors[i])
                        };

                        if(isWave)
                        {
                            charStyle.display = 'inline-block';
                            charStyle.animationDelay = `${ i * 0.08 }s`;
                        }

                        return <span key={ i } style={ charStyle }>{ char }</span>;
                    })
                    : text
                }
                {'}'}
            </span>
        </span>
    );
};
