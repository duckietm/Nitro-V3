import { NitroEventType, ReconnectEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useState } from 'react';
import { Base, Column, Text } from '../../common';
import { useNitroEvent } from '../../hooks';

export const ReconnectView: FC<{}> = (props) => {
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [maxAttempts, setMaxAttempts] = useState(0);
    const [hasFailed, setHasFailed] = useState(false);

    const onReconnecting = useCallback((event: ReconnectEvent) => {
        setIsReconnecting(true);
        setHasFailed(false);
        setAttempt(event.attempt);
        setMaxAttempts(event.maxAttempts);
    }, []);

    const onReconnected = useCallback(() => {
        // Socket is open but not yet re-authenticated.
        // Update attempt display but keep the overlay visible until
        // re-authentication completes (SOCKET_REAUTHENTICATED).
        setHasFailed(false);
    }, []);

    const onReauthenticated = useCallback(() => {
        // Fully re-authenticated — dismiss the overlay so the room view
        // (which stayed alive behind the overlay) is visible again.
        setIsReconnecting(false);
        setHasFailed(false);
        setAttempt(0);
    }, []);

    const onReconnectFailed = useCallback(() => {
        setIsReconnecting(false);
        setHasFailed(true);
    }, []);

    useNitroEvent<ReconnectEvent>(NitroEventType.SOCKET_RECONNECTING, onReconnecting);
    useNitroEvent(NitroEventType.SOCKET_RECONNECTED, onReconnected);
    useNitroEvent(NitroEventType.SOCKET_REAUTHENTICATED, onReauthenticated);
    useNitroEvent(NitroEventType.SOCKET_RECONNECT_FAILED, onReconnectFailed);

    const handleReload = useCallback(() => {
        window.location.href = window.location.origin + '/';
    }, []);

    const handleGoHome = useCallback(() => {
        sessionStorage.removeItem('nitro.session.lastRoomId');
        sessionStorage.removeItem('nitro.session.lastRoomPassword');
        window.location.href = window.location.origin + '/';
    }, []);

    if (!isReconnecting && !hasFailed) return null;

    return (
        <Column fullHeight position="fixed" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <Column alignItems="center" gap={3} className="p-6 rounded-xl bg-[#1a1a2e]/90 border border-white/10 shadow-2xl max-w-[400px]">
                {isReconnecting && (
                    <>
                        <Base className="w-[48px] h-[48px] border-4 border-white/20 border-t-[#4dabf7] rounded-full animate-spin" />
                        <Text fontSizeCustom={18} variant="white" className="text-center font-semibold">
                            Connection lost
                        </Text>
                        <Text fontSizeCustom={14} variant="white" className="text-center opacity-70">
                            Reconnecting to server... (attempt {attempt}/{maxAttempts})
                        </Text>
                        <Base className="w-full h-[4px] rounded-full bg-white/10 overflow-hidden mt-1">
                            <Base
                                className="h-full bg-[#4dabf7] rounded-full transition-all duration-300"
                                style={{ width: `${(attempt / maxAttempts) * 100}%` }}
                            />
                        </Base>
                        <Text fontSizeCustom={12} variant="white" className="text-center opacity-50">
                            Please wait, your session will be restored automatically
                        </Text>
                    </>
                )}

                {hasFailed && (
                    <>
                        <Text fontSizeCustom={36} className="text-center text-red-500">
                            &#9888;
                        </Text>
                        <Text fontSizeCustom={18} variant="white" className="text-center font-semibold">
                            Session expired
                        </Text>
                        <Text fontSizeCustom={14} variant="white" className="text-center opacity-70">
                            Your session has expired. Please log in again to enter the hotel.
                        </Text>
                        <Base className="mt-2 flex gap-3">
                            <a
                                href={window.location.origin + '/'}
                                className="px-6 py-2 rounded-lg bg-[#3b82f6] text-white font-semibold cursor-pointer hover:bg-[#2563eb] transition-colors no-underline"
                            >
                                Back to Hotel
                            </a>
                        </Base>
                    </>
                )}
            </Column>
        </Column>
    );
};
