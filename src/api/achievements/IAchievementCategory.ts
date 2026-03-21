import { AchievementData } from '@nitrots/communication';

export interface IAchievementCategory
{
    code: string;
    achievements: AchievementData[];
}
