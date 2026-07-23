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
