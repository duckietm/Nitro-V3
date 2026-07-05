import { ButtonHTMLAttributes, FC } from 'react';

export type ChestButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Footer / dialog buttons with longer captions (auto width, min 73px). */
    wide?: boolean;
    /** Compact square control (upgrade +, 24×24). */
    icon?: boolean;
    /** Fixed 73×22 like coins_chest_contents.xml withdraw_btn. */
    fixed?: boolean;
};

/** Habbo wired-chest Putyhef-style button (chest_generic.xml / coins_chest_contents.xml). */
export const ChestButton: FC<ChestButtonProps> = ({
    wide = false,
    icon = false,
    fixed = false,
    className = '',
    type = 'button',
    children,
    ...rest
}) => {
    const classes = [
        'nitro-chest__btn',
        wide ? 'nitro-chest__btn--wide' : '',
        icon ? 'nitro-chest__btn--icon' : '',
        fixed ? 'nitro-chest__btn--fixed' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button type={type} className={classes} {...rest}>
            {children}
        </button>
    );
};
