import { FC } from 'react';
import { LocalizeText, NotificationBubbleItem } from '../../../../api';
import { Flex, LayoutNotificationBubbleView, LayoutNotificationBubbleViewProps, Text } from '../../../../common';
import { useInventoryBadges } from '../../../../hooks';

export interface NotificationBadgeReceivedBubbleViewProps extends LayoutNotificationBubbleViewProps
{
    item: NotificationBubbleItem;
}

export const NotificationBadgeReceivedBubbleView: FC<NotificationBadgeReceivedBubbleViewProps> = props =>
{
    const { item = null, onClose = null, ...rest } = props;
    const { toggleBadge = null } = useInventoryBadges();

    const handleWear = () =>
    {
        if(item.linkUrl) toggleBadge(item.linkUrl);
        onClose();
    };

    return (
        <LayoutNotificationBubbleView className="flex-col" onClose={ onClose } { ...rest }>
            <Flex alignItems="center" gap={ 2 } className="mb-2">
                <Flex center className="w-[50px] h-[50px] shrink-0">
                    { item.iconUrl && <img alt="" className="no-select" src={ item.iconUrl } /> }
                </Flex>
                <Flex column gap={ 0 }>
                    <Text bold variant="white">{ LocalizeText('notification.badge.received') }</Text>
                    <Text variant="white" small>{ item.message }</Text>
                </Flex>
            </Flex>
            <Flex alignItems="center" justifyContent="end" gap={ 2 }>
                <button
                    className="btn btn-success w-full btn-sm"
                    type="button"
                    onClick={ handleWear }>
                    { LocalizeText('inventory.badges.wearbadge') }
                </button>
                <span className="underline cursor-pointer text-nowrap" onClick={ onClose }>
                    { LocalizeText('notifications.button.later') }
                </span>
            </Flex>
        </LayoutNotificationBubbleView>
    );
};
