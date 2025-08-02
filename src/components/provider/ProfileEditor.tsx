import React, { useState, useEffect } from 'react';
import { Save, Building, MapPin, Clock, Globe, Phone, Mail, Facebook, Instagram, Youtube, Shield, Plus, CreditCard, Bitcoin, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUploader } from '../shared/ImageUploader';
import { Provider, DaySchedule, BankAccount } from '../../types';
import { supabase } from '../../lib/supabase';
import { ROMANIA_CITIES, FACILITIES_OPTIONS, LANGUAGES } from '../../utils/constants';
import { plusCodeHelpers } from '../../utils/plusCodeHelpers';
import { validateCoordinates } from '../../utils/validation';

interface ProfileEditorProps {
  providerId: string;
}

interface ProfileFormData {
  salon_name: string;
  description: string;
  address: string;
  city: string;
  coordinates?: string;
  location_plus_code?: string;
  phone: string;
  email: string;
  website?: string;
  working_hours: Record<string, DaySchedule>;
  facilities: string[];
  languages: string[];
  social_media?: { facebook?: string; instagram?: string; youtube?: string; };
  policies?: { cancellation?: string; payment?: string; health_safety?: string; };
  team_members?: Array<{ name: string; role: string; description?: string; image?: string; }>;
  company_name: string;
  fiscal_code: string;
  company_type: string;
  bank_accounts: BankAccount[];
  crypto_wallets: string[];
}

const facilityLabels: Record<string, string> = {
  wifi: 'Wi-Fi Gratuit', parking: 'Parcare', card_payment: 'Plată cu Cardul',
  crypto_payment: 'Plată Crypto', air_conditioning: 'Aer Condiționat',
  wheelchair_access: 'Acces Persoane cu Dizabilități', kids_friendly: 'Prietenos cu Copiii',
  pets_allowed: 'Animale Permise', online_booking: 'Rezervare Online',
  loyalty_program: 'Program de Loialitate',
};

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ providerId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    salon_name: '', description: '', address: '', city: '', coordinates: '', location_plus_code: '', phone: '', email: '',
    website: '', working_hours: {}, facilities: [], languages: ['ro'], social_media: {},
    policies: {}, team_members: [], company_name: '', fiscal_code: '', company_type: '',
    bank_accounts: [], crypto_wallets: [],
  });
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [coordinatesError, setCoordinatesError] = useState<string>('');
  
  const [newBankAccount, setNewBankAccount] = useState<BankAccount>({ bank_name: '', iban: '', swift: '' });
  const [newCryptoWallet, setNewCryptoWallet] = useState('');

  useEffect(() => {
    fetchProviderData();
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      const { data, error } = await supabase.from('providers').select('*').eq('id', providerId).single();
      if (error) throw error;
      
      console.log("Raw provider data:", data); // Debug
      
      // Procesează coordonatele din diverse formate
      let coordinatesString = '';
      if (data.location) {
        try {
          if (typeof data.location === 'string' && data.location.startsWith('POINT(')) {
            // Format PostGIS: POINT(lng lat)
            const match = data.location.match(/POINT\(([^)]+)\)/);
            if (match) {
              const [lng, lat] = match[1].split(' ').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                coordinatesString = `${lat}, ${lng}`;
              }
            }
          } else if (typeof data.location === 'object' && data.location.coordinates) {
            // Format GeoJSON: { coordinates: [lng, lat] }
            const [lng, lat] = data.location.coordinates;
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinatesString = `${lat}, ${lng}`;
            }
          }
        } catch (error) {
          console.warn("Eroare la procesarea coordonatelor:", error);
        }
      }
      
      // Procesează payment_methods cu verificări defensive
      let bankAccounts = [];
      let cryptoWallets = [];
      if (data.payment_methods && typeof data.payment_methods === 'object') {
        bankAccounts = Array.isArray(data.payment_methods.bank_accounts) ? data.payment_methods.bank_accounts : [];
        cryptoWallets = Array.isArray(data.payment_methods.crypto_wallets) ? data.payment_methods.crypto_wallets : [];
      }
      
      // Procesează working_hours cu fallback la default
      let workingHours = getDefaultWorkingHours();
      if (data.working_hours && typeof data.working_hours === 'object') {
        workingHours = { ...getDefaultWorkingHours(), ...data.working_hours };
      }
      
      setFormData({
        salon_name: data.salon_name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        coordinates: coordinatesString,
        location_plus_code: data.location_plus_code || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        working_hours: workingHours,
        facilities: Array.isArray(data.facilities) ? data.facilities : [],
        languages: Array.isArray(data.languages) ? data.languages : ['ro'],
        social_media: data.social_media && typeof data.social_media === 'object' ? data.social_media : {},
        policies: data.policies && typeof data.policies === 'object' ? data.policies : {},
        team_members: Array.isArray(data.team_members) ? data.team_members : [],
        company_name: data.company_name || '',
        fiscal_code: data.fiscal_code || '',
        company_type: data.company_type || '',
        bank_accounts: bankAccounts,
        crypto_wallets: cryptoWallets,
      });
      
      // Setează logo_url cu verificare
      setLogoUrl(data.logo_url || '');
      
      console.log("Processed form data:", {
        salon_name: data.salon_name,
        coordinates: coordinatesString,
        bank_accounts: bankAccounts,
        crypto_wallets: cryptoWallets,
        logo_url: data.logo_url,
        working_hours: workingHours
      });
    } catch (error) {
      console.error('Failed to fetch provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { bank_accounts, crypto_wallets, coordinates, ...restOfFormData } = formData;
      
      // Process coordinates
      let processedLocation = undefined;
      if (coordinates && coordinates.trim()) {
        const coords = coordinates.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          // Convert to PostGIS POINT format: POINT(lng lat)
          processedLocation = `POINT(${coords[1]} ${coords[0]})`;
        }
      }
      
      const updatePayload = {
        ...restOfFormData,
        location: processedLocation,
        payment_methods: {
          fiat: (bank_accounts?.length || 0) > 0,
          crypto: (crypto_wallets?.length || 0) > 0,
          bank_accounts: bank_accounts,
          crypto_wallets: crypto_wallets,
        },
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('providers').update(updatePayload).eq('id', providerId);
      if (error) throw error;
      alert('Profilul a fost actualizat cu succes!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Eroare la salvarea profilului');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBankAccount = () => {
    if (newBankAccount.bank_name && newBankAccount.iban) {
      setFormData(prev => ({ ...prev, bank_accounts: [...prev.bank_accounts, newBankAccount] }));
      setNewBankAccount({ bank_name: '', iban: '', swift: '' });
    }
  };
  const handleRemoveBankAccount = (index: number) => {
    setFormData(prev => ({ ...prev, bank_accounts: prev.bank_accounts.filter((_, i) => i !== index) }));
  };
  const handleAddCryptoWallet = () => {
    if (newCryptoWallet) {
      setFormData(prev => ({ ...prev, crypto_wallets: [...prev.crypto_wallets, newCryptoWallet] }));
      setNewCryptoWallet('');
    }
  };
  const handleRemoveCryptoWallet = (index: number) => {
    setFormData(prev => ({ ...prev, crypto_wallets: prev.crypto_wallets.filter((_, i) => i !== index) }));
  };

  const getDefaultWorkingHours = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const defaultHours: Record<string, DaySchedule> = {};
    days.forEach(day => {
      defaultHours[day] = {
        open: '09:00', close: '18:00', breaks: [], closed: day === 'sunday',
      };
    });
    return defaultHours;
  };

  const handleWorkingHoursChange = (day: string, field: keyof DaySchedule, value: any) => {
    setFormData(prev => ({ ...prev, working_hours: { ...prev.working_hours, [day]: { ...prev.working_hours[day], [field]: value } } }));
  };
  const toggleFacility = (facility: string) => {
    setFormData(prev => ({ ...prev, facilities: prev.facilities.includes(facility) ? prev.facilities.filter(f => f !== facility) : [...prev.facilities, facility] }));
  };
  const toggleLanguage = (language: string) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.includes(language) ? prev.languages.filter(l => l !== language) : [...prev.languages, language] }));
  };
  const addTeamMember = () => {
    setFormData(prev => ({ ...prev, team_members: [...(prev.team_members || []), { name: '', role: '', description: '', image: '' }] }));
  };
  const updateTeamMember = (index: number, field: string, value: string) => {
    const updatedMembers = [...(formData.team_members || [])];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData({ ...formData, team_members: updatedMembers });
  };
  const removeTeamMember = (index: number) => {
    setFormData(prev => ({ ...prev, team_members: prev.team_members?.filter((_, i) => i !== index) }));
  };

  const handleCoordinatesChange = (value: string) => {
    setFormData({ ...formData, coordinates: value });
    
    // Validează coordonatele dacă câmpul nu este gol
    if (value.trim()) {
      if (!validateCoordinates(value)) {
        setCoordinatesError('Format invalid. Folosește formatul: latitudine, longitudine (ex: 44.4268, 26.1025)');
      } else {
        setCoordinatesError('');
      }
    } else {
      setCoordinatesError('');
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-32 bg-slate-200 rounded-xl"></div><div className="h-32 bg-slate-200 rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Editare Profil</h2>
        <Button onClick={handleSave} loading={saving}><Save size={18} className="mr-2" />Salvează Modificările</Button>
      </div>

      {/* Secțiunea pentru Logo cu preview îmbunătățit */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Logo Salon</h3>
        
        <div className="space-y-4">
          <ImageUploader 
            onUpload={setLogoUrl} 
            bucket="logos" 
            path={providerId} 
            previewUrl={logoUrl} 
            label="Încarcă logo" 
            className="max-w-xs"
            showPreview={true}
          />
          
          {/* NOU: Preview în timp real pentru logo */}
          {logoUrl && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Preview Logo:</h4>
              <div className="relative inline-block">
                <div className="w-12 h-12 bg-white rounded-full shadow-lg p-1 border-2 border-slate-200">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Așa va apărea în carusel</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Building size={20} />Date Companie</h3>
        <div className="space-y-4">
          <Input label="Nume Companie" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} required />
          <Input label="Cod Fiscal" value={formData.fiscal_code} onChange={e => setFormData({...formData, fiscal_code: e.target.value})} required />
          <Input label="Tip Companie" value={formData.company_type} onChange={e => setFormData({...formData, company_type: e.target.value})} placeholder="ex: SRL, PFA" required />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Building size={20} />Informații Generale Salon</h3>
         <div className="space-y-4">
          <Input label="Nume Salon" value={formData.salon_name} onChange={(e) => setFormData({ ...formData, salon_name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descriere</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" rows={4} placeholder="Descrie salonul tău..."/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} icon={<Mail size={18} />} required />
            <Input label="Telefon" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} icon={<Phone size={18} />} required />
          </div>
          <Input label="Website (opțional)" type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} icon={<Globe size={18} />} placeholder="https://example.com" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={20} />Locație</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresă</label>
            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" rows={2} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Oraș</label>
            <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" required>
              <option value="">Selectează orașul</option>
              {ROMANIA_CITIES.map(city => (<option key={city} value={city}>{city}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Coordonate GPS (opțional)</label>
            <Input 
              value={formData.coordinates || ''} 
              onChange={(e) => handleCoordinatesChange(e.target.value)} 
              placeholder="ex: 44.4268, 26.1025" 
              className="w-full"
              error={coordinatesError}
            />
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              <p className="font-medium">💡 Cum să obții coordonatele:</p>
              <ul className="space-y-1 ml-4">
                <li>• Mergi pe <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a></li>
                <li>• Caută adresa salonului tău</li>
                <li>• Click dreapta pe locația exactă și alege "Ce e aici?"</li>
                <li>• Copiază coordonatele afișate (ex: 44.4268, 26.1025)</li>
              </ul>
              <p className="text-amber-600 font-medium">
                ⚠️ Formatul corect: latitudine, longitudine (separate prin virgulă și spațiu)
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plus Code (opțional)</label>
            <div className="flex gap-2">
              <Input 
                value={formData.location_plus_code || ''} 
                onChange={(e) => setFormData({ ...formData, location_plus_code: e.target.value })} 
                placeholder="ex: M723+WM8 Milcovul" 
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (formData.address) {
                    const plusCode = await plusCodeHelpers.generatePlusCodeFromAddress(formData.address);
                    if (plusCode) {
                      setFormData({ ...formData, location_plus_code: plusCode });
                    }
                  }
                }}
              >
                Generează
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Introdu Plus Code (ex: M723+WM8 Milcovul) sau folosește butonul pentru a genera din adresă
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Clock size={20} />Program de Lucru</h3>
        
        <div className="space-y-4">
          {Object.entries(formData.working_hours).map(([day, schedule]) => {
            const dayLabels: Record<string, string> = {
              monday: 'Luni',
              tuesday: 'Marți', 
              wednesday: 'Miercuri',
              thursday: 'Joi',
              friday: 'Vineri',
              saturday: 'Sâmbătă',
              sunday: 'Duminică'
            };

            return (
              <div key={day} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-800">{dayLabels[day]}</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!schedule.closed}
                      onChange={(e) => handleWorkingHoursChange(day, 'closed', !e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">Deschis</span>
                  </label>
                </div>

                {!schedule.closed && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ora deschidere</label>
                        <input
                          type="time"
                          value={schedule.open || '09:00'}
                          onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ora închidere</label>
                        <input
                          type="time"
                          value={schedule.close || '18:00'}
                          onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Pauze */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-700">Pauze</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newBreaks = [...(schedule.breaks || []), { start: '12:00', end: '13:00' }];
                            handleWorkingHoursChange(day, 'breaks', newBreaks);
                          }}
                          className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600"
                        >
                          + Adaugă pauză
                        </button>
                      </div>
                      
                      {schedule.breaks && schedule.breaks.length > 0 && (
                        <div className="space-y-2">
                          {schedule.breaks.map((breakTime, index) => (
                            <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                              <input
                                type="time"
                                value={breakTime.start}
                                onChange={(e) => {
                                  const newBreaks = [...schedule.breaks];
                                  newBreaks[index] = { ...newBreaks[index], start: e.target.value };
                                  handleWorkingHoursChange(day, 'breaks', newBreaks);
                                }}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                              />
                              <span className="text-slate-500 text-sm">-</span>
                              <input
                                type="time"
                                value={breakTime.end}
                                onChange={(e) => {
                                  const newBreaks = [...schedule.breaks];
                                  newBreaks[index] = { ...newBreaks[index], end: e.target.value };
                                  handleWorkingHoursChange(day, 'breaks', newBreaks);
                                }}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newBreaks = schedule.breaks.filter((_, i) => i !== index);
                                  handleWorkingHoursChange(day, 'breaks', newBreaks);
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Date Financiare</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3"><CreditCard className="text-amber-600" size={20} /><h4 className="font-medium text-slate-800">Date Bancare</h4></div>
            {formData.bank_accounts?.map((account, index) => (<div key={index} className="bg-slate-50 p-3 rounded-lg mb-2 flex items-center justify-between"><div><p className="font-medium">{account.bank_name}</p><p className="text-sm text-slate-600">{account.iban}</p></div><button type="button" onClick={() => handleRemoveBankAccount(index)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} className="text-red-600" /></button></div>))}
            <div className="space-y-2 border-t pt-4 mt-4"><Input label="Nume Bancă" value={newBankAccount.bank_name} onChange={e => setNewBankAccount({ ...newBankAccount, bank_name: e.target.value })} /><Input label="IBAN" value={newBankAccount.iban} onChange={e => setNewBankAccount({ ...newBankAccount, iban: e.target.value })} /><Input label="SWIFT (opțional)" value={newBankAccount.swift} onChange={e => setNewBankAccount({ ...newBankAccount, swift: e.target.value })} /><Button type="button" variant="outline" onClick={handleAddBankAccount} className="w-full"><Plus size={16} className="mr-2" />Adaugă Cont Bancar</Button></div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3"><Bitcoin className="text-amber-600" size={20} /><h4 className="font-medium text-slate-800">Wallet Crypto</h4></div>
            {formData.crypto_wallets?.map((wallet, index) => (<div key={index} className="bg-slate-50 p-3 rounded-lg mb-2 flex items-center justify-between"><p className="text-sm font-mono truncate">{wallet}</p><button type="button" onClick={() => handleRemoveCryptoWallet(index)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} className="text-red-600" /></button></div>))}
            <div className="space-y-2 border-t pt-4 mt-4"><Input label="Adresă Wallet" value={newCryptoWallet} onChange={e => setNewCryptoWallet(e.target.value)} placeholder="ex: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" /><Button type="button" variant="outline" onClick={handleAddCryptoWallet} className="w-full"><Plus size={16} className="mr-2" />Adaugă Wallet Crypto</Button></div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg"><Save size={20} className="mr-2" />Salvează Toate Modificările</Button>
      </div>
    </div>
  );
};