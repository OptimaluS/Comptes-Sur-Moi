import React, { useRef, useState } from 'react';
import type { Notification } from '../types';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ notifications, setNotifications, setIsSidebarOpen }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <header className="bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200 sticky top-0 z-20">
            <div className="container mx-auto flex items-center justify-between">
                 <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
                    aria-label="Ouvrir le menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center justify-end flex-1">
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                            aria-label={`Notifications (${unreadCount} non lues)`}
                            aria-expanded={isPanelOpen}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                            )}
                        </button>
                        {isPanelOpen && (
                            <NotificationCenter
                                anchorRef={buttonRef}
                                notifications={notifications}
                                setNotifications={setNotifications}
                                onClose={() => setIsPanelOpen(false)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
