import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessengerMessageStatusView } from './MessengerMessageStatusView';

describe('MessengerMessageStatusView', () =>
{
    it('renders one neutral check for a sent message', () =>
    {
        const { container } = render(<MessengerMessageStatusView isRead={false} />);

        expect(screen.getByLabelText('sent')).toBeInTheDocument();
        expect(container.querySelectorAll('.messenger-status-check')).toHaveLength(1);
    });

    it('renders two checks for a read message', () =>
    {
        const { container } = render(<MessengerMessageStatusView isRead />);

        expect(screen.getByLabelText('read')).toBeInTheDocument();
        expect(container.querySelectorAll('.messenger-status-check')).toHaveLength(2);
    });
});
