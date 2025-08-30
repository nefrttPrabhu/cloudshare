"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

export interface ToastProps {
    id: string;
    message: string;
    type: "success" | "error";
    duration?: number;
    onClose: (id: string) => void;
}

export default function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const getToastStyles = () => {
        const baseStyles = "border-2 border-dashed rounded-lg p-4 shadow-lg transition-all duration-300 transform";
        
        if (type === "success") {
            return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500 text-green-800 dark:text-green-200`;
        } else {
            return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500 text-red-800 dark:text-red-200`;
        }
    };

    return (
        <div
            className={`${getToastStyles()} ${
                isVisible 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-full opacity-0"
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="font-medium">{message}</p>
                </div>
                <button
                    onClick={handleClose}
                    className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <IoClose size={20} />
                </button>
            </div>
        </div>
    );
}
