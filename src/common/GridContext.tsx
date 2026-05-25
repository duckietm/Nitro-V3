import { createContext, FC, ReactNode, useContext } from 'react';

export interface IGridContext
{
    isCssGrid: boolean;
}

const GridContext = createContext<IGridContext>({
    isCssGrid: false
});

export const GridContextProvider: FC<{ value: IGridContext; children?: ReactNode }> = props =>
{
    return <GridContext value={ props.value }>{ props.children }</GridContext>;
};

export const useGridContext = () => useContext(GridContext);
