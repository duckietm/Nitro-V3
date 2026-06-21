import {
    AvatarFigurePartType,
    AvatarScaleType,
    AvatarSetType,
    GetAssetManager,
    GetAvatarRenderManager,
    IFigurePart,
    IGraphicAsset,
    IPartColor,
    NitroAlphaFilter,
    NitroContainer,
    NitroRectangle,
    NitroSprite,
    TextureUtils
} from '@nitrots/nitro-renderer';
import { IAvatarEditorCategoryPartItem } from './IAvatarEditorCategoryPartItem';

const MAX_CACHE_BYTES = 200 * 1024 * 1024;

class LRUImageCache {
    private _cache: Map<string, string> = new Map();
    private _currentBytes: number = 0;

    public get(key: string): string | undefined {
        const value = this._cache.get(key);

        if (value !== undefined) {
            this._cache.delete(key);
            this._cache.set(key, value);
        }

        return value;
    }

    public set(key: string, value: string): void {
        if (this._cache.has(key)) {
            const old = this._cache.get(key);

            this._currentBytes -= (key.length + old.length) * 2;
            this._cache.delete(key);
        }

        const entryBytes = (key.length + value.length) * 2;

        while (this._currentBytes + entryBytes > MAX_CACHE_BYTES && this._cache.size > 0) {
            const firstKey = this._cache.keys().next().value;
            const firstValue = this._cache.get(firstKey);

            this._currentBytes -= (firstKey.length + firstValue.length) * 2;
            this._cache.delete(firstKey);
        }

        this._cache.set(key, value);
        this._currentBytes += entryBytes;
    }

    public clear(): void {
        this._cache.clear();
        this._currentBytes = 0;
    }
}

export class AvatarEditorThumbnailsHelper {
    private static THUMBNAIL_CACHE: LRUImageCache = new LRUImageCache();
    private static THUMB_DIRECTIONS: number[] = [2, 6, 0, 4, 3, 1];
    private static ALPHA_FILTER: NitroAlphaFilter = new NitroAlphaFilter({ alpha: 0.2 });
    private static DRAW_ORDER: string[] = [
        AvatarFigurePartType.LEFT_HAND_ITEM,
        AvatarFigurePartType.LEFT_HAND,
        AvatarFigurePartType.LEFT_SLEEVE,
        AvatarFigurePartType.LEFT_COAT_SLEEVE,
        AvatarFigurePartType.BODY,
        AvatarFigurePartType.SHOES,
        AvatarFigurePartType.LEGS,
        AvatarFigurePartType.CHEST,
        AvatarFigurePartType.CHEST_ACCESSORY,
        AvatarFigurePartType.COAT_CHEST,
        AvatarFigurePartType.CHEST_PRINT,
        AvatarFigurePartType.WAIST_ACCESSORY,
        AvatarFigurePartType.RIGHT_HAND,
        AvatarFigurePartType.RIGHT_SLEEVE,
        AvatarFigurePartType.RIGHT_COAT_SLEEVE,
        AvatarFigurePartType.HEAD,
        AvatarFigurePartType.FACE,
        AvatarFigurePartType.EYES,
        AvatarFigurePartType.HAIR,
        AvatarFigurePartType.HAIR_BIG,
        AvatarFigurePartType.FACE_ACCESSORY,
        AvatarFigurePartType.EYE_ACCESSORY,
        AvatarFigurePartType.HEAD_ACCESSORY,
        AvatarFigurePartType.HEAD_ACCESSORY_EXTRA,
        AvatarFigurePartType.RIGHT_HAND_ITEM,
        AvatarFigurePartType.PET,
        'ptl',
        'ptr',
        AvatarFigurePartType.MISC,
        'mcl',
        'mcr'
    ];

    private static getThumbnailKey(setType: string, part: IAvatarEditorCategoryPartItem, partColors?: IPartColor[], isDisabled?: boolean): string {
        let key = `${setType}-${part.partSet.id}`;

        if (partColors?.length) {
            key += '-' + partColors.map((c) => c?.rgb?.toString(16) ?? '0').join(',');
        }

        if (isDisabled) key += '-d';

        return key;
    }

    public static clearCache(): void {
        this.THUMBNAIL_CACHE.clear();
    }

    public static async build(
        setType: string,
        part: IAvatarEditorCategoryPartItem,
        useColors: boolean,
        partColors: IPartColor[],
        isDisabled: boolean = false
    ): Promise<string> {
        if (!setType || !setType.length || !part || !part.partSet || !part.partSet.parts || !part.partSet.parts.length) return null;

        const thumbnailKey = this.getThumbnailKey(setType, part, useColors ? partColors : null, isDisabled);
        const cached = this.THUMBNAIL_CACHE.get(thumbnailKey);

        if (cached) return cached;

        const buildContainer = (part: IAvatarEditorCategoryPartItem, useColors: boolean, partColors: IPartColor[], isDisabled: boolean = false) => {
            const container = new NitroContainer();
            const parts = part.partSet.parts.concat().sort(this.sortByDrawOrder);

            for (const part of parts) {
                if (!part) continue;

                let asset: IGraphicAsset = null;
                let direction = 0;
                let hasAsset = false;

                while (!hasAsset && direction < AvatarEditorThumbnailsHelper.THUMB_DIRECTIONS.length) {
                    const assetName = `${AvatarFigurePartType.SCALE}_${AvatarFigurePartType.STD}_${part.type}_${part.id}_${AvatarEditorThumbnailsHelper.THUMB_DIRECTIONS[direction]}_${AvatarFigurePartType.DEFAULT_FRAME}`;

                    asset = GetAssetManager().getAsset(assetName);

                    if (asset && asset.texture) {
                        hasAsset = true;
                    } else {
                        direction++;
                    }
                }

                if (!hasAsset) {
                    continue;
                }

                const x = asset.offsetX;
                const y = asset.offsetY;

                const sprite = new NitroSprite(asset.texture);

                sprite.position.set(x, y);

                if (useColors && part.colorLayerIndex > 0 && partColors && partColors.length) {
                    const color = partColors[part.colorLayerIndex - 1];

                    if (color) sprite.tint = color.rgb;
                }

                if (isDisabled) container.filters = [AvatarEditorThumbnailsHelper.ALPHA_FILTER];

                container.addChild(sprite);
            }

            return container;
        };

        return new Promise(async (resolve, reject) => {
            const resetFigure = async (figure: string) => {
                const container = buildContainer(part, useColors, partColors, isDisabled);
                const imageUrl = await TextureUtils.generateImageUrl({ target: container, resolution: 1 });

                if (imageUrl) AvatarEditorThumbnailsHelper.THUMBNAIL_CACHE.set(thumbnailKey, imageUrl);

                resolve(imageUrl);
            };

            const figureContainer = GetAvatarRenderManager().createFigureContainer(`${setType}-${part.partSet.id}`);

            if (!GetAvatarRenderManager().isFigureContainerReady(figureContainer)) {
                GetAvatarRenderManager().downloadAvatarFigure(figureContainer, {
                    resetFigure,
                    dispose: null,
                    disposed: false
                });
            } else {
                resetFigure(null);
            }
        });
    }

    public static async buildForFace(figureString: string, isDisabled: boolean = false): Promise<string> {
        if (!figureString || !figureString.length) return null;

        const thumbnailKey = figureString + (isDisabled ? '-d' : '');
        const cached = this.THUMBNAIL_CACHE.get(thumbnailKey);

        if (cached) return cached;

        return new Promise(async (resolve, reject) => {
            const resetFigure = async (figure: string) => {
                const avatarImage = GetAvatarRenderManager().createAvatarImage(figure, AvatarScaleType.LARGE, null, {
                    resetFigure,
                    dispose: null,
                    disposed: false
                });

                if (avatarImage.isPlaceholder()) return;

                const texture = avatarImage.processAsTexture(AvatarSetType.HEAD, false);
                const sprite = new NitroSprite(texture);
                if (isDisabled) sprite.filters = [AvatarEditorThumbnailsHelper.ALPHA_FILTER];
                const frame = AvatarEditorThumbnailsHelper.findOpaqueBoundsFrame(sprite, texture.width, texture.height);
                const imageUrl = await TextureUtils.generateImageUrl({
                    target: sprite,
                    frame
                });

                sprite.destroy();
                avatarImage.dispose();

                AvatarEditorThumbnailsHelper.THUMBNAIL_CACHE.set(thumbnailKey, imageUrl);

                resolve(imageUrl);
            };

            resetFigure(figureString);
        });
    }

    private static findOpaqueBoundsFrame(sprite: NitroSprite, fallbackWidth: number, fallbackHeight: number): NitroRectangle {
        try {
            const data = TextureUtils.getPixels(sprite);
            if (!data) return new NitroRectangle(0, 0, fallbackWidth, fallbackHeight);

            const pixels = data.pixels as Uint8ClampedArray | Uint8Array;
            const width = data.width;
            const height = data.height;
            if (!pixels || width <= 0 || height <= 0) return new NitroRectangle(0, 0, fallbackWidth, fallbackHeight);
            const ALPHA_THRESHOLD = 8;

            let minX = width;
            let minY = height;
            let maxX = -1;
            let maxY = -1;

            for (let y = 0; y < height; y++) {
                const rowStart = y * width * 4;
                for (let x = 0; x < width; x++) {
                    if (pixels[rowStart + x * 4 + 3] > ALPHA_THRESHOLD) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < minX || maxY < minY) return new NitroRectangle(0, 0, fallbackWidth, fallbackHeight);

            return new NitroRectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
        } catch {
            return new NitroRectangle(0, 0, fallbackWidth, fallbackHeight);
        }
    }

    private static sortByDrawOrder(a: IFigurePart, b: IFigurePart): number {
        const indexA = AvatarEditorThumbnailsHelper.DRAW_ORDER.indexOf(a.type);
        const indexB = AvatarEditorThumbnailsHelper.DRAW_ORDER.indexOf(b.type);

        if (indexA < indexB) return -1;

        if (indexA > indexB) return 1;

        if (a.index < b.index) return -1;

        if (a.index > b.index) return 1;

        return 0;
    }
}
