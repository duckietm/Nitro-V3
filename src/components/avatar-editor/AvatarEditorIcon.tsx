import { DetailedHTMLProps, HTMLAttributes, PropsWithChildren, forwardRef } from 'react';
import { classNames } from '../../layout';

import arrowLeftIcon from '../../assets/images/avatareditor/arrow-left-icon.png';
import arrowRightIcon from '../../assets/images/avatareditor/arrow-right-icon.png';
import caIcon from '../../assets/images/avatareditor/ca-icon.png';
import caSelectedIcon from '../../assets/images/avatareditor/ca-selected-icon.png';
import ccIcon from '../../assets/images/avatareditor/cc-icon.png';
import ccSelectedIcon from '../../assets/images/avatareditor/cc-selected-icon.png';
import chIcon from '../../assets/images/avatareditor/ch-icon.png';
import chSelectedIcon from '../../assets/images/avatareditor/ch-selected-icon.png';
import clearIcon from '../../assets/images/avatareditor/clear-icon.png';
import cpIcon from '../../assets/images/avatareditor/cp-icon.png';
import cpSelectedIcon from '../../assets/images/avatareditor/cp-selected-icon.png';
import eaIcon from '../../assets/images/avatareditor/ea-icon.png';
import eaSelectedIcon from '../../assets/images/avatareditor/ea-selected-icon.png';
import faIcon from '../../assets/images/avatareditor/fa-icon.png';
import faSelectedIcon from '../../assets/images/avatareditor/fa-selected-icon.png';
import femaleIcon from '../../assets/images/avatareditor/female-icon.png';
import femaleSelectedIcon from '../../assets/images/avatareditor/female-selected-icon.png';
import haIcon from '../../assets/images/avatareditor/ha-icon.png';
import haSelectedIcon from '../../assets/images/avatareditor/ha-selected-icon.png';
import heIcon from '../../assets/images/avatareditor/he-icon.png';
import heSelectedIcon from '../../assets/images/avatareditor/he-selected-icon.png';
import hrIcon from '../../assets/images/avatareditor/hr-icon.png';
import hrSelectedIcon from '../../assets/images/avatareditor/hr-selected-icon.png';
import lgIcon from '../../assets/images/avatareditor/lg-icon.png';
import lgSelectedIcon from '../../assets/images/avatareditor/lg-selected-icon.png';
import maleIcon from '../../assets/images/avatareditor/male-icon.png';
import maleSelectedIcon from '../../assets/images/avatareditor/male-selected-icon.png';
import sellableIcon from '../../assets/images/avatareditor/sellable-icon.png';
import shIcon from '../../assets/images/avatareditor/sh-icon.png';
import shSelectedIcon from '../../assets/images/avatareditor/sh-selected-icon.png';
import waIcon from '../../assets/images/avatareditor/wa-icon.png';
import waSelectedIcon from '../../assets/images/avatareditor/wa-selected-icon.png';

const ICON_MAP: Record<string, { normal: string; selected?: string }> = {
    'arrow-left': { normal: arrowLeftIcon },
    'arrow-right': { normal: arrowRightIcon },
    'ca': { normal: caIcon, selected: caSelectedIcon },
    'cc': { normal: ccIcon, selected: ccSelectedIcon },
    'ch': { normal: chIcon, selected: chSelectedIcon },
    'clear': { normal: clearIcon },
    'cp': { normal: cpIcon, selected: cpSelectedIcon },
    'ea': { normal: eaIcon, selected: eaSelectedIcon },
    'fa': { normal: faIcon, selected: faSelectedIcon },
    'female': { normal: femaleIcon, selected: femaleSelectedIcon },
    'ha': { normal: haIcon, selected: haSelectedIcon },
    'he': { normal: heIcon, selected: heSelectedIcon },
    'hr': { normal: hrIcon, selected: hrSelectedIcon },
    'lg': { normal: lgIcon, selected: lgSelectedIcon },
    'male': { normal: maleIcon, selected: maleSelectedIcon },
    'sellable': { normal: sellableIcon },
    'sh': { normal: shIcon, selected: shSelectedIcon },
    'wa': { normal: waIcon, selected: waSelectedIcon },
};

export const AvatarEditorIcon = forwardRef<HTMLDivElement, PropsWithChildren<{
    icon: string;
    selected?: boolean;
}> & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>((props, ref) =>
{
    const { icon = null, selected = false, className = null, children, ...rest } = props;

    const iconEntry = icon ? ICON_MAP[icon] : null;

    if(!iconEntry) return null;

    const src = (selected && iconEntry.selected) ? iconEntry.selected : iconEntry.normal;

    return (
        <div
            ref={ ref }
            className={ classNames('flex items-center justify-center cursor-pointer', className) }
            { ...rest }>
            <img src={ src } alt={ icon } className="h-[22px] w-auto object-contain pointer-events-none" draggable={ false } />
            { children }
        </div>
    );
});

AvatarEditorIcon.displayName = 'AvatarEditorIcon';
