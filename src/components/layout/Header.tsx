import React, { useState } from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import { AuthModal } from '../auth/AuthModal';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface HeaderProps {
  onMenuClick: () => void;
  onLogoClick: () => void;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogoClick, onNavigate }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isAuthenticated, isGuest, user } = useApp();
  const { unreadCount } = useNotifications();

  const handleUserClick = () => {
    if (!isAuthenticated && !isGuest) {
      setShowAuthModal(true);
    } else {
      onMenuClick(); // Open side menu when user is authenticated
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Deschide meniu"
            >
              <Menu size={24} className="text-slate-600" />
            </button>

            <button
              onClick={onLogoClick}
              className="flex-1 flex justify-center hover:opacity-80 transition-opacity"
              aria-label="Mergi la agenda rezervări"
            >
              <img 
                src="/logo.png" 
                alt="doo mee" 
                className="h-10 object-contain"
              />
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
                aria-label={`Notificări${unreadCount > 0 ? ` - ${unreadCount} necitite` : ''}`}
              >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={handleUserClick}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Cont utilizator"
              >
                {isAuthenticated && user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.email}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onNavigate={onNavigate} 
      />
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};