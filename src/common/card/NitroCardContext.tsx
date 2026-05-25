import { createContext, FC, ReactNode, useContext } from 'react';

interface INitroCardContext
{
    theme: string;
}

const NitroCardContext = createContext<INitroCardContext>({
    theme: null
});

export const NitroCardContextProvider: FC<{ value: INitroCardContext; children?: ReactNode }> = props =>
{
    return <NitroCardContext value={ props.value }>{ props.children }</NitroCardContext>;
};

export const useNitroCardContext = () => useContext(NitroCardContext);
