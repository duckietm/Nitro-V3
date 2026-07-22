import { FC, useEffect, useMemo, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { Base, BaseProps } from '../Base';

export interface LayoutRoomThumbnailViewProps extends BaseProps<HTMLDivElement> {
    roomId?: number;
    customUrl?: string;
}

export const LayoutRoomThumbnailView: FC<LayoutRoomThumbnailViewProps> = (props) => {
    const { roomId = -1, customUrl = null, shrink = true, overflow = 'hidden', classNames = [], children = null, ...rest } = props;
    const [hasImage, setHasImage] = useState(true);

    const getClassNames = useMemo(() => {
        const newClassNames: string[] = [
            'relative w-[110px] h-[110px] bg-[url("@/assets/images/navigator/thumbnail_placeholder.png")] bg-no-repeat bg-center',
            'rounded-[6px]',
            'border! border-[solid]! border-[#c4cabf]!'
        ];

        if (classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [classNames]);

    const getImageUrl = useMemo(() => {
        if (customUrl && customUrl.length) return GetConfigurationValue<string>('image.library.url') + customUrl;

        return GetConfigurationValue<string>('thumbnails.url').replace('%thumbnail%', roomId.toString());
    }, [customUrl, roomId]);

    useEffect(() => setHasImage(true), [getImageUrl]);

    return (
        <Base classNames={getClassNames} overflow={overflow} shrink={shrink} {...rest}>
            {hasImage && getImageUrl && <img alt="" className="block h-full w-full object-cover" src={getImageUrl} onError={() => setHasImage(false)} />}
            {children}
        </Base>
    );
};
