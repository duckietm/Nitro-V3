import { AvatarFigurePartType, AvatarScaleType, AvatarSetType, GetAvatarRenderManager, GetRoomEngine, PetFigureData, TextureUtils, Vector3d } from '@nitrots/nitro-renderer';

export class ChatBubbleUtilities
{
    public static AVATAR_COLOR_CACHE: Map<string, number> = new Map();
    public static AVATAR_IMAGE_CACHE: Map<string, string> = new Map();
    public static PET_IMAGE_CACHE: Map<string, string> = new Map();
    private static PET_IMAGE_PENDING_CACHE: Map<string, Promise<string>> = new Map();

    private static placeHolderImageUrl: string = '';

    public static async setFigureImage(figure: string): Promise<string>
    {
        const avatarImage = GetAvatarRenderManager().createAvatarImage(figure, AvatarScaleType.LARGE, null, {
            resetFigure: figure => this.setFigureImage(figure),
            dispose: () =>
            {},
            disposed: false
        });

        if(!avatarImage) return null;

        const isPlaceholder = avatarImage.isPlaceholder();

        if(isPlaceholder && this.placeHolderImageUrl?.length) return this.placeHolderImageUrl;

        figure = avatarImage.getFigure().getFigureString();

        const imageUrl = avatarImage.processAsImageUrl(AvatarSetType.HEAD);
        const color = avatarImage.getPartColor(AvatarFigurePartType.CHEST);

        if(isPlaceholder) this.placeHolderImageUrl = imageUrl;

        this.AVATAR_COLOR_CACHE.set(figure, ((color && color.rgb) || 16777215));
        this.AVATAR_IMAGE_CACHE.set(figure, imageUrl);

        avatarImage.dispose();

        return imageUrl;
    }

    public static async getUserImage(figure: string): Promise<string>
    {
        let existing = this.AVATAR_IMAGE_CACHE.get(figure);

        if(!existing) existing = await this.setFigureImage(figure);

        return existing;
    }

    public static async getPetImage(figure: string, direction: number, _arg_3: boolean, scale: number = 64, posture: string = null)
    {
        const cacheKey = `${ figure }-${ posture || 'std' }-${ direction }-${ scale }`;
        let existing = this.PET_IMAGE_CACHE.get(cacheKey);

        if(existing) return existing;

        const pending = this.PET_IMAGE_PENDING_CACHE.get(cacheKey);

        if(pending) return pending;

        const resultPromise = (async () =>
        {
            const figureData = new PetFigureData(figure);
            const typeId = figureData.typeId;

            const getImageUrl = async (imageResult) =>
            {
                if(!imageResult) return null;

                const image = await imageResult.getImage();

                if(image) return image.src;
                if(imageResult.data) return TextureUtils.generateImageUrl(imageResult.data);

                return null;
            };

            let listenerResolve = null;

            const listenerPromise = new Promise<string>(resolve =>
            {
                listenerResolve = resolve;
            });

            const imageResult = GetRoomEngine().getRoomObjectPetImage(typeId, figureData.paletteId, figureData.color, new Vector3d((direction * 45)), scale, {
                imageReady: async result => listenerResolve(await getImageUrl(result)),
                imageFailed: () => listenerResolve(null)
            }, false, 0, figureData.customParts, posture);

            let resolvedImage: string = null;

            if(imageResult?.id > 0)
            {
                resolvedImage = await Promise.race([
                    listenerPromise,
                    new Promise<string>(resolve => setTimeout(() => resolve(null), 2500))
                ]);
            }

            if(!resolvedImage) resolvedImage = await getImageUrl(imageResult);

            if(resolvedImage) this.PET_IMAGE_CACHE.set(cacheKey, resolvedImage);

            return resolvedImage;
        })();

        this.PET_IMAGE_PENDING_CACHE.set(cacheKey, resultPromise);

        try
        {
            existing = await resultPromise;
        }
        finally
        {
            this.PET_IMAGE_PENDING_CACHE.delete(cacheKey);
        }

        return existing;
    }
}
