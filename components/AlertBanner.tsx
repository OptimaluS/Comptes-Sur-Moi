import React from 'react';
import type { Notification } from '../types';
import { NotificationType } from '../types';

interface AlertBannerProps {
    notification: Notification;
    onDismiss: (id: string) => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ notification, onDismiss }) => {
    const styles: Record<NotificationType, { icon: React.ReactNode, colorClasses: string }> = {
        [NotificationType.OVERDUE]: { 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
            colorClasses: 'bg-red-100 border-red-500 text-red-800'
        },
        [NotificationType.BUDGET_EXCEEDED]: {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
            colorClasses: 'bg-red-100 border-red-500 text-red-800'
        },
        [NotificationType.LOW_BALANCE]: { icon: null, colorClasses: '' },
        [NotificationType.DEADLINE_SOON]: { icon: null, colorClasses: '' },
        [NotificationType.BUDGET_APPROACHING]: { icon: null, colorClasses: '' },
    };
    
    const style = styles[notification.type];

    return (
        <div className={`p-4 rounded-lg border-l-4 flex items-center justify-between gap-4 ${style.colorClasses}`} role="alert">
            <div className="flex items-center gap-3">
                <span className="shrink-0">{style.icon}</span>
                <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
                onClick={() => onDismiss(notification.id)}
                className="p-1 rounded-full hover:bg-red-200"
                aria-label="Fermer l'alerte"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default AlertBanner;