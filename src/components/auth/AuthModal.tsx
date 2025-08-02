import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, MailCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { useApp } from '../../contexts/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { login, signup } = useApp();

  if (!isOpen) return null;

  const handleClose = () => {
    setSignupSuccess(false);
    setFormData({ email: '', password: '', name: '', phone: '' });
    setError('');
    setIsCompany(false);
    setMode('login');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        handleClose();
      } else {
        const user_type = isCompany ? 'provider' : 'customer';
        await signup(formData, user_type);
        setSignupSuccess(true);
        
        if (isCompany) {
          setTimeout(() => {
            handleClose();
            onNavigate('provider_signup');
          }, 3000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {signupSuccess ? 'Verifică Email-ul' : mode === 'login' ? 'Conectare' : 'Creează Cont'}
            </h2>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {signupSuccess ? (
            <div className="text-center py-4">
              <MailCheck size={40} className="text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-600 leading-relaxed">
                Contul a fost creat! Ți-am trimis un email la <strong>{formData.email}</strong>.
                Te rugăm să activezi contul folosind link-ul din email.
              </p>
              {isCompany && (
                <p className="text-amber-600 mt-4 font-medium">
                  Vei fi redirecționat către completarea profilului de furnizor...
                </p>
              )}
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <Input label={isCompany ? "Nume Reprezentant" : "Nume Complet"} type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} icon={<User size={18} className="text-slate-400" />} required />
                    <Input label="Telefon" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} icon={<Phone size={18} className="text-slate-400" />} required />
                  </>
                )}
                <Input label="Email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} icon={<Mail size={18} className="text-slate-400" />} required />
                <div className="relative">
                  <Input label="Parolă" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} icon={<Lock size={18} className="text-slate-400" />} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'signup' && <div className="pt-2"><Checkbox id="is-company-checkbox" checked={isCompany} onChange={setIsCompany} label="Sunt companie și doresc să mă listez." /></div>}
                {mode === 'login' && <div className="flex items-center justify-between"><Checkbox id="remember-me" checked={rememberMe} onChange={setRememberMe} label="Ține-mă minte" /><button type="button" className="text-amber-600 hover:text-amber-700 text-sm font-medium">Ai uitat parola?</button></div>}
                <Button type="submit" className="w-full py-3" loading={loading} size="lg">{mode === 'login' ? 'Conectează-te' : 'Creează Cont'}</Button>
              </form>
              <div className="mt-6 space-y-4">
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">sau</span></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex items-center justify-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google</Button>
                  <Button variant="outline" className="flex items-center justify-center gap-2"><svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</Button>
                </div>
                <Button variant="ghost" onClick={() => { handleClose(); onNavigate('main'); }} className="w-full">Continuă ca Vizitator</Button>
                <div className="text-center"><button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-amber-600 hover:text-amber-700 font-medium">{mode === 'login' ? "Nu ai cont? Înregistrează-te" : 'Ai deja cont? Conectează-te'}</button></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
