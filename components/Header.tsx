import React, { useRef, useState, useEffect } from 'react';
import type { Notification } from '../types';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    setIsSidebarOpen: (isOpen: boolean) => void;
    greeting?: string;
}

const Header: React.FC<HeaderProps> = ({ notifications, setNotifications, setIsSidebarOpen, greeting }) => {
        const [isPanelOpen, setIsPanelOpen] = useState(false);
        const buttonRef = useRef<HTMLButtonElement | null>(null);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        const [userName, setUserName] = useState<string | null>(null);

        useEffect(() => {
            const updateName = () => setUserName(localStorage.getItem('userName'));
            updateName();
            window.addEventListener('storage', updateName);
            return () => window.removeEventListener('storage', updateName);
        }, []);

        const greetingText = userName && userName.trim() ? `Bonsoir, ${userName.trim()} !` : 'Bonsoir !';

        return (
            <header className="sticky top-0 z-20 h-20 grid grid-cols-[1fr_auto_1fr] items-center bg-[#282a2c] border-b border-[#282a2c] px-8">
                <div></div>
                <h1 className="text-center text-3xl font-bold text-white flex items-center justify-center">{greetingText}</h1>
                <div className="flex items-center justify-end">
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="p-2 rounded-full text-[#282a2c] bg-white hover:bg-gray-200 transition-colors shadow-lg"
                        aria-label={`Notifications (${unreadCount} non lues)`}
                        aria-expanded={isPanelOpen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="#282a2c" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>
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
        </header>
    );
};

export default Header;
