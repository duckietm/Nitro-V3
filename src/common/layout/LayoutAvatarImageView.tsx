import { AvatarScaleType, AvatarSetType, GetAvatarRenderManager } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';
import { Base, BaseProps } from '../Base';
import { cropAirMeMenuFaceImageUrl, cropOpaqueBoundsImageUrl, cropTransparentImageUrl } from './avatarImageCrop';

const AVATAR_CACHE_MAX_SIZE = 200;
const AVATAR_IMAGE_CACHE: Map<string, string> = new Map();

export interface LayoutAvatarImageViewProps extends BaseProps<HTMLDivElement> {
    figure: string;
    gender?: string;
    headOnly?: boolean;
    direction?: number;
    scale?: number;
    fit?: boolean;
    compactHead?: boolean;
    compactHeadSize?: number;
    compactHeadPadding?: number;
    airMeMenu?: boolean;
}

export const LayoutAvatarImageView: FC<LayoutAvatarImageViewProps> = (props) => {
    const { figure = '', gender = '', headOnly = false, direction = 0, scale = 1, fit = false, compactHead = false, compactHeadSize = 22, compactHeadPadding = 1, airMeMenu = false, classNames = [], style = {}, ...rest } = props;
    const [avatarUrl, setAvatarUrl] = useState<string>(null);
    const [isReady, setIsReady] = useState<boolean>(false);
    const isDisposed = useRef(false);
    const requestIdRef = useRef(0);

    const getClassNames = useMemo(() => {
        let newClassNames: string[];

        if (fit) {
            newClassNames = ['avatar-image avatar-image-fit absolute inset-0 pointer-events-none'];
        } else if (headOnly || airMeMenu) {
            newClassNames = ['avatar-image absolute inset-0 bg-no-repeat pointer-events-none'];
        } else {
            newClassNames = ['avatar-image relative w-[90px] h-[130px] bg-no-repeat left-[-2px] pointer-events-none'];
        }

        if (classNames.length) newClassNames.push(...classNames);
        if (compactHead) newClassNames.push('compact-head');

        return newClassNames;
    }, [classNames, headOnly, fit, compactHead, airMeMenu]);

    const getStyle = useMemo(() => {
        let newStyle: CSSProperties = {};

        if (!fit && avatarUrl && avatarUrl.length) newStyle.backgroundImage = `url('${avatarUrl}')`;

        if (airMeMenu && !fit) {
            newStyle.backgroundSize = '50px 50px';
            newStyle.backgroundPosition = '0 0';
            newStyle.imageRendering = 'pixelated';
        } else if (headOnly && !fit) {
            newStyle.backgroundSize = compactHead ? `${ compactHeadSize }px ${ compactHeadSize }px` : '130px auto';
            newStyle.backgroundPosition = compactHead ? 'center' : '51% 40%';
            newStyle.imageRendering = compactHead ? 'auto' : 'pixelated';
        }

        if (scale !== 1) {
            newStyle.transform = `scale(${scale})`;

            if (!(scale % 1)) newStyle.imageRendering = 'pixelated';
        }

        if (Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [avatarUrl, scale, style, headOnly, fit, compactHead, compactHeadSize, airMeMenu]);

    useEffect(() => {
        if (!isReady) return;

        const requestId = ++requestIdRef.current;
        const figureKey = [figure, gender, direction, headOnly, compactHead, compactHeadSize, compactHeadPadding, fit, airMeMenu].join('-');

        if (AVATAR_IMAGE_CACHE.has(figureKey)) {
            setAvatarUrl(AVATAR_IMAGE_CACHE.get(figureKey));
        } else {
            const resetFigure = async (_figure: string) => {
                if (isDisposed.current || requestIdRef.current !== requestId) return;

                const avatarImage = GetAvatarRenderManager().createAvatarImage(_figure, AvatarScaleType.LARGE, gender, {
                    resetFigure: (figure: string) => resetFigure(figure),
                    dispose: null,
                    disposed: false
                });

                let setType = AvatarSetType.FULL;

                if (headOnly && !airMeMenu) setType = AvatarSetType.HEAD;

                avatarImage.setDirection(setType, direction);

                let imageUrl = avatarImage.processAsImageUrl(setType);

                if(imageUrl && airMeMenu) imageUrl = await cropAirMeMenuFaceImageUrl(imageUrl);

                if(imageUrl && headOnly && compactHead && !airMeMenu) imageUrl = await cropTransparentImageUrl(imageUrl, compactHeadSize, compactHeadPadding);

                // The full-body canvas is 90x130 with the figure occupying
                // only part of it, off-center for some figures. Fit consumers
                // (grid tiles) object-contain the image, so crop the
                // transparent border first — otherwise the figure renders
                // tiny and drifts sideways inside the tile.
                if (imageUrl && fit) imageUrl = await cropOpaqueBoundsImageUrl(imageUrl);

                if (imageUrl && !isDisposed.current && requestIdRef.current === requestId) {
                    if (!avatarImage.isPlaceholder()) {
                        if (AVATAR_IMAGE_CACHE.size >= AVATAR_CACHE_MAX_SIZE) {
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
    }, [figure, gender, direction, headOnly, compactHead, compactHeadSize, compactHeadPadding, fit, airMeMenu, isReady]);

    useEffect(() => {
        isDisposed.current = false;

        setIsReady(true);

        return () => {
            isDisposed.current = true;
        };
    }, []);

    return (
        <Base classNames={getClassNames} style={getStyle} {...rest}>
            {fit && avatarUrl && avatarUrl.length > 0 && (
                <img
                    src={avatarUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                />
            )}
        </Base>
    );
};
