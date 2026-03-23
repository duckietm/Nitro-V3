import { FC, useCallback, useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { Column, Text } from '../../../common';
import { LayoutFurniIconImageView } from '../../../common/layout/LayoutFurniIconImageView';
import { FurniItem } from '../../../hooks/furni-editor';

interface FurniEditorSearchViewProps
{
    items: FurniItem[];
    total: number;
    page: number;
    loading: boolean;
    onSearch: (query: string, type: string, page: number) => void;
    onSelect: (id: number) => void;
}

const inputClass = 'text-[14px] border border-[#c5cdd6] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-[#1e7295] transition-colors w-full';

export const FurniEditorSearchView: FC<FurniEditorSearchViewProps> = props =>
{
    const { items, total, page, loading, onSearch, onSelect } = props;
    const [ query, setQuery ] = useState('');
    const [ typeFilter, setTypeFilter ] = useState('');

    useEffect(() =>
    {
        onSearch('', '', 1);
    }, []);

    const handleSearch = useCallback(() =>
    {
        onSearch(query, typeFilter, 1);
    }, [ query, typeFilter, onSearch ]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if(e.key === 'Enter') handleSearch();
    }, [ handleSearch ]);

    const totalPages = Math.ceil(total / 20);

    return (
        <Column gap={ 1 } className="h-full">
            { /* Search Bar */ }
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-[12px] text-[#1e7295] uppercase font-bold mb-0.5 block">Search</label>
                    <input
                        type="text"
                        className={ inputClass }
                        placeholder="ID, name or sprite ID..."
                        value={ query }
                        onChange={ e => setQuery(e.target.value) }
                        onKeyDown={ handleKeyDown }
                    />
                </div>
                <div className="w-[100px]">
                    <label className="text-[12px] text-[#1e7295] uppercase font-bold mb-0.5 block">Type</label>
                    <select className={ inputClass } value={ typeFilter } onChange={ e => setTypeFilter(e.target.value) }>
                        <option value="">All</option>
                        <option value="s">Floor</option>
                        <option value="i">Wall</option>
                    </select>
                </div>
                <button
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded text-[13px] font-bold bg-[#1e7295] text-white hover:bg-[#185d79] transition-colors cursor-pointer disabled:opacity-50"
                    disabled={ loading }
                    onClick={ handleSearch }
                >
                    <FaSearch className="text-[11px]" /> { loading ? '...' : 'Search' }
                </button>
            </div>

            { /* Results counter */ }
            { total > 0 &&
                <div className="text-[13px] text-[#4a5568]">
                    <b className="text-[#1e7295]">{ total }</b> items found { totalPages > 1 && <span>- Page <b>{ page }</b>/{ totalPages }</span> }
                </div>
            }

            { /* Results Table */ }
            <div className="flex-1 overflow-auto border border-[#c5cdd6] rounded bg-white">
                { loading &&
                    <div className="flex items-center justify-center py-8">
                        <div className="text-[14px] text-[#4a5568] animate-pulse">Loading...</div>
                    </div>
                }

                { !loading && items.length === 0 &&
                    <div className="flex items-center justify-center py-8 text-[14px] text-[#4a5568]">
                        No items found
                    </div>
                }

                { !loading && items.length > 0 &&
                    <table className="w-full text-[14px]">
                        <thead>
                            <tr className="bg-[#f0f4f7] sticky top-0 text-[12px] text-[#1e7295] uppercase font-bold">
                                <th className="px-2 py-2 text-center w-[44px]"></th>
                                <th className="px-2 py-2 text-left w-[55px]">ID</th>
                                <th className="px-2 py-2 text-left w-[60px]">Sprite</th>
                                <th className="px-2 py-2 text-left">Name</th>
                                <th className="px-2 py-2 text-left">Public Name</th>
                                <th className="px-2 py-2 text-center w-[60px]">Type</th>
                                <th className="px-2 py-2 text-left">Interaction</th>
                            </tr>
                        </thead>
                        <tbody>
                            { items.map(item => (
                                <tr
                                    key={ item.id }
                                    className="cursor-pointer hover:bg-[#e8f4fb] border-b border-[#f0f0f0] transition-colors"
                                    onClick={ () => onSelect(item.id) }
                                >
                                    <td className="px-2 py-1 text-center">
                                        <div className="w-[34px] h-[34px] flex items-center justify-center mx-auto">
                                            <LayoutFurniIconImageView productType={ item.type } productClassId={ item.spriteId } />
                                        </div>
                                    </td>
                                    <td className="px-2 py-1 font-mono text-[14px] text-[#1e7295] font-bold">{ item.id }</td>
                                    <td className="px-2 py-1 font-mono text-[14px] text-[#4a5568]">{ item.spriteId }</td>
                                    <td className="px-2 py-1 text-[14px] text-[#2d3748] truncate max-w-[130px]">{ item.itemName }</td>
                                    <td className="px-2 py-1 text-[14px] text-[#2d3748] truncate max-w-[130px]">{ item.publicName }</td>
                                    <td className="px-2 py-1 text-center">
                                        <span className={ `px-2 py-0.5 rounded text-white text-[11px] font-bold ${ item.type === 's' ? 'bg-[#1e7295]' : 'bg-[#718096]' }` }>
                                            { item.type === 's' ? 'Floor' : 'Wall' }
                                        </span>
                                    </td>
                                    <td className="px-2 py-1 text-[14px] text-[#4a5568]">{ item.interactionType || '-' }</td>
                                </tr>
                            )) }
                        </tbody>
                    </table>
                }
            </div>

            { /* Pagination */ }
            { totalPages > 1 &&
                <div className="flex justify-between items-center">
                    <div className="text-[13px] text-[#4a5568]">
                        Page <b>{ page }</b> of <b>{ totalPages }</b>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            className="px-3 py-1.5 rounded text-[13px] font-bold bg-[#edf2f7] hover:bg-[#e2e8f0] text-[#4a5568] transition-colors cursor-pointer disabled:opacity-40"
                            disabled={ page <= 1 }
                            onClick={ () => onSearch(query, typeFilter, page - 1) }
                        >
                            Prev
                        </button>
                        <button
                            className="px-3 py-1.5 rounded text-[13px] font-bold bg-[#edf2f7] hover:bg-[#e2e8f0] text-[#4a5568] transition-colors cursor-pointer disabled:opacity-40"
                            disabled={ page >= totalPages }
                            onClick={ () => onSearch(query, typeFilter, page + 1) }
                        >
                            Next
                        </button>
                    </div>
                </div>
            }
        </Column>
    );
};
