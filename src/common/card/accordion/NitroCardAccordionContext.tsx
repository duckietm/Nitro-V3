import { createContext, Dispatch, FC, ReactNode, SetStateAction, useContext } from 'react';

export interface INitroCardAccordionContext
{
    closers: Function[];
    setClosers: Dispatch<SetStateAction<Function[]>>;
    closeAll: () => void;
}

const NitroCardAccordionContext = createContext<INitroCardAccordionContext>({
    closers: null,
    setClosers: null,
    closeAll: null
});

export const NitroCardAccordionContextProvider: FC<{ value: INitroCardAccordionContext; children?: ReactNode }> = props =>
{
    return <NitroCardAccordionContext { ...props } />;
};

export const useNitroCardAccordionContext = () => useContext(NitroCardAccordionContext);
