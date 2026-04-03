import { DesktopViewEvent, GetGuestRoomResultEvent, GetSessionDataManager, GroupInformationComposer, GroupInformationEvent, GroupInformationParser, GroupRemoveMemberComposer, HabboGroupDeactivatedMessageEvent, RoomEntryInfoMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { GetGroupInformation, GetGroupManager, GroupMembershipType, GroupType, LocalizeText, SendMessageComposer, TryJoinGroup } from '../../../api';
import groupIcon from '../../../assets/images/rightside/group.png';
import { Button, Flex, LayoutBadgeImageView, Text } from '../../../common';
import { useMessageEvent, useNotification } from '../../../hooks';

export const GroupRoomInformationView: FC<{}> = props =>
{
    const expectedGroupIdRef = useRef<number>(0);
    const requestRetryCountRef = useRef<number>(0);
    const requestRetryTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const [ groupInformation, setGroupInformation ] = useState<GroupInformationParser>(null);
    const [ isOpen, setIsOpen ] = useState<boolean>(true);
    const [ isCompact, setIsCompact ] = useState(false);
    const { showConfirm = null } = useNotification();

    const clearRequestRetryTimeout = () =>
    {
        if(!requestRetryTimeoutRef.current) return;

        clearTimeout(requestRetryTimeoutRef.current);
        requestRetryTimeoutRef.current = null;
    };

    const scheduleGroupInfoRetry = (groupId: number) =>
    {
        if(requestRetryCountRef.current >= 2) return;

        clearRequestRetryTimeout();

        requestRetryTimeoutRef.current = setTimeout(() =>
        {
            requestRetryTimeoutRef.current = null;

            if(expectedGroupIdRef.current !== groupId) return;
            if(groupInformation && (groupInformation.id === groupId)) return;

            requestRetryCountRef.current++;
            SendMessageComposer(new GroupInformationComposer(groupId, false));
            scheduleGroupInfoRetry(groupId);
        }, 700);
    };

    const requestGroupInformation = (groupId: number) =>
    {
        if(groupId <= 0) return;

        requestRetryCountRef.current = 0;
        clearRequestRetryTimeout();

        SendMessageComposer(new GroupInformationComposer(groupId, false));
        scheduleGroupInfoRetry(groupId);
    };

    const resetGroupState = () =>
    {
        expectedGroupIdRef.current = 0;
        requestRetryCountRef.current = 0;
        clearRequestRetryTimeout();
        setGroupInformation(null);
    };

    const setRequestedGroupId = (groupId: number) =>
    {
        expectedGroupIdRef.current = groupId;
    };

    useMessageEvent<DesktopViewEvent>(DesktopViewEvent, event =>
    {
        resetGroupState();
    });

    useMessageEvent<RoomEntryInfoMessageEvent>(RoomEntryInfoMessageEvent, event =>
    {
        resetGroupState();
    });

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();

        if(!parser.roomEnter) return;

        if(parser.data.habboGroupId > 0)
        {
            setRequestedGroupId(parser.data.habboGroupId);
            requestGroupInformation(parser.data.habboGroupId);
        }
        else
        {
            resetGroupState();
        }
    });

    useMessageEvent<HabboGroupDeactivatedMessageEvent>(HabboGroupDeactivatedMessageEvent, event =>
    {
        const parser = event.getParser();

        if(!groupInformation || ((parser.groupId !== groupInformation.id) && (parser.groupId !== expectedGroupIdRef.current))) return;

        resetGroupState();
    });

    useMessageEvent<GroupInformationEvent>(GroupInformationEvent, event =>
    {
        const parser = event.getParser();

        if(parser.id !== expectedGroupIdRef.current) return;

        clearRequestRetryTimeout();
        setGroupInformation(parser);
    });

    useEffect(() => () => clearRequestRetryTimeout(), []);

    useEffect(() =>
    {
        if(isOpen)
        {
            setIsCompact(false);
            return;
        }

        const timeout = window.setTimeout(() => setIsCompact(true), 220);

        return () => window.clearTimeout(timeout);
    }, [ isOpen ]);

    const leaveGroup = () =>
    {
        showConfirm(LocalizeText('group.leaveconfirm.desc'), () =>
        {
            SendMessageComposer(new GroupRemoveMemberComposer(groupInformation.id, GetSessionDataManager().userId));
        }, null);
    };

    const isRealOwner = (groupInformation && (groupInformation.ownerName === GetSessionDataManager().userName));

    const getButtonText = () =>
    {
        if(isRealOwner) return 'group.manage';

        if(groupInformation.type === GroupType.PRIVATE) return '';

        if(groupInformation.membershipType === GroupMembershipType.MEMBER) return 'group.leave';

        if((groupInformation.membershipType === GroupMembershipType.NOT_MEMBER) && groupInformation.type === GroupType.REGULAR) return 'group.join';

        if(groupInformation.membershipType === GroupMembershipType.REQUEST_PENDING) return 'group.membershippending';

        if((groupInformation.membershipType === GroupMembershipType.NOT_MEMBER) && groupInformation.type === GroupType.EXCLUSIVE) return 'group.requestmembership';
    };

    const handleButtonClick = () =>
    {
        if(isRealOwner) return GetGroupManager(groupInformation.id);

        if((groupInformation.type === GroupType.PRIVATE) && (groupInformation.membershipType === GroupMembershipType.NOT_MEMBER)) return;

        if(groupInformation.membershipType === GroupMembershipType.MEMBER)
        {
            leaveGroup();

            return;
        }

        TryJoinGroup(groupInformation.id);
    };

    if(!groupInformation) return null;

    return (
        <div className={ `pointer-events-auto mt-[6px] overflow-hidden rounded-[10px] border border-white/6 bg-[rgba(10,10,12,0.58)] text-sm shadow-[0_8px_18px_rgba(0,0,0,0.12)] transition-[width,max-width] duration-200 ease-out ${ isCompact ? 'ml-auto w-[52px] max-w-[52px]' : 'w-full max-w-[188px]' }` }>
            <div className="flex flex-col">
                <Flex pointer alignItems="center" justifyContent={ isCompact ? 'end' : 'between' } className={ `border-b border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-[7px] py-[5px] max-[420px]:px-[6px] max-[420px]:py-[4px] ${ isCompact ? 'gap-[5px] px-[6px] py-[5px]' : '' }` } onClick={ event => setIsOpen(value => !value) }>
                    <Flex alignItems="center" gap={ 1 } className={ isCompact ? 'mr-[0]' : '' }>
                        <div className="flex h-[18px] w-[18px] items-center justify-center">
                            <img src={ groupIcon } alt="" className="h-[14px] w-auto object-contain" />
                        </div>
                        { !isCompact && <Text variant="white" className="text-[0.78rem] font-bold leading-none text-white/90 max-[420px]:text-[0.74rem]">{ LocalizeText('group.homeroominfo.title') }</Text> }
                    </Flex>
                    <div className={ `flex h-[20px] w-[20px] items-center justify-center rounded-[6px] border border-white/8 bg-white/6 text-white/80 transition-transform duration-300 ease-out ${ isOpen ? 'rotate-180' : 'rotate-0' }` }>
                        <FaChevronDown className="fa-icon text-[10px]" />
                    </div>
                </Flex>
                <div className={ `overflow-hidden transition-all duration-[580ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${ isOpen ? 'max-h-[280px] opacity-100 translate-y-0 scale-y-100' : 'max-h-0 opacity-0 -translate-y-[8px] scale-y-95' } origin-top` }>
                    <>
                        <Flex pointer alignItems="center" gap={ 2 } className={ `px-[10px] py-[10px] max-[420px]:px-[8px] max-[420px]:py-[8px] transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${ isOpen ? 'translate-y-0 opacity-100 delay-[80ms]' : '-translate-y-[6px] opacity-0 delay-0' }` } onClick={ event => GetGroupInformation(groupInformation.id) }>
                            <div className="group-badge flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden max-[420px]:h-[38px] max-[420px]:w-[38px]">
                                <LayoutBadgeImageView
                                    badgeCode={ groupInformation.badge }
                                    isGroup={ true }
                                    classNames={ [ 'w-full!', 'h-full!', 'bg-contain!' ] }
                                    style={ { width: '100%', height: '100%', backgroundSize: 'contain' } }
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Text truncate variant="white" className="text-[0.82rem] font-bold leading-tight text-white/92 max-[420px]:text-[0.76rem]">{ groupInformation.title }</Text>
                            </div>
                        </Flex>
                        { (groupInformation.type !== GroupType.PRIVATE || isRealOwner) &&
                            <div className={ `px-[9px] pb-[9px] max-[420px]:px-[8px] max-[420px]:pb-[8px] transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${ isOpen ? 'translate-y-0 opacity-100 delay-[160ms]' : '-translate-y-[6px] opacity-0 delay-0' }` }>
                                <Button fullWidth disabled={ (groupInformation.membershipType === GroupMembershipType.REQUEST_PENDING) } className="h-[30px] rounded-[6px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(214,214,214,0.76))] !text-black text-[0.82rem] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_0_rgba(0,0,0,0.18)] hover:brightness-100 max-[420px]:h-[28px] max-[420px]:text-[0.78rem]" onClick={ handleButtonClick }>
                                    { LocalizeText(getButtonText()) }
                                </Button>
                            </div>
                        }
                    </>
                </div>
            </div>
        </div>
    );
};
