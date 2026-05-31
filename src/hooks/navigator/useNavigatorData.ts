import { useBetween } from 'use-between';
import { useNavigatorStore } from './useNavigatorStore';

export const useNavigatorData = () =>
{
    const {
        categories, eventCategories,
        topLevelContext, topLevelContexts,
        navigatorSearches, navigatorData
    } = useBetween(useNavigatorStore);

    return {
        categories, eventCategories,
        topLevelContext, topLevelContexts,
        navigatorSearches, navigatorData
    };
};
