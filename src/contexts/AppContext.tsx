import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Provider, AppContextType, SignupData, ProviderSignupData, Notification as AppNotification } from '../types';
import { supabase } from '../lib/supabase';
import { providerService } from '../services/providerService';
import { notificationService } from '../services/notificationService';

interface ExtendedAppContextType extends AppContextType {
  providerProfile: Provider | null;
  checkingProfile: boolean;
  createProviderProfile: (data: Omit<ProviderSignupData, 'email' | 'password' | 'name' | 'phone'>) => Promise<void>;
  refreshProviderProfile: () => Promise<void>;
}

const AppContext = createContext<ExtendedAppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'provider' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [providerProfile, setProviderProfile] = useState<Provider | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const [notificationSubscription, setNotificationSubscription] = useState<any>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const checkProviderProfile = async (userId: string) => {
    try {
      setCheckingProfile(true);
      const profile = await providerService.getProviderByUserId(userId);
      
      if (profile) {
        setProviderProfile(profile);
        // Ștergem orice eroare salvată anterior
        window.localStorage.removeItem('providerProfileError');
      } else {
        const error = "Profilul de furnizor nu a fost găsit. Te rugăm să completezi datele necesare.";
        window.localStorage.setItem('providerProfileError', error);
        setProviderProfile(null);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Eroare la încărcarea profilului de furnizor";
      window.localStorage.setItem('providerProfileError', errorMessage);
      console.error("Error checking provider profile:", error);
      setProviderProfile(null);
    } finally {
      setCheckingProfile(false);
    }
  };

  const refreshProviderProfile = async () => {
    if (user && userType === 'provider') {
      await checkProviderProfile(user.id);
    }
  };
  
  useEffect(() => {
    const handleAuthChange = async (session: any) => {
      setLoading(true);
      setCheckingProfile(true);
      
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
        setNotificationSubscription(null);
      }
      
      if (session?.user) {
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const { data: userProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        
        if (userProfile) {
          setUser(userProfile);
          setUserType(userProfile.user_type);
          setIsAuthenticated(true);
          setIsGuest(false);
          
          await fetchNotifications(session.user.id);
          const subscription = subscribeToNotifications(session.user.id);
          setNotificationSubscription(subscription);
          
          if ('Notification' in window && window.Notification.permission === 'default') {
            window.Notification.requestPermission();
          }
          
          if (userProfile.user_type === 'provider') {
            await checkProviderProfile(session.user.id);
          } else {
            setProviderProfile(null);
            setCheckingProfile(false);
          }
        } else {
          setCheckingProfile(false);
        }
      } else {
        setUser(null);
        setUserType(null);
        setIsAuthenticated(false);
        setProviderProfile(null);
        setNotifications([]);
        setCheckingProfile(false);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    return () => {
      subscription?.unsubscribe();
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
      }
    };
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const data = await notificationService.getUserNotifications(userId);
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const subscribeToNotifications = (userId: string) => {
    return notificationService.subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      
      if ('Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(newNotification.title, {
          body: newNotification.message,
        });
      }
      
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {});
    });
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (data: SignupData, user_type: 'customer' | 'provider') => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          user_type: user_type,
        },
      },
    });
    if (error) throw error;
  };

  const createProviderProfile = async (data: Omit<ProviderSignupData, 'email' | 'password' | 'name' | 'phone'>) => {
    if (!user) throw new Error("Utilizatorul trebuie să fie autentificat.");

    console.log("Începe crearea profilului provider pentru user:", user.id);
    console.log("Datele primite:", data);

    try {
      const profile = await providerService.createProvider({
        user_id: user.id,
        email: user.email!,
        phone: user.phone!,
        ...data
      });

      console.log("Profil creat cu succes:", profile);

      // Așteptăm puțin înainte să verificăm profilul
      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkProviderProfile(user.id);

      return profile;
    } catch (error: any) {
      console.error("Eroare la crearea profilului:", error);
      throw new Error(error?.message || "Nu am putut crea profilul de provider");
    }
  };

  const logout = async () => {
    if (notificationSubscription) {
      notificationSubscription.unsubscribe();
      setNotificationSubscription(null);
    }
    await supabase.auth.signOut();
  };
  
  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      await notificationService.clearAllNotifications(user.id);
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>;
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        userType,
        notifications,
        unreadCount,
        providerProfile,
        checkingProfile,
        login,
        signup,
        logout,
        continueAsGuest,
        markNotificationAsRead,
        clearAllNotifications,
        createProviderProfile,
        refreshProviderProfile,
        signupProvider: async () => console.warn("signupProvider is deprecated and should not be used."),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
