import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NitroCardHeaderView } from './NitroCardHeaderView';

describe('NitroCardHeaderView', () =>
{
    it('renders a keyboard-focusable close button', () =>
    {
        const onCloseClick = vi.fn();

        render(<NitroCardHeaderView headerText="Inventory" onCloseClick={ onCloseClick } />);

        const closeButton = screen.getByRole('button', { name: 'Close window' });

        expect(closeButton).toHaveClass('nitro-card-close-button');

        fireEvent.click(closeButton);

        expect(onCloseClick).toHaveBeenCalledTimes(1);
    });
});
