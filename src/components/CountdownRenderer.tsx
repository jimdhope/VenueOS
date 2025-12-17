'use client';

import { useState, useEffect } from 'react';

type CountdownConfig = {
    targetDate: string; // ISO date string
    // New unit selection flags
    showYears?: boolean;
    showMonths?: boolean;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
    hideLabels?: boolean;
    // Legacy support
    displayFormat?: 'full' | 'days' | 'hours' | 'minutes' | 'seconds' | 'dhm' | 'hms';
    label?: string;
};

type Props = {
    data: string; // JSON string of CountdownConfig
};

export default function CountdownRenderer({ data }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    let config: CountdownConfig;
    try {
        config = JSON.parse(data);
    } catch {
        return <div style={{ color: '#fff', fontSize: '2rem' }}>Invalid countdown</div>;
    }

    const target = new Date(config.targetDate);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
        return (
            <div style={containerStyle}>
                <div style={numberStyle}>🎉 Now! 🎉</div>
            </div>
        );
    }

    // Calculate all units
    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalMonths = Math.floor(totalDays / 30.44);
    const totalYears = Math.floor(totalDays / 365.25);

    // Build display parts based on selected units
    const parts: string[] = [];

    // Check if using new unit flags or legacy displayFormat
    const hasUnitFlags = config.showYears !== undefined ||
        config.showMonths !== undefined ||
        config.showDays !== undefined ||
        config.showHours !== undefined ||
        config.showMinutes !== undefined ||
        config.showSeconds !== undefined;

    const hideLabels = config.hideLabels || false;

    if (hasUnitFlags) {
        // New unit-based display
        if (config.showYears) {
            parts.push(hideLabels ? `${totalYears}` : `${totalYears} ${totalYears === 1 ? 'year' : 'years'}`);
        }
        if (config.showMonths) {
            const months = config.showYears ? Math.floor((totalDays % 365.25) / 30.44) : totalMonths;
            parts.push(hideLabels ? `${months}` : `${months} ${months === 1 ? 'month' : 'months'}`);
        }
        if (config.showDays) {
            let days = totalDays;
            if (config.showYears) days = Math.floor(totalDays % 365.25);
            if (config.showMonths && !config.showYears) days = Math.floor(totalDays % 30.44);
            if (config.showMonths && config.showYears) days = Math.floor((totalDays % 365.25) % 30.44);
            parts.push(hideLabels ? `${days}` : `${days} ${days === 1 ? 'day' : 'days'}`);
        }
        if (config.showHours) {
            const hours = totalHours % 24;
            parts.push(hideLabels ? `${hours}` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        }
        if (config.showMinutes) {
            const minutes = totalMinutes % 60;
            parts.push(hideLabels ? `${minutes}` : `${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
        }
        if (config.showSeconds) {
            const seconds = totalSeconds % 60;
            parts.push(hideLabels ? `${seconds}` : `${seconds} ${seconds === 1 ? 'sec' : 'secs'}`);
        }

        // If no units selected, default to days
        if (parts.length === 0) {
            parts.push(hideLabels ? `${totalDays}` : `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`);
        }
    } else {
        // Legacy displayFormat support
        switch (config.displayFormat) {
            case 'days':
                parts.push(`${totalDays} ${totalDays === 1 ? 'day' : 'days'}`);
                break;
            case 'hours':
                parts.push(`${totalHours} ${totalHours === 1 ? 'hour' : 'hours'}`);
                break;
            case 'minutes':
                parts.push(`${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`);
                break;
            case 'seconds':
                parts.push(`${totalSeconds} ${totalSeconds === 1 ? 'second' : 'seconds'}`);
                break;
            case 'dhm':
                parts.push(`${totalDays}d ${totalHours % 24}h ${totalMinutes % 60}m`);
                break;
            case 'hms':
                parts.push(`${String(totalHours).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`);
                break;
            case 'full':
            default:
                parts.push(`${totalDays}d ${totalHours % 24}h ${totalMinutes % 60}m ${totalSeconds % 60}s`);
                break;
        }
    }

    const displayValue = parts.join(' ');

    return (
        <div style={containerStyle}>
            {config.label && <div style={labelStyle}>{config.label}</div>}
            <div style={numberStyle}>{displayValue}</div>
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    background: 'transparent',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
};

const labelStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    opacity: 0.8,
};

const numberStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    textAlign: 'center',
};
