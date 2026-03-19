import { FC } from 'react';
import { Base, Column, Text } from '../../common';

interface LoadingViewProps {
    isError?: boolean;
    message?: string;
}

export const LoadingView: FC<LoadingViewProps> = props => {
    const { isError = false, message = '' } = props;

    return (
        <Column fullHeight position="relative" className="relative z-[100] bg-[radial-gradient(#1d1a24,#003a6b)]">
            <Base fullHeight className="container h-100">
                <Column fullHeight alignItems="center" justifyContent="center">
                    { !isError &&
                        <Base className="absolute inset-0 m-auto w-[84px] h-[84px] [zoom:1.5] [image-rendering:pixelated] bg-[url('@/assets/images/loading/loading.gif')] bg-no-repeat bg-left-top" /> }
                    <Base className="absolute top-[20px] left-[20px] z-[2] w-[150px] h-[100px] bg-[url('@/assets/images/notifications/nitro_v3.png')] bg-no-repeat bg-left-top" />
                    { isError && (message && message.length) ?
                        <Column alignItems="center" className="absolute bottom-[20px] left-1/2 z-[3] -translate-x-1/2 max-w-[80%]" gap={ 2 }>
                            <Text fontSizeCustom={ 20 } variant="white" className="text-center [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                                Something went wrong while loading
                            </Text>
                            <Base className="px-4 py-3 rounded-lg bg-black/40 text-[#ff6b6b] text-sm font-mono text-center break-words whitespace-pre-wrap max-w-[600px]">
                                { message }
                            </Base>
                        </Column>
                        :
                        <Text fontSizeCustom={32} variant="white" className="absolute bottom-[20px] left-1/2 z-[3] -translate-x-1/2 [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                            The hotel is loading ...
                        </Text>
                    }
                </Column>
            </Base>
        </Column>
    );
};