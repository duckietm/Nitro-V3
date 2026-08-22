import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import magnifierIcon from '../../../../assets/images/navigator/air/magnifier.png';

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
            <img src={magnifierIcon} alt="" width={13} height={22} className="opacity-70" />
            <div className="text-sm text-muted max-w-[240px]">{LocalizeText(messageKey)}</div>
            <button type="button" className="habbo-btn-primary" onClick={onCreateRoom}>
                {LocalizeText('navigator.createroom.create')}
            </button>
        </div>
    );
};
