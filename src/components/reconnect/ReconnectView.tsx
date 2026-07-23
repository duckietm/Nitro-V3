import { FC } from 'react';
import { Base, Column, Text } from '../../common';
import { getReconnectPresentation, useConnectionState } from '../../hooks';

export const ReconnectView: FC<{}> = () => {
    const connectionState = useConnectionState();
    const { isReconnecting, hasFailed, attempt, maxAttempts } = getReconnectPresentation(connectionState);

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
                                style={{ width: `${maxAttempts > 0 ? (attempt / maxAttempts) * 100 : 0}%` }}
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
