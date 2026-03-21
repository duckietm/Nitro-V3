import { NitroEventType, ReconnectEvent } from '@nitrots/events';
import { FC, useCallback, useState } from 'react';
import { Base, Column, Text } from '../../common';
import { useNitroEvent } from '../../hooks';

export const ReconnectView: FC<{}> = props =>
{
    const [ isReconnecting, setIsReconnecting ] = useState(false);
    const [ attempt, setAttempt ] = useState(0);
    const [ maxAttempts, setMaxAttempts ] = useState(0);
    const [ hasFailed, setHasFailed ] = useState(false);

    const onReconnecting = useCallback((event: ReconnectEvent) =>
    {
        setIsReconnecting(true);
        setHasFailed(false);
        setAttempt(event.attempt);
        setMaxAttempts(event.maxAttempts);
    }, []);

    const onReconnected = useCallback(() =>
    {
        setIsReconnecting(false);
        setHasFailed(false);
        setAttempt(0);
    }, []);

    const onReconnectFailed = useCallback(() =>
    {
        setIsReconnecting(false);
        setHasFailed(true);
    }, []);

    useNitroEvent<ReconnectEvent>(NitroEventType.SOCKET_RECONNECTING, onReconnecting);
    useNitroEvent(NitroEventType.SOCKET_RECONNECTED, onReconnected);
    useNitroEvent(NitroEventType.SOCKET_RECONNECT_FAILED, onReconnectFailed);

    const handleReload = useCallback(() =>
    {
        window.location.reload();
    }, []);

    const handleGoHome = useCallback(() =>
    {
        sessionStorage.removeItem('nitro_last_room');
        sessionStorage.removeItem('nitro_last_room_password');
        window.location.reload();
    }, []);

    if(!isReconnecting && !hasFailed) return null;

    return (
        <Column
            fullHeight
            position="fixed"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
            <Column alignItems="center" gap={ 3 } className="p-6 rounded-xl bg-[#1a1a2e]/90 border border-white/10 shadow-2xl max-w-[400px]">
                { isReconnecting && (
                    <>
                        <Base className="w-[48px] h-[48px] border-4 border-white/20 border-t-[#4dabf7] rounded-full animate-spin" />
                        <Text fontSizeCustom={ 18 } variant="white" className="text-center font-semibold">
                            Connection lost
                        </Text>
                        <Text fontSizeCustom={ 14 } variant="white" className="text-center opacity-70">
                            Reconnecting to server... (attempt { attempt }/{ maxAttempts })
                        </Text>
                        <Base className="w-full h-[4px] rounded-full bg-white/10 overflow-hidden mt-1">
                            <Base
                                className="h-full bg-[#4dabf7] rounded-full transition-all duration-300"
                                style={ { width: `${ (attempt / maxAttempts) * 100 }%` } }
                            />
                        </Base>
                        <Text fontSizeCustom={ 12 } variant="white" className="text-center opacity-50">
                            Please wait, your session will be restored automatically
                        </Text>
                    </>
                ) }

                { hasFailed && (
                    <>
                        <Text fontSizeCustom={ 36 } className="text-center text-red-500">&#9888;</Text>
                        <Text fontSizeCustom={ 18 } variant="white" className="text-center font-semibold">
                            Connection failed
                        </Text>
                        <Text fontSizeCustom={ 14 } variant="white" className="text-center opacity-70">
                            Unable to reconnect to the server after multiple attempts.
                        </Text>
                        <Base className="mt-2 flex gap-3">
                            <Base
                                className="px-6 py-2 rounded-lg bg-[#4dabf7] text-white font-semibold cursor-pointer hover:bg-[#339af0] transition-colors"
                                onClick={ handleReload }
                            >
                                Reload Page
                            </Base>
                            <Base
                                className="px-6 py-2 rounded-lg bg-white/10 text-white font-semibold cursor-pointer hover:bg-white/20 transition-colors"
                                onClick={ handleGoHome }
                            >
                                Go to Home
                            </Base>
                        </Base>
                    </>
                ) }
            </Column>
        </Column>
    );
};
