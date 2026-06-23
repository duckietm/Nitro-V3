import { ChatRecordData, CreateLinkEvent } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { FaCommentDots, FaDoorOpen, FaSignInAlt, FaTools } from 'react-icons/fa';
import { LocalizeText, TryVisitRoom } from '../../../../api';
import { Column, InfiniteScroll } from '../../../../common';
import { useModTools } from '../../../../hooks';
import { ChatlogRecord } from './ChatlogRecord';

interface ChatlogViewProps {
    records: ChatRecordData[];
}

export const ChatlogView: FC<ChatlogViewProps> = (props) => {
    const { records = null } = props;
    const { openRoomInfo = null } = useModTools();

    const allRecords = useMemo(() => {
        const results: ChatlogRecord[] = [];

        records.forEach((record) => {
            results.push({
                isRoomInfo: true,
                roomId: record.roomId,
                roomName: record.roomName
            });

            record.chatlog.forEach((chatlog) => {
                results.push({
                    timestamp: chatlog.timestamp,
                    habboId: chatlog.userId,
                    username: chatlog.userName,
                    hasHighlighting: chatlog.hasHighlighting,
                    message: chatlog.message,
                    isRoomInfo: false
                });
            });
        });

        return results;
    }, [records]);

    const totalMessages = useMemo(() => allRecords.filter((r) => !r.isRoomInfo).length, [allRecords]);

    const RoomInfo = (props: { roomId: number; roomName: string }) => (
        <div className="flex items-center gap-2 bg-gradient-to-r from-sky-50 to-transparent rounded p-2 border border-sky-100 my-1">
            <FaDoorOpen className="text-sky-600 shrink-0" size={14} />
            <div className="font-semibold leading-tight grow truncate">{props.roomName}</div>
            <div className="flex gap-1 shrink-0">
                <button
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
                    onClick={() => TryVisitRoom(props.roomId)}
                >
                    <FaSignInAlt size={10} /> {LocalizeText('modtools.chatlog.visit')}
                </button>
                <button
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
                    onClick={() => openRoomInfo(props.roomId)}
                >
                    <FaTools size={10} /> {LocalizeText('modtools.chatlog.tools')}
                </button>
            </div>
        </div>
    );

    const isEmpty = !records || records.length === 0 || totalMessages === 0;

    return (
        <Column fit gap={0} overflow="hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[60px_120px_1fr] gap-2 text-[.7rem] uppercase tracking-wide opacity-60 font-semibold border-b border-zinc-200 pb-1 px-1">
                <div>{LocalizeText('modtools.chatlog.column.time')}</div>
                <div>{LocalizeText('modtools.chatlog.column.user')}</div>
                <div>{LocalizeText('modtools.chatlog.column.message')}</div>
            </div>
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-1 py-6 opacity-50 text-sm">
                    <FaCommentDots size={22} />
                    <span>{LocalizeText('modtools.chatlog.empty')}</span>
                </div>
            ) : (
                <InfiniteScroll
                    rowRender={(row: ChatlogRecord) => {
                        if (row.isRoomInfo) return <RoomInfo roomId={row.roomId} roomName={row.roomName} />;

                        return (
                            <div
                                className={`grid grid-cols-[60px_120px_1fr] gap-2 items-start px-1 py-1.5 text-sm border-b border-zinc-100 even:bg-black/[0.02] hover:bg-sky-50/50 transition-colors ${row.hasHighlighting ? 'bg-amber-50/60' : ''}`}
                            >
                                <span className="font-mono text-[.7rem] opacity-70 tabular-nums whitespace-nowrap">{row.timestamp}</span>
                                <button
                                    className="text-left font-semibold text-sky-700 hover:text-sky-900 hover:underline truncate"
                                    onClick={() => CreateLinkEvent(`mod-tools/open-user-info/${row.habboId}`)}
                                >
                                    {row.username}
                                </button>
                                <span className="break-words">{row.message}</span>
                            </div>
                        );
                    }}
                    rows={allRecords}
                />
            )}
        </Column>
    );
};
