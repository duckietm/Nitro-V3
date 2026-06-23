import { FC, Fragment, ReactNode } from 'react';
import { classifyMentionToken } from '../../api/mentions/mentionTokens';

interface MentionMessageViewProps {
    text: string;
    ownUsername: string;
    className?: string;
}

/**
 * Renders a mention's message text as React nodes, wrapping every @user token
 * in a `.mention-tag` span (with the `.mention-tag--self` modifier when the
 * token targets the local user or a broadcast alias). Pure text segmentation
 * (no innerHTML) → no XSS risk from other users' chat content. Original spacing
 * is preserved verbatim.
 */
export const MentionMessageView: FC<MentionMessageViewProps> = (props) => {
    const { text, ownUsername, className } = props;

    if (!text) return <span className={className} />;

    const nodes: ReactNode[] = text.split(/(\s+)/).map((segment, index) => {
        if (segment.length === 0) return null;

        const kind = /^\s+$/.test(segment) ? '' : classifyMentionToken(segment, ownUsername);

        if (!kind) return <Fragment key={index}>{segment}</Fragment>;

        return (
            <span key={index} className={kind === 'self' ? 'mention-tag mention-tag--self' : 'mention-tag'}>
                {segment}
            </span>
        );
    });

    return <span className={className}>{nodes}</span>;
};
