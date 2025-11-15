import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Notification } from '../types';
import { NotificationType } from '../types';

interface NotificationCenterProps {
    anchorRef: React.RefObject<HTMLElement | null>;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onClose: () => void;
}

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    const styles: Record<NotificationType, { icon: React.ReactNode, color: string }> = {
        [NotificationType.LOW_BALANCE]: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l4.502 8.622c.624 1.194-.22 2.779-1.503 2.779H5.257c-1.283 0-2.127-1.585-1.503-2.779l4.503-8.622zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>, color: 'bg-amber-100 text-amber-600' },
        [NotificationType.DEADLINE_SOON]: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>, color: 'bg-sky-100 text-sky-600' },
        [NotificationType.OVERDUE]: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>, color: 'bg-red-100 text-red-600' },
        [NotificationType.BUDGET_APPROACHING]: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l4.502 8.622c.624 1.194-.22 2.779-1.503 2.779H5.257c-1.283 0-2.127-1.585-1.503-2.779l4.503-8.622zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>, color: 'bg-amber-100 text-amber-600' },
        [NotificationType.BUDGET_EXCEEDED]: { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>, color: 'bg-red-100 text-red-600' },
    };

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles[type].color}`}>
            {styles[type].icon}
        </div>
    );
};

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `il y a ${Math.floor(interval)} an(s)`;
    interval = seconds / 2592000;
    if (interval > 1) return `il y a ${Math.floor(interval)} mois`;
    interval = seconds / 86400;
    if (interval > 1) return `il y a ${Math.floor(interval)} jour(s)`;
    interval = seconds / 3600;
    if (interval > 1) return `il y a ${Math.floor(interval)} heure(s)`;
    interval = seconds / 60;
    if (interval > 1) return `il y a ${Math.floor(interval)} minute(s)`;
    return "à l'instant";
};


const NotificationCenter: React.FC<NotificationCenterProps> = ({ anchorRef, notifications, setNotifications, onClose }) => {
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const updatePosition = useCallback(() => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8, // 8px margin
                right: window.innerWidth - rect.right,
            });
        }
    }, [anchorRef]);

    useLayoutEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // Capture scroll on any element
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node) && !anchorRef.current?.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose, anchorRef]);
    
    if (typeof document === 'undefined' || !position) {
        return null;
    }

    return createPortal(
        <div
            ref={panelRef}
            style={{ top: `${position.top}px`, right: `${position.right}px` }}
            className="fixed z-50 w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-center-title"
        >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 id="notification-center-title" className="font-bold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        Marquer comme lu
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto">
                {sortedNotifications.length > 0 ? (
                    <ul>
                        {sortedNotifications.map(notif => (
                            <li key={notif.id} className={`border-b border-gray-100 last:border-b-0 ${!notif.isRead ? 'bg-indigo-50/50' : ''}`}>
                                <button onClick={() => handleMarkAsRead(notif.id)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                    <NotificationIcon type={notif.type} />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">{notif.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{timeAgo(new Date(notif.date))}</p>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-1 shrink-0" aria-label="Non lu"></div>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12 px-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="mt-4 font-semibold text-gray-700">Tout est à jour !</h4>
                        <p className="mt-1 text-sm text-gray-500">Aucune nouvelle notification.</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default NotificationCenter;