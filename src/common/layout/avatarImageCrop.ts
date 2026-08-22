export interface OpaqueBounds
{
    x: number;
    y: number;
    width: number;
    height: number;
}

export const findOpaqueBounds = (pixels: Uint8ClampedArray, width: number, height: number): OpaqueBounds =>
{
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            if(pixels[((y * width) + x) * 4 + 3] === 0) continue;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
    }

    if(right < left || bottom < top) return { x: 0, y: 0, width, height };
    return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
};

export const fitBoundsIntoSquare = (bounds: OpaqueBounds, size: number = 22, padding: number = 1): OpaqueBounds =>
{
    const availableSize = Math.max(1, size - (padding * 2));
    const scale = Math.min(availableSize / bounds.width, availableSize / bounds.height);
    const width = Math.max(1, Math.round(bounds.width * scale));
    const height = Math.max(1, Math.round(bounds.height * scale));

    return { x: Math.floor((size - width) / 2), y: Math.floor((size - height) / 2), width, height };
};

/**
 * Crops the transparent border off an image at native resolution (no
 * scaling). Full-body avatar canvases are 90x130 with the figure occupying
 * only part of it — and not always centered — so tile layouts that
 * object-fit the raw canvas end up with tiny, drifting figures. Returns the
 * original url unchanged when nothing can be cropped.
 */
export const cropOpaqueBoundsImageUrl = (imageUrl: string, padding: number = 2): Promise<string> => new Promise(resolve =>
{
    const image = new Image();
    image.onload = () =>
    {
        try
        {
            const source = document.createElement('canvas');
            source.width = image.naturalWidth;
            source.height = image.naturalHeight;
            const sourceContext = source.getContext('2d', { willReadFrequently: true });
            if(!sourceContext) return resolve(imageUrl);
            sourceContext.drawImage(image, 0, 0);
            const bounds = findOpaqueBounds(sourceContext.getImageData(0, 0, source.width, source.height).data, source.width, source.height);
            const x = Math.max(0, bounds.x - padding);
            const y = Math.max(0, bounds.y - padding);
            const width = Math.min(source.width - x, bounds.width + (padding * 2));
            const height = Math.min(source.height - y, bounds.height + (padding * 2));
            if((width >= source.width) && (height >= source.height)) return resolve(imageUrl);
            const output = document.createElement('canvas');
            output.width = width;
            output.height = height;
            const outputContext = output.getContext('2d');
            if(!outputContext) return resolve(imageUrl);
            outputContext.imageSmoothingEnabled = false;
            outputContext.drawImage(source, x, y, width, height, 0, 0, width, height);
            resolve(output.toDataURL('image/png'));
        }
        catch
        {
            resolve(imageUrl);
        }
    };
    image.onerror = () => resolve(imageUrl);
    image.src = imageUrl;
});

export const cropTransparentImageUrl = (imageUrl: string, targetSize: number = 22, padding: number = 1): Promise<string> => new Promise(resolve =>
{
    const image = new Image();
    image.onload = () =>
    {
        try
        {
            const source = document.createElement('canvas');
            source.width = image.naturalWidth;
            source.height = image.naturalHeight;
            const sourceContext = source.getContext('2d', { willReadFrequently: true });
            if(!sourceContext) return resolve(imageUrl);
            sourceContext.drawImage(image, 0, 0);
            const bounds = findOpaqueBounds(sourceContext.getImageData(0, 0, source.width, source.height).data, source.width, source.height);
            const destination = fitBoundsIntoSquare(bounds, targetSize, padding);
            const output = document.createElement('canvas');
            output.width = targetSize;
            output.height = targetSize;
            const outputContext = output.getContext('2d');
            if(!outputContext) return resolve(imageUrl);
            outputContext.imageSmoothingEnabled = true;
            outputContext.imageSmoothingQuality = 'high';
            outputContext.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, destination.x, destination.y, destination.width, destination.height);
            resolve(output.toDataURL('image/png'));
        }
        catch
        {
            resolve(imageUrl);
        }
    };
    image.onerror = () => resolve(imageUrl);
    image.src = imageUrl;
});

/** AIR MeMenuNewIconLoader: HabboFaceFocuser.focusUserFace full dir 3 then cutCircle r=20. */
export const cropAirMeMenuFaceImageUrl = (imageUrl: string): Promise<string> => new Promise(resolve =>
{
    const image = new Image();
    image.onload = () =>
    {
        try
        {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const context = canvas.getContext('2d');
            if(!context) return resolve(imageUrl);
            context.imageSmoothingEnabled = false;
            const sx = Math.min(21, Math.max(0, image.naturalWidth - 50));
            const sy = Math.min(30, Math.max(0, image.naturalHeight - 50));
            const sw = Math.min(50, image.naturalWidth - sx);
            const sh = Math.min(50, image.naturalHeight - sy);
            context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
            context.globalCompositeOperation = 'destination-in';
            context.beginPath();
            context.arc(25, 25, 20, 0, Math.PI * 2);
            context.fill();
            resolve(canvas.toDataURL('image/png'));
        }
        catch
        {
            resolve(imageUrl);
        }
    };
    image.onerror = () => resolve(imageUrl);
    image.src = imageUrl;
});
