import { useCallback } from 'react';
import { ToggleFavoriteRoom } from '../../api';
import { useNavigatorFavouritesStore } from './navigatorFavouritesStore';

export const useNavigatorFavourite = (roomId: number) => {
    const isFavourite = useNavigatorFavouritesStore((s) => s.ids.has(Number(roomId)));

    const toggle = useCallback(() => ToggleFavoriteRoom(Number(roomId), isFavourite), [roomId, isFavourite]);

    return { isFavourite, toggle };
};
