import { AvatarAction, AvatarScaleType, AvatarSetType, GetAvatarRenderManager } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useRef, useState } from 'react';
import { LayoutAvatarImageView } from '../../../../common';

const WALK_FRAME_COUNT = 4;
const WALK_FRAME_MS = 120;

const WALK_FRAME_CACHE: Map<string, string[]> = new Map();
const WALK_FRAME_CACHE_MAX = 64;

interface SnowWarAvatarViewProps
{
    figure: string;
    gender: string;
    direction: number;
    walking: boolean;
    frameNow: number;
    scale?: number;
}

/**
 * Arena avatar with a real walk cycle. While walking it renders the avatar
 * imager's 'mv' posture frames (cycled off the arena's rAF clock); standing
 * falls back to the shared static LayoutAvatarImageView, whose canvas
 * geometry is identical so switching poses never shifts the sprite.
 */
export const SnowWarAvatarView: FC<SnowWarAvatarViewProps> = (props) =>
{
    const { figure, gender, direction, walking, frameNow, scale = 1 } = props;
    const [frames, setFrames] = useState<string[]>(null);
    const isDisposed = useRef(false);
    const requestIdRef = useRef(0);

    useEffect(() =>
    {
        isDisposed.current = false;

        const requestId = ++requestIdRef.current;
        const cacheKey = [figure, gender, direction].join('|');

        const cached = WALK_FRAME_CACHE.get(cacheKey);
        if (cached)
        {
            setFrames(cached);
            return;
        }

        setFrames(null);

        // Same reset/retry contract as LayoutAvatarImageView: the first pass
        // may render placeholders while figure assets download; resetFigure
        // fires again once they land and the real frames replace them.
        const renderFrames = (renderFigure: string) =>
        {
            if (isDisposed.current || (requestIdRef.current !== requestId)) return;

            const avatarImage = GetAvatarRenderManager().createAvatarImage(renderFigure, AvatarScaleType.LARGE, gender, {
                resetFigure: (updatedFigure: string) => renderFrames(updatedFigure),
                dispose: null,
                disposed: false
            });

            if (!avatarImage) return;

            avatarImage.setDirection(AvatarSetType.FULL, direction);
            avatarImage.appendAction(AvatarAction.POSTURE, AvatarAction.POSTURE_WALK);

            const rendered: string[] = [];

            for (let frame = 0; frame < WALK_FRAME_COUNT; frame++)
            {
                avatarImage.resetAnimationFrameCounter();
                avatarImage.updateAnimationByFrames(frame);
                rendered.push(avatarImage.processAsImageUrl(AvatarSetType.FULL));
            }

            const isPlaceholder = avatarImage.isPlaceholder();

            avatarImage.dispose();

            if (isDisposed.current || (requestIdRef.current !== requestId)) return;
            if (rendered.some(url => !url)) return;

            if (!isPlaceholder)
            {
                if (WALK_FRAME_CACHE.size >= WALK_FRAME_CACHE_MAX)
                {
                    const firstKey = WALK_FRAME_CACHE.keys().next().value;
                    WALK_FRAME_CACHE.delete(firstKey);
                }

                WALK_FRAME_CACHE.set(cacheKey, rendered);
            }

            setFrames(rendered);
        };

        renderFrames(figure);

        return () =>
        {
            isDisposed.current = true;
        };
    }, [figure, gender, direction]);

    if (!walking || !frames)
    {
        return <LayoutAvatarImageView direction={direction} figure={figure} gender={gender} scale={scale} />;
    }

    const frameUrl = frames[Math.floor(frameNow / WALK_FRAME_MS) % WALK_FRAME_COUNT];

    const style: CSSProperties = { backgroundImage: `url('${frameUrl}')` };

    if (scale !== 1)
    {
        style.transform = `scale(${scale})`;
        if (!(scale % 1)) style.imageRendering = 'pixelated';
    }

    return <div className="avatar-image relative w-[90px] h-[130px] bg-no-repeat left-[-2px] pointer-events-none" style={style} />;
};
