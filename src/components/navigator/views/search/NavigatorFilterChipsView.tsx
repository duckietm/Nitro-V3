import { FC } from 'react';
import { LocalizeText, SearchFilterOptions } from '../../../../api';

interface NavigatorFilterChipsViewProps
{
    value: number;
    onChange: (index: number) => void;
}

export const NavigatorFilterChipsView: FC<NavigatorFilterChipsViewProps> = props =>
{
    const { value, onChange } = props;

    return (
        <div className="flex flex-wrap gap-1">
            { SearchFilterOptions.map((filter, index) =>
            {
                const isActive = (value === index);

                return (
                    <button
                        key={ index }
                        type="button"
                        onClick={ () => onChange(index) }
                        className={ `px-2 py-0.5 rounded-full text-[11px] border cursor-pointer transition-colors ${ isActive ? 'bg-primary text-white border-primary' : 'bg-card-grid-item text-gray-600 border-card-grid-item-border hover:bg-primary hover:text-white hover:border-primary' }` }>
                        { LocalizeText('navigator.filter.' + filter.name) }
                    </button>
                );
            }) }
        </div>
    );
};
