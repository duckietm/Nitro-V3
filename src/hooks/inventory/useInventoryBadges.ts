import { BadgeReceivedEvent, BadgesEvent, RequestBadgesComposer, SetActivatedBadgesComposer } from '@nitrots/nitro-renderer';
import { useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { GetConfigurationValue, SendMessageComposer, UnseenItemCategory } from '../../api';
import { useMessageEvent } from '../events';
import { useSharedVisibility } from '../useSharedVisibility';
import { useInventoryUnseenTracker } from './useInventoryUnseenTracker';

const useInventoryBadgesState = () =>
{
    const [ needsUpdate, setNeedsUpdate ] = useState(true);
    const [ badgeCodes, setBadgeCodes ] = useState<string[]>([]);
    const [ badgeIds, setBadgeIds ] = useState<Map<string, number>>(new Map<string, number>());
    const [ activeBadgeCodes, setActiveBadgeCodes ] = useState<string[]>([]);
    const [ selectedBadgeCode, setSelectedBadgeCode ] = useState<string>(null);
    const { isVisible = false, activate = null, deactivate = null } = useSharedVisibility();
    const { isUnseen = null, resetCategory = null } = useInventoryUnseenTracker();

    const maxBadgeCount = GetConfigurationValue<number>('user.badges.max.slots', 5);
    const localChangeRef = useRef(false);
    const isWearingBadge = (badgeCode: string) => (activeBadgeCodes.indexOf(badgeCode) >= 0);
    const canWearBadges = () => (activeBadgeCodes.length < maxBadgeCount);

    const sendActiveBadges = (badges: string[]) =>
    {
        localChangeRef.current = true;
        const composer = new SetActivatedBadgesComposer();
        for(let i = 0; i < maxBadgeCount; i++) composer.addActivatedBadge(badges[i] ?? '');
        SendMessageComposer(composer);
    };

    const toggleBadge = (badgeCode: string) =>
    {
        setActiveBadgeCodes(prevValue =>
        {
            const newValue = [ ...prevValue ];

            const index = newValue.indexOf(badgeCode);

            if(index === -1)
            {
                if(newValue.length >= maxBadgeCount) return prevValue;

                newValue.push(badgeCode);
            }
            else
            {
                newValue.splice(index, 1);
            }

            sendActiveBadges(newValue);

            return newValue;
        });
    };

    const getBadgeId = (badgeCode: string) =>
    {
        const index = badgeCodes.indexOf(badgeCode);

        if(index === -1) return 0;

        return (badgeIds.get(badgeCode) ?? 0);
    };

    useMessageEvent<BadgesEvent>(BadgesEvent, event =>
    {
        const parser = event.getParser();
        const allBadgeCodes = parser.getAllBadgeCodes();

        setBadgeIds(() =>
        {
            const newValue = new Map<string, number>();

            allBadgeCodes.forEach(code =>
            {
                const badgeId = parser.getBadgeId(code);

                newValue.set(code, badgeId);
            });

            return newValue;
        });

        // Skip overwriting activeBadgeCodes if we recently made a local change
        if(localChangeRef.current)
        {
            localChangeRef.current = false;
        }
        else
        {
            setActiveBadgeCodes(parser.getActiveBadgeCodes());
        }

        setBadgeCodes(allBadgeCodes);
    });

    useMessageEvent<BadgeReceivedEvent>(BadgeReceivedEvent, event =>
    {
        const parser = event.getParser();
        const unseen = isUnseen(UnseenItemCategory.BADGE, parser.badgeId);

        setBadgeCodes(prevValue =>
        {
            const newValue = [ ...prevValue ];

            if(unseen) newValue.unshift(parser.badgeCode);
            else newValue.push(parser.badgeCode);

            return newValue;
        });

        setBadgeIds(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.set(parser.badgeCode, parser.badgeId);

            return newValue;
        });
    });

    useEffect(() =>
    {
        if(!badgeCodes || !badgeCodes.length) return;

        setSelectedBadgeCode(prevValue =>
        {
            let newValue = prevValue;

            if(newValue && (badgeCodes.indexOf(newValue) === -1)) newValue = null;

            if(!newValue) newValue = badgeCodes[0];

            return newValue;
        });
    }, [ badgeCodes ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        return () =>
        {
            resetCategory(UnseenItemCategory.BADGE);
        };
    }, [ isVisible, resetCategory ]);

    useEffect(() =>
    {
        if(!isVisible || !needsUpdate) return;

        SendMessageComposer(new RequestBadgesComposer());

        setNeedsUpdate(false);
    }, [ isVisible, needsUpdate ]);

    const setBadgeAtSlot = (badgeCode: string, slotIndex: number) =>
    {
        setActiveBadgeCodes(prevValue =>
        {
            // Build a fixed-size array of maxBadgeCount slots
            const slots: (string | null)[] = Array.from({ length: maxBadgeCount }, (_, i) => prevValue[i] ?? null);

            // Remove badge if already in another slot
            const existingIndex = slots.indexOf(badgeCode);
            if(existingIndex >= 0) slots[existingIndex] = null;

            // Place badge at target slot
            slots[slotIndex] = badgeCode;

            // Compact: remove nulls, keep order
            const result = slots.filter(Boolean) as string[];

            sendActiveBadges(result);
            return result;
        });
    };

    const removeBadge = (badgeCode: string) =>
    {
        setActiveBadgeCodes(prevValue =>
        {
            const result = prevValue.filter(code => code !== badgeCode);

            sendActiveBadges(result);
            return result;
        });
    };

    const reorderBadges = (fromIndex: number, toIndex: number) =>
    {
        setActiveBadgeCodes(prevValue =>
        {
            if(fromIndex === toIndex) return prevValue;
            if(fromIndex >= prevValue.length) return prevValue;

            const newValue = [ ...prevValue ];
            const [ moved ] = newValue.splice(fromIndex, 1);
            newValue.splice(toIndex, 0, moved);

            sendActiveBadges(newValue);
            return newValue;
        });
    };

    const swapBadges = (fromIndex: number, toIndex: number) =>
    {
        setActiveBadgeCodes(prevValue =>
        {
            if(fromIndex === toIndex) return prevValue;

            // Build fixed-size array so swap works even with empty slots
            const slots: (string | null)[] = Array.from({ length: maxBadgeCount }, (_, i) => prevValue[i] ?? null);

            // Swap the two slots
            const temp = slots[fromIndex];
            slots[fromIndex] = slots[toIndex];
            slots[toIndex] = temp;

            // Compact: remove nulls, keep order
            const result = slots.filter(Boolean) as string[];

            sendActiveBadges(result);
            return result;
        });
    };

    const requestBadges = () =>
    {
        SendMessageComposer(new RequestBadgesComposer());
    };

    return { badgeCodes, activeBadgeCodes, selectedBadgeCode, setSelectedBadgeCode, isWearingBadge, canWearBadges, toggleBadge, getBadgeId, setBadgeAtSlot, removeBadge, reorderBadges, swapBadges, requestBadges, activate, deactivate };
};

export const useInventoryBadges = () => useBetween(useInventoryBadgesState);
