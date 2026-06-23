import { FC } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { Button } from '../../../../common';

interface NavigatorEmptyStateViewProps {
    code: string;
    onCreateRoom: () => void;
}

export const NavigatorEmptyStateView: FC<NavigatorEmptyStateViewProps> = (props) => {
    const { code, onCreateRoom } = props;

    const isMyWorld = code === 'myworld_view';
    const messageKey = isMyWorld ? 'navigator.roomsettings.moderation.none' : 'navigator.search.returned.no.results';

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-muted">
                <FaSearch size={26} className="opacity-40" />
            </div>
            <div className="text-sm text-muted max-w-[240px]">{LocalizeText(messageKey)}</div>
            <Button variant="primary" onClick={onCreateRoom}>
                <FaPlus className="fa-icon me-1" />
                {LocalizeText('navigator.createroom.create')}
            </Button>
        </div>
    );
};
