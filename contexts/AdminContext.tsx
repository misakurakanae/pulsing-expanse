'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface AdminContextType {
    isAdmin: boolean;
    isPremiumDebug: boolean;
    togglePremiumDebug: () => void;
    resetAiLimit: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPremiumDebug, setIsPremiumDebug] = useState(false);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    async function checkAdminStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Check for 'admin' role in user_metadata
            const role = user.user_metadata?.role;
            setIsAdmin(role === 'admin');
        }
    }

    const togglePremiumDebug = () => {
        setIsPremiumDebug(prev => !prev);
    };

    const resetAiLimit = () => {
        localStorage.removeItem('summaryUsage');
        alert('AI要約の利用回数をリセットしました。');
        // Force reload to reflect changes in SummaryButton
        window.location.reload();
    };

    return (
        <AdminContext.Provider value={{ isAdmin, isPremiumDebug, togglePremiumDebug, resetAiLimit }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
