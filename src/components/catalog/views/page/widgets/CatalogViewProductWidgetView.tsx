import { GetAvatarRenderManager, GetRoomEngine, GetSessionDataManager, RoomObjectVariable, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { BuildPurchasableClothingFigure, FurniCategory, Offer, ProductTypeEnum } from '../../../../../api';
import { AutoGrid, Column, LayoutGridItem, LayoutRoomPreviewerView } from '../../../../../common';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';

export const CatalogViewProductWidgetView: FC<{}> = props =>
{
    const { currentOffer = null, roomPreviewer = null } = useCatalogData();
    const { purchaseOptions = null } = useCatalogUiState();
    const { previewStuffData = null } = purchaseOptions;

    useEffect(() =>
    {
        if(!currentOffer || (currentOffer.pricingModel === Offer.PRICING_MODEL_BUNDLE) || !roomPreviewer) return;

        const product = currentOffer.product;

        if(!product) return;

        roomPreviewer.reset(false);

        // Mirror the user's current room so the catalog preview shows
        // the item against the wallpaper / floor / landscape they
        // actually have decorated. Same approach as
        // InventoryFurnitureView - read the active room's pattern ids
        // off the room engine, fall back to '101' / '101' / '1.1' if
        // the user isn't in a room yet (those are real Habbo pattern
        // ids, the literal 'default' we used before is not and made
        // the previewer fall back to blank white surfaces).
        const roomEngine = GetRoomEngine();
        let floorType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_FLOOR_TYPE);
        let wallType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_WALL_TYPE);
        let landscapeType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_LANDSCAPE_TYPE);

        floorType = (floorType && floorType.length) ? floorType : '3002';
        wallType = (wallType && wallType.length) ? wallType : '3001';
        landscapeType = (landscapeType && landscapeType.length) ? landscapeType : '1.1';

        roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);

        const populate = () =>
        {
            switch(product.productType)
            {
                case ProductTypeEnum.FLOOR: {
                    if(!product.furnitureData) return;

                    const furniData = GetSessionDataManager().getFloorItemData(product.furnitureData.id);
                    const isPurchasableClothing = (product.furnitureData.specialType === FurniCategory.FIGURE_PURCHASABLE_SET);
                    const hasResolvableFigureSets = (() =>
                    {
                        if(!furniData || !furniData.customParams || !furniData.customParams.length) return false;

                        const parts = furniData.customParams.split(',').map(value => parseInt(value));

                        for(const part of parts)
                        {
                            if(isNaN(part)) continue;

                            if(GetAvatarRenderManager().structureData?.getFigurePartSet(part)) return true;
                        }

                        return false;
                    })();

                    if(isPurchasableClothing || hasResolvableFigureSets)
                    {
                        const customParts = furniData.customParams.split(',').map(value => parseInt(value));
                        const figureSets: number[] = [];

                        for(const part of customParts)
                        {
                            if(isNaN(part)) continue;

                            if(GetAvatarRenderManager().isValidFigureSetForGender(part, GetSessionDataManager().gender)) figureSets.push(part);
                        }

                        const figureString = BuildPurchasableClothingFigure(GetSessionDataManager().figure, figureSets);

                        roomPreviewer.addAvatarIntoRoom(figureString, product.productClassId);
                    }
                    else
                    {
                        roomPreviewer.addFurnitureIntoRoom(product.productClassId, new Vector3d(90), previewStuffData, product.extraParam);
                    }
                    return;
                }
                case ProductTypeEnum.WALL: {
                    if(!product.furnitureData) return;

                    roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);

                    switch(product.furnitureData.specialType)
                    {
                        case FurniCategory.FLOOR:
                            roomPreviewer.updateObjectRoom(product.extraParam);
                            return;
                        case FurniCategory.WALL_PAPER:
                            roomPreviewer.updateObjectRoom(null, product.extraParam);
                            return;
                        case FurniCategory.LANDSCAPE: {
                            roomPreviewer.updateObjectRoom(null, null, product.extraParam);

                            const furniData = GetSessionDataManager().getWallItemDataByName('window_double_default');

                            if(furniData) roomPreviewer.addWallItemIntoRoom(furniData.id, new Vector3d(90), furniData.customParams);
                            return;
                        }
                        default:
                            roomPreviewer.updateObjectRoom('101', '101', '1.1');
                            roomPreviewer.addWallItemIntoRoom(product.productClassId, new Vector3d(90), product.extraParam);
                            return;
                    }
                }
                case ProductTypeEnum.ROBOT:
                    roomPreviewer.addAvatarIntoRoom(product.extraParam, 0);
                    return;
                case ProductTypeEnum.EFFECT:
                    roomPreviewer.addAvatarIntoRoom(GetSessionDataManager().figure, product.productClassId);
                    return;
            }
        };

        populate();

        // RoomPreviewer.addFurnitureIntoRoom / addAvatarIntoRoom flip
        // _automaticStateChange to true, which makes the ticker advance
        // the room object's state every AUTOMATIC_STATE_CHANGE_INTERVAL.
        // In the catalog we want the preview to sit still until the
        // user clicks the state button explicitly - turn it back off
        // after populate() runs.
        roomPreviewer.setAutomaticStateChange(false);
    }, [ currentOffer, previewStuffData, roomPreviewer ]);

    if(!currentOffer) return null;

    if(currentOffer.pricingModel === Offer.PRICING_MODEL_BUNDLE)
    {
        return (
            <Column fit className="bg-muted p-2 rounded" overflow="hidden">
                <AutoGrid fullWidth className="nitro-catalog-layout-bundle-grid" columnCount={ 4 }>
                    { (currentOffer.products.length > 0) && currentOffer.products.map((product, index) =>
                    {
                        return <LayoutGridItem key={ index } itemCount={ product.productCount } itemImage={ product.getIconUrl(currentOffer) } />;
                    }) }
                </AutoGrid>
            </Column>
        );
    }

    // Re-mount the previewer whenever the offer changes so the render
    // latch / texture handle in LayoutRoomPreviewerView resets cleanly.
    // Without this a single broken offer (e.g. blackhole's Pixi filter
    // crash) latches the previewer permanently and every following
    // offer paints nothing - the singleton roomPreviewer + 240px height
    // keep the same component mounted otherwise.
    return <LayoutRoomPreviewerView key={ currentOffer?.offerId } height={ 240 } roomPreviewer={ roomPreviewer } />;
};
