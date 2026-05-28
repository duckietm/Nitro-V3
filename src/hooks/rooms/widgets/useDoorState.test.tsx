import { act, cleanup, renderHook } from '@testing-library/react';
import { DoorbellMessageEvent, FlatAccessDeniedMessageEvent,
    GenericErrorEvent, GetGuestRoomResultEvent, RoomDataParser,
    RoomDoorbellAcceptedEvent } from '@nitrots/nitro-renderer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DoorStateType } from '../../../api';
import { clearMockEventDispatcher, mockEventDispatcher } from '../../../nitro-renderer.mock';
import { useDoorState } from './useDoorState';

const makeParserlessEvent = (klass: any, parser: any) =>
{
    const ev = new klass();
    (ev as any).getParser = () => parser;
    return ev;
};

describe('useDoorState', () =>
{
    beforeEach(() =>
    {
        clearMockEventDispatcher();
        const { result, unmount } = renderHook(() => useDoorState());
        act(() => result.current.reset());
        unmount();
    });

    afterEach(() =>
    {
        cleanup();
    });

    it('exposes the initial NONE snapshot', () =>
    {
        const { result } = renderHook(() => useDoorState());
        expect(result.current.snapshot.state).toBe(DoorStateType.NONE);
        expect(result.current.snapshot.roomInfo).toBeNull();
    });

    it('DoorbellMessageEvent with empty userName -> STATE_WAITING', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WAITING);
    });

    it('DoorbellMessageEvent with non-empty userName does NOT change state', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const before = result.current.snapshot.state;
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: 'someone' }));
        });
        expect(result.current.snapshot.state).toBe(before);
    });

    it('RoomDoorbellAcceptedEvent (empty userName) -> STATE_ACCEPTED', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(RoomDoorbellAcceptedEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_ACCEPTED);
    });

    it('FlatAccessDeniedMessageEvent (empty userName) -> STATE_NO_ANSWER', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(FlatAccessDeniedMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_NO_ANSWER);
    });

    it('GenericErrorEvent -100002 -> STATE_WRONG_PASSWORD', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GenericErrorEvent, { errorCode: -100002 }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WRONG_PASSWORD);
    });

    it('GenericErrorEvent 4010 does NOT touch door state', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const before = result.current.snapshot.state;
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GenericErrorEvent, { errorCode: 4010 }));
        });
        expect(result.current.snapshot.state).toBe(before);
    });

    it('GetGuestRoomResultEvent with roomForward + DOORBELL_STATE -> START_DOORBELL', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const fakeRoomData: any = { roomId: 42, roomName: 'r', ownerName: 'other', doorMode: RoomDataParser.DOORBELL_STATE };
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomForward: true,
                isGroupMember: false,
                data: fakeRoomData
            }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.START_DOORBELL);
        expect(result.current.snapshot.roomInfo).toBe(fakeRoomData);
    });

    it('GetGuestRoomResultEvent with roomForward + PASSWORD_STATE -> START_PASSWORD', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const fakeRoomData: any = { roomId: 42, roomName: 'r', ownerName: 'other', doorMode: RoomDataParser.PASSWORD_STATE };
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomForward: true,
                isGroupMember: false,
                data: fakeRoomData
            }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.START_PASSWORD);
    });

    it('GetGuestRoomResultEvent with non-bell/password doorMode does NOT change state', () =>
    {
        const { result } = renderHook(() => useDoorState());
        const before = result.current.snapshot.state;
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomForward: true,
                isGroupMember: false,
                data: { ownerName: 'other', doorMode: 99 }
            }));
        });
        expect(result.current.snapshot.state).toBe(before);
    });

    it('GetGuestRoomResultEvent with roomEnter=true resets snapshot to NONE', () =>
    {
        const { result } = renderHook(() => useDoorState());
        // First put the hook into a non-NONE state via doorbell
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WAITING);
        // Then roomEnter event should dismiss it
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(GetGuestRoomResultEvent, {
                roomEnter: true,
                roomForward: false,
                data: {}
            }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.NONE);
        expect(result.current.snapshot.roomInfo).toBeNull();
    });

    it('reset() returns snapshot to NONE', () =>
    {
        const { result } = renderHook(() => useDoorState());
        act(() =>
        {
            mockEventDispatcher.dispatchEvent(makeParserlessEvent(DoorbellMessageEvent, { userName: '' }));
        });
        expect(result.current.snapshot.state).toBe(DoorStateType.STATE_WAITING);
        act(() => result.current.reset());
        expect(result.current.snapshot.state).toBe(DoorStateType.NONE);
        expect(result.current.snapshot.roomInfo).toBeNull();
    });
});
