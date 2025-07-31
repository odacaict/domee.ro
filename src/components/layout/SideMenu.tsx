import React from 'react';
import { X, User, Calendar, Settings, HelpCircle, LogOut, UserPlus, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../lib/utils';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user, isAuthenticated, isGuest, userType, logout } = useApp();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'Info Cont',
      action: () => onNavigate(isAuthenticated ? 'profile' : 'auth'),
      show: true,
    },
    {
      icon: Calendar,
      label: 'Rezervările Mele',
      action: () => onNavigate('bookings'),
      show: isAuthenticated || isGuest,
    },
    {
      icon: DollarSign,
      label: 'Dashboard Furnizor',
      action: () => onNavigate('provider-dashboard'),
      show: userType === 'provider',
    },
    {
      icon: Settings,
      label: 'Setări',
      action: () => onNavigate('settings'),
      show: isAuthenticated,
    },
    {
      icon: HelpCircle,
      label: 'Ajutor & Suport',
      action: () => onNavigate('help'),
      show: true,
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Side Menu */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="bg-amber-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Meniu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-lg font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.name || 'Utilizator'}</p>
                <p className="text-amber-100 text-sm">{user.email}</p>
                {userType === 'provider' && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500 rounded-full text-xs font-medium">
                    Furnizor
                  </span>
                )}
              </div>
            </div>
          )}
          
          {isGuest && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <p className="font-medium">Vizitator</p>
                <button
                  onClick={() => onNavigate('auth')}
                  className="text-amber-100 text-sm hover:text-white transition-colors"
                >
                  Conectează-te →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          {menuItems.filter(item => item.show).map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
            >
              <item.icon size={20} className="text-slate-600" />
              <span className="text-slate-700 font-medium">{item.label}</span>
            </button>
          ))}
          
          {!isAuthenticated && !isGuest && (
            <button
              onClick={() => {
                onNavigate('provider-signup');
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 rounded-lg transition-colors text-left mt-2 border-2 border-amber-600 text-amber-600"
            >
              <UserPlus size={20} />
              <span className="font-medium">Înregistrare Furnizor</span>
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-left mt-4 text-red-600"
            >
              <LogOut size={20} />
              <span className="font-medium">Deconectare</span>
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex justify-center gap-4 text-sm text-slate-500">
            <button className="hover:text-slate-700 transition-colors">Termeni</button>
            <span>•</span>
            <button className="hover:text-slate-700 transition-colors">Confidențialitate</button>
            <span>•</span>
            <button className="hover:text-slate-700 transition-colors">Contact</button>
          </div>
        </div>
      </div>
    </>
  );
};
