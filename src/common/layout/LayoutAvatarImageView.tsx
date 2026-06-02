import { AvatarScaleType, AvatarSetType, GetAvatarRenderManager } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';
import { Base, BaseProps } from '../Base';

const AVATAR_CACHE_MAX_SIZE = 200;
const AVATAR_IMAGE_CACHE: Map<string, string> = new Map();

export interface LayoutAvatarImageViewProps extends BaseProps<HTMLDivElement>
{
    figure: string;
    gender?: string;
    headOnly?: boolean;
    direction?: number;
    scale?: number;
    fit?: boolean;
}

export const LayoutAvatarImageView: FC<LayoutAvatarImageViewProps> = props =>
{
    const { figure = '', gender = '', headOnly = false, direction = 0, scale = 1, fit = false, classNames = [], style = {}, ...rest } = props;
    const [ avatarUrl, setAvatarUrl ] = useState<string>(null);
    const [ isReady, setIsReady ] = useState<boolean>(false);
    const isDisposed = useRef(false);
    const requestIdRef = useRef(0);

    const getClassNames = useMemo(() =>
    {
        let newClassNames: string[];

        if(fit)
        {
            newClassNames = [ 'avatar-image absolute inset-0 pointer-events-none' ];
        }
        else if(headOnly)
        {
            newClassNames = [ 'avatar-image absolute inset-0 bg-no-repeat pointer-events-none' ];
        }
        else
        {
            newClassNames = [ 'avatar-image relative w-[90px] h-[130px] bg-no-repeat left-[-2px] pointer-events-none' ];
        }

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames, headOnly, fit ]);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(!fit && avatarUrl && avatarUrl.length) newStyle.backgroundImage = `url('${ avatarUrl }')`;

        if(headOnly && !fit)
        {
            newStyle.backgroundSize = '130px auto';
            newStyle.backgroundPosition = '51% 40%';
            newStyle.imageRendering = 'pixelated';
        }

        if(scale !== 1)
        {
            newStyle.transform = `scale(${ scale })`;

            if(!(scale % 1)) newStyle.imageRendering = 'pixelated';
        }

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ avatarUrl, scale, style, headOnly, fit ]);

    useEffect(() =>
    {
        if(!isReady) return;

        const requestId = ++requestIdRef.current;
        const figureKey = [ figure, gender, direction, headOnly ].join('-');

        if(AVATAR_IMAGE_CACHE.has(figureKey))
        {
            setAvatarUrl(AVATAR_IMAGE_CACHE.get(figureKey));
        }
        else
        {
            const resetFigure = (_figure: string) =>
            {
                if(isDisposed.current || (requestIdRef.current !== requestId)) return;

                const avatarImage = GetAvatarRenderManager().createAvatarImage(_figure, AvatarScaleType.LARGE, gender, { resetFigure: (figure: string) => resetFigure(figure), dispose: null, disposed: false });

                let setType = AvatarSetType.FULL;

                if(headOnly) setType = AvatarSetType.HEAD;

                avatarImage.setDirection(setType, direction);

                const imageUrl = avatarImage.processAsImageUrl(setType);

                if(imageUrl && !isDisposed.current && (requestIdRef.current === requestId))
                {
                    if(!avatarImage.isPlaceholder())
                    {
                        if(AVATAR_IMAGE_CACHE.size >= AVATAR_CACHE_MAX_SIZE)
                        {
                            const firstKey = AVATAR_IMAGE_CACHE.keys().next().value;
                            AVATAR_IMAGE_CACHE.delete(firstKey);
                        }

                        AVATAR_IMAGE_CACHE.set(figureKey, imageUrl);
                    }

                    setAvatarUrl(imageUrl);
                }

                avatarImage.dispose();
            };

            resetFigure(figure);
        }
    }, [ figure, gender, direction, headOnly, isReady ]);

    useEffect(() =>
    {
        isDisposed.current = false;

        setIsReady(true);

        return () =>
        {
            isDisposed.current = true;
        };
    }, []);

    return (
        <Base classNames={ getClassNames } style={ getStyle } { ...rest }>
            { fit && avatarUrl && avatarUrl.length > 0 && (
                <img
                    src={ avatarUrl }
                    alt=""
                    draggable={ false }
                    className="absolute inset-0 w-full h-full object-contain"
                    style={ { imageRendering: 'pixelated', transform: 'translateY(-20%)' } }
                />
            ) }
        </Base>
    );
};
