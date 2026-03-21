import { GetLocalizationManager } from '@nitrots/localization';

export const LocalizeBadgeName = (key: string) =>
{
    let badgeName = GetLocalizationManager().getBadgeName(key);

    if(!badgeName || !badgeName.length) badgeName = `badge_name_${ key }`;

    return badgeName;
};
