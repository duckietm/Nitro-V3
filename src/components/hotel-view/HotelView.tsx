import { GetConfiguration } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { RoomWidgetView } from './RoomWidgetView';

/**
 * Configure via renderer-config.json: "timezone.settings": "Europe/Amsterdam"
 */
function getHourInTimezone(timezone: string): number
{
    if(!timezone) return new Date().getHours();

    try
    {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false
        }).formatToParts(new Date());

        const h = parts.find(p => p.type === 'hour');

        return h ? (parseInt(h.value, 10) % 24) : new Date().getHours();
    }
    catch
    {
        return new Date().getHours();
    }
}

/**
 * Maps an hour to a named time period, matching the old UI's ranges:
 *  06-09 → morning
 *  10-16 → day
 *  17-19 → sunset
 *  20-23 → evening
 *  00-05 → night
 */
function getTimeOfDay(hour: number): string
{
    if(hour > 5  && hour <= 9)  return 'morning';
    if(hour > 9  && hour <= 16) return 'day';
    if(hour > 16 && hour <= 19) return 'sunset';
    if(hour > 19 && hour <= 23) return 'evening';

    return 'night';
}

const SKY_COLORS: Record<string, string> = {
    morning: '#E67451',
    sunset:  '#C76E00',
    evening: '#0a0a1e',
    night:   '#000000',
};

export const HotelView: FC<{}> = props =>
{
    const configBgColor = GetConfigurationValue('hotelview')['images']['background.colour'];

    const timezone = GetConfigurationValue<string>('timezone.settings', '');

    const timeOfDay = useMemo(() =>
    {
        const hour = getHourInTimezone(timezone);

        return getTimeOfDay(hour);
    }, [ timezone ]);
	
	/**
	const timeOfDay = 'sunset';
	For debuging the diff views
	*/

    const skyColor = SKY_COLORS[timeOfDay] ?? configBgColor ?? '#000';

    const containerRef = useRef<HTMLDivElement>(null);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ startX, setStartX ] = useState(0);
    const [ startY, setStartY ] = useState(0);
    const [ scrollLeft, setScrollLeft ] = useState(0);
    const [ scrollTop, setScrollTop ] = useState(0);

    useEffect(() =>
    {
        if(!containerRef.current) return;

        const container = containerRef.current;
        const contentWidth = 3000;
        const contentHeight = 1185;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - 55;

        container.scrollLeft = Math.max(0, (contentWidth - viewportWidth) / 2);
        container.scrollTop  = Math.max(0, (contentHeight - viewportHeight) / 2);

        setScrollLeft(container.scrollLeft);
        setScrollTop(container.scrollTop);
    }, []);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
    {
        if(e.button !== 0) return;

        setIsDragging(true);
        setStartX(e.pageX + scrollLeft);
        setStartY(e.pageY + scrollTop);

        if(containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) =>
    {
        if(!isDragging) return;

        e.preventDefault();

        const newScrollLeft = startX - e.pageX;
        const newScrollTop  = startY - e.pageY;

        if(containerRef.current)
        {
            containerRef.current.scrollLeft = newScrollLeft;
            containerRef.current.scrollTop  = newScrollTop;
            setScrollLeft(newScrollLeft);
            setScrollTop(newScrollTop);
        }
    };

    const handleMouseUp = () =>
    {
        setIsDragging(false);
        if(containerRef.current) containerRef.current.style.cursor = 'grab';
    };

    return (
        <div
            ref={ containerRef }
            className={ `nitro-hotel-view hotel-${ timeOfDay } block fixed w-full h-[calc(100%-55px)] text-[#000]` }
            style={ {
                background: skyColor,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                maxWidth: '100vw',
                maxHeight: '100vh',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                cursor: 'grab'
            } }
            onMouseDown={ handleMouseDown }
            onMouseMove={ handleMouseMove }
            onMouseUp={ handleMouseUp }
            onMouseLeave={ handleMouseUp }
        >
            <div
                className="hotelview position-relative"
                style={ { minWidth: '2600px', minHeight: '1425px' } }
            >
                <div className="hotelview-background w-full h-full" style={ { position: 'absolute', top: 0, left: 0 } } />
                <RoomWidgetView />
            </div>
        </div>
    );
};
