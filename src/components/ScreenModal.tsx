'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createScreen, updateScreen } from '../app/actions/screens';
import styles from './modal.module.css';

import ScreenSchedulesManager from './ScreenSchedulesManager';

type Space = {
    id: string;
    name: string;
    venue: { name: string };
};

type Screen = {
    id: string;
    name: string;
    spaceId: string;
    playlistId: string | null;
    resolution: string | null;
    orientation: string;
    status: string;
    matrixRow: number | null;
    matrixCol: number | null;
    timecodeId: string | null;
    schedules: any[];
};

type Playlist = {
    id: string;
    name: string;
};

type Timecode = {
    id: string;
    name: string;
};

type ScreenModalProps = {
    isOpen: boolean;
    onClose: () => void;
    screen?: Screen | null;
    spaces: Space[];
    playlists: Playlist[];
    timecodes: Timecode[];
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving...' : isEditing ? 'Update Screen' : 'Create Screen'}
        </button>
    );
}

export default function ScreenModal({ isOpen, onClose, screen, spaces, playlists, timecodes }: ScreenModalProps) {
    const [state, setState] = useState<{ message?: string; errors?: any }>({});
    const [resolutionOption, setResolutionOption] = useState<'1080p' | '4k' | 'other'>('1080p');
    const [customWidth, setCustomWidth] = useState<number | ''>('');
    const [customHeight, setCustomHeight] = useState<number | ''>('');
    const [activeTab, setActiveTab] = useState<'settings' | 'schedules'>('settings');

    useEffect(() => {
        if (isOpen) {
            setState({});
            setActiveTab('settings');
        }
    }, [isOpen]);

    const isEditing = !!screen;
    const action = isEditing ? updateScreen.bind(null, screen.id) : createScreen;

    // ... (keep resolution logic same as before, re-implementing useEffect below) ...
    useEffect(() => {
        if (!isOpen) return;
        const res = screen?.resolution || '';
        if (res === '1920x1080') {
            setResolutionOption('1080p');
            setCustomWidth('');
            setCustomHeight('');
        } else if (res === '3840x2160') {
            setResolutionOption('4k');
            setCustomWidth('');
            setCustomHeight('');
        } else if (res && res.includes('x')) {
            const [w, h] = res.split('x').map((v) => Number(v));
            if (w && h) {
                setResolutionOption('other');
                setCustomWidth(w);
                setCustomHeight(h);
            } else {
                setResolutionOption('1080p');
                setCustomWidth('');
                setCustomHeight('');
            }
        } else {
            setResolutionOption('1080p');
            setCustomWidth('');
            setCustomHeight('');
        }
    }, [isOpen, screen]);

    // Group spaces by venue for the dropdown
    const spacesByVenue = spaces.reduce((acc, space) => {
        const venueName = space.venue.name;
        if (!acc[venueName]) {
            acc[venueName] = [];
        }
        acc[venueName].push(space);
        return acc;
    }, {} as Record<string, Space[]>);


    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Screen' : 'Add New Screen'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                {isEditing && (
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            General Settings
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'schedules' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('schedules')}
                        >
                            Schedules
                        </button>
                    </div>
                )}

                {activeTab === 'settings' ? (
                    <form
                        action={async (formData) => {
                            const result = await action(state, formData);
                            if (result.success) {
                                onClose();
                            } else {
                                setState(result);
                            }
                        }}
                        className={styles.form}
                    >
                        <div className={styles.formGroup}>
                            <label htmlFor="name">Screen Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={screen?.name}
                                required
                                className={styles.input}
                            />
                            {state.errors?.name && <p className={styles.error}>{state.errors.name}</p>}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="spaceId">Location (Space)</label>
                            <select
                                id="spaceId"
                                name="spaceId"
                                defaultValue={screen?.spaceId || ''}
                                required
                                className={styles.select}
                            >
                                <option value="" disabled>Select a Location</option>
                                {Object.entries(spacesByVenue).map(([venueName, venueSpaces]) => (
                                    <optgroup key={venueName} label={venueName}>
                                        {venueSpaces.map((space) => (
                                            <option key={space.id} value={space.id}>
                                                {space.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {state.errors?.spaceId && <p className={styles.error}>{state.errors.spaceId}</p>}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="playlistId">Assigned Playlist (Default)</label>
                            <select
                                id="playlistId"
                                name="playlistId"
                                defaultValue={screen?.playlistId || ''}
                                className={styles.select}
                            >
                                <option value="">No Playlist (Idle)</option>
                                {playlists.map((playlist) => (
                                    <option key={playlist.id} value={playlist.id}>
                                        {playlist.name}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: '#71717a' }}>This playlist runs when no schedule is active.</small>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="timecodeId">Sync to Timecode</label>
                            <select
                                id="timecodeId"
                                name="timecodeId"
                                defaultValue={screen?.timecodeId || ''}
                                className={styles.select}
                            >
                                <option value="">No Sync (Local Playback)</option>
                                {timecodes.map((timecode) => (
                                    <option key={timecode.id} value={timecode.id}>
                                        {timecode.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Matrix Display Position</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="matrixRow" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Row</label>
                                    <input
                                        type="number"
                                        id="matrixRow"
                                        name="matrixRow"
                                        min={0}
                                        defaultValue={screen?.matrixRow ?? ''}
                                        placeholder="0"
                                        className={styles.input}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="matrixCol" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Column</label>
                                    <input
                                        type="number"
                                        id="matrixCol"
                                        name="matrixCol"
                                        min={0}
                                        defaultValue={screen?.matrixCol ?? ''}
                                        placeholder="0"
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                            <small style={{ display: 'block', marginTop: '4px' }}>Leave empty for single-screen</small>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="resolutionPreset">Resolution</label>
                            <select
                                id="resolutionPreset"
                                name="resolutionPreset"
                                value={resolutionOption}
                                onChange={(e) => setResolutionOption(e.target.value as any)}
                                className={styles.select}
                            >
                                <option value="1080p">1920 x 1080 (1080p)</option>
                                <option value="4k">3840 x 2160 (4K)</option>
                                <option value="other">Other (custom)</option>
                            </select>

                            {resolutionOption === 'other' ? (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Width"
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(e.target.value === '' ? '' : Number(e.target.value))}
                                        className={styles.input}
                                    />
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Height"
                                        value={customHeight}
                                        onChange={(e) => setCustomHeight(e.target.value === '' ? '' : Number(e.target.value))}
                                        className={styles.input}
                                    />
                                </div>
                            ) : null}

                            <input
                                type="hidden"
                                id="resolution"
                                name="resolution"
                                value={
                                    resolutionOption === '1080p'
                                        ? '1920x1080'
                                        : resolutionOption === '4k'
                                            ? '3840x2160'
                                            : (customWidth && customHeight) ? `${customWidth}x${customHeight}` : (screen?.resolution || '')
                                }
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="orientation">Orientation</label>
                            <select
                                id="orientation"
                                name="orientation"
                                defaultValue={screen?.orientation || 'LANDSCAPE'}
                                className={styles.select}
                            >
                                <option value="LANDSCAPE">Landscape</option>
                                <option value="PORTRAIT">Portrait</option>
                            </select>
                        </div>

                        {state.message && <p className={styles.formMessage}>{state.message}</p>}

                        <div className={styles.footer}>
                            <button type="button" onClick={onClose} className="btn">Cancel</button>
                            <SubmitButton isEditing={isEditing} />
                        </div>
                    </form>
                ) : (
                    <ScreenSchedulesManager
                        screenId={screen!.id}
                        schedules={screen!.schedules || []}
                        playlists={playlists}
                    />
                )}
            </div>
        </div>
    );
}
