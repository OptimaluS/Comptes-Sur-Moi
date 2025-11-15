import React, { useEffect, useState } from 'react';
import type { Notification } from '../types';
import { NotificationType } from '../types';

interface ToastProps {
    notification: Notification;
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


const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timerIn = setTimeout(() => setVisible(true), 100);
        const timerOut = setTimeout(() => setVisible(false), 4500);
        const timerClose = setTimeout(onClose, 5000);

        return () => {
            clearTimeout(timerIn);
            clearTimeout(timerOut);
            clearTimeout(timerClose);
        };
    }, [onClose]);

    return (
        <div className={`w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3 transition-all duration-300 ease-in-out ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <NotificationIcon type={notification.type} />
            <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Nouvelle alerte</p>
                <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;