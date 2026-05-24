export const HousekeepingActionType = {
    USER_ALERT: 'user.alert',
    USER_MESSAGE: 'user.message',
    USER_KICK: 'user.kick',
    USER_MUTE: 'user.mute',
    USER_BAN: 'user.ban',
    USER_TRADE_LOCK: 'user.trade_lock',
    USER_CHANGE_RANK: 'user.change_rank',
    USER_FORCE_DISCONNECT: 'user.force_disconnect',
    USER_RESET_PASSWORD: 'user.reset_password',
    USER_UNBAN: 'user.unban',
    ROOM_OPEN: 'room.open',
    ROOM_CLOSE: 'room.close',
    ROOM_KICK_ALL: 'room.kick_all',
    ROOM_TRANSFER_OWNERSHIP: 'room.transfer_ownership',
    ROOM_DELETE: 'room.delete',
    ROOM_MUTE: 'room.mute',
    ECONOMY_GIVE_CREDITS: 'economy.give_credits',
    ECONOMY_GIVE_DUCKETS: 'economy.give_duckets',
    ECONOMY_GIVE_DIAMONDS: 'economy.give_diamonds',
    ECONOMY_GRANT_ITEM: 'economy.grant_item',
    ECONOMY_SET_HC: 'economy.set_hc',
    ECONOMY_HOTEL_ALERT: 'economy.hotel_alert'
} as const;

export type HousekeepingActionType = typeof HousekeepingActionType[keyof typeof HousekeepingActionType];

export const HousekeepingTabId = {
    DASHBOARD: 'dashboard',
    USERS: 'users',
    ROOMS: 'rooms',
    ECONOMY: 'economy',
    AUDIT: 'audit'
} as const;

export type HousekeepingTabId = typeof HousekeepingTabId[keyof typeof HousekeepingTabId];
