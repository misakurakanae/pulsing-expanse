'use client';

import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: {
    onNext?: () => void;
    onPrevious?: () => void;
    onBookmark?: () => void;
    onRefresh?: () => void;
    onRate?: (rating: number) => void;
}) {
    useEffect(() => {
        function handleKeyPress(e: KeyboardEvent) {
            // 入力中は無視
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'j':
                    handlers.onNext?.();
                    break;
                case 'k':
                    handlers.onPrevious?.();
                    break;
                case 'b':
                    handlers.onBookmark?.();
                    break;
                case 'r':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        handlers.onRefresh?.();
                    }
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    handlers.onRate?.(parseInt(e.key));
                    break;
            }
        }

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handlers]);
}
