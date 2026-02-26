import { FC } from 'react';
import { FaBolt } from 'react-icons/fa';

export interface LayoutSearchSavesViewProps
{
    title: string;
    onClick?: () => void;
}

export const LayoutSearchSavesView: FC<LayoutSearchSavesViewProps> = props =>
{
    const { title = null, onClick = null } = props;

    return (
        <div
            title={ title }
            onClick={ onClick }
            style={{ backgroundColor: '#FAA700', borderRadius: 4, padding: '2px 4px', fontSize: 10, height: 17, display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'white' }}
        >
            <FaBolt />
        </div>
    );
};
