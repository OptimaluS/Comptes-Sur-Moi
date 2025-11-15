import React from 'react';
import type { Notification } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
    toasts: Notification[];
    onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-6 right-6 z-50 space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} notification={toast} onClose={() => onClose(toast.id)} />
            ))}
        </div>
    );
};

export default ToastContainer;