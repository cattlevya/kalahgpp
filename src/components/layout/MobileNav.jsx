import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Stethoscope,
    Newspaper,
    History,
    User,
    Calendar,
    MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const MobileNav = () => {
    const location = useLocation();
    const { user } = useAuth();

    if (!user) return null;

    // Define items for mobile nav - keeping it concise for bottom bar (max ~5 items)
    const allItems = [
        { label: 'Home', path: '/', icon: LayoutDashboard, roles: ['patient', 'expert'] },
        { label: 'Konsul', path: '/konsultasi', icon: Calendar, roles: ['patient', 'expert'] },
        { label: 'Diagnosa', path: '/diagnosa', icon: Stethoscope, roles: ['patient'] },
        { label: 'Chat', path: '/chat', icon: MessageSquare, roles: ['patient', 'expert'] },
        { label: 'Profil', path: user.role === 'expert' ? '/expert/profile' : '/profile', icon: User, roles: ['patient', 'expert'] },
    ];

    const navItems = allItems.filter(item => item.roles.includes(user.role));

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path === '/profile' && location.pathname === '/expert/profile');

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <item.icon className={clsx(
                                "w-6 h-6",
                                isActive ? "fill-blue-100" : ""
                            )} />
                            <span className={clsx(
                                "text-[10px] font-medium truncate max-w-[60px]",
                                isActive ? "font-bold" : ""
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
