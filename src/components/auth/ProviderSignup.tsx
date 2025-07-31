import React, { useState } from 'react';
import { Building, MapPin, CreditCard, Bitcoin, Plus, X, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUploader } from '../shared/ImageUploader';
import { useApp } from '../../contexts/AppContext';
import { ProviderSignupData, BankAccount } from '../../types';

interface ProviderSignupProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ProviderSignup: React.FC<ProviderSignupProps> = ({ onBack, onSuccess }) => {
  const { createProviderProfile, user } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<Omit<ProviderSignupData, 'email' | 'password' | 'name' | 'phone'>>({
    company_name: '',
    fiscal_code: '',
    company_type: '',
    salon_name: '',
    address: '',
    city: '',
    country: 'România',
    coordinates: '',
    bank_accounts: [],
    crypto_wallets: [],
    salon_type: 'unisex',
  });

  // NOU: Stare pentru imagini și logo
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('');

  const [newBankAccount, setNewBankAccount] = useState<BankAccount>({ bank_name: '', iban: '', swift: '' });
  const [newCryptoWallet, setNewCryptoWallet] = useState('');

  const handleAddBankAccount = () => { 
    if (newBankAccount.bank_name && newBankAccount.iban) { 
      setFormData(prev => ({ ...prev, bank_accounts: [...(prev.bank_accounts || []), newBankAccount] })); 
      setNewBankAccount({ bank_name: '', iban: '', swift: '' }); 
    } 
  };
  
  const handleRemoveBankAccount = (index: number) => { 
    setFormData(prev => ({ ...prev, bank_accounts: prev.bank_accounts?.filter((_, i) => i !== index) })); 
  };
  
  const handleAddCryptoWallet = () => { 
    if (newCryptoWallet) { 
      setFormData(prev => ({ ...prev, crypto_wallets: [...(prev.crypto_wallets || []), newCryptoWallet] })); 
      setNewCryptoWallet(''); 
    } 
  };
  
  const handleRemoveCryptoWallet = (index: number) => { 
    setFormData(prev => ({ ...prev, crypto_wallets: prev.crypto_wallets?.filter((_, i) => i !== index) })); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("DEBUG: handleSubmit apelat!");
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Combinăm datele cu imaginile și logo-ul
      const submitData = {
        ...formData,
        featured_image: featuredImage,
        images: galleryImages,
        logo_url: logoUrl, // NOU: Adăugăm logo-ul
      };
      
      console.log("DEBUG: Datele pentru submit:", submitData);
      await createProviderProfile(submitData);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Eroare la crearea profilului');
      console.error('Eroare la crearea profilului de provider:', err);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    const valid = (() => {
      switch (step) {
        case 1: return !!formData.company_name && !!formData.fiscal_code && !!formData.company_type;
        case 2: return true;
        case 3: return !!formData.salon_name && !!formData.address && !!formData.city;
        case 4: return true; // Pasul cu imagini este opțional, deci valid
        default: return true;
      }
    })();
    
    console.log(`DEBUG: Pasul ${step} valid: ${valid}`);
    console.log(`DEBUG: Date pasul ${step}:`, {
      company_name: formData.company_name,
      fiscal_code: formData.fiscal_code,
      company_type: formData.company_type,
      salon_name: formData.salon_name,
      address: formData.address,
      city: formData.city
    });
    
    return valid;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-slide-up">
          <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Profil Creat cu Succes!</h2>
          <p className="text-slate-600 mb-6">
            Profilul tău de furnizor a fost creat. Te redirecționăm către dashboard...
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 animate-[slideRight_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Completează Profilul de Furnizor</h1>
            <p className="text-sm text-slate-600">Pasul {step} din 4</p>
          </div>
        </div>
      </div>
      <div className="bg-white px-4 py-2">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-amber-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600">{error}</p></div>}
        <form onSubmit={(e) => {
          console.log("DEBUG: Form onSubmit apelat!");
          e.preventDefault();
          // Prevenim complet trimiterea formularului la pasul 4
          if (step === 4) {
            console.log("DEBUG: Suntem la pasul 4, nu trimitem formularul automat");
            return false;
          }
        }} className="bg-white rounded-2xl shadow-lg p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Building className="text-amber-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800">Date Companie</h2>
              </div>
              <Input label="Nume Companie" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} required />
              <Input label="Cod Fiscal" value={formData.fiscal_code} onChange={e => setFormData({...formData, fiscal_code: e.target.value})} required />
              <Input label="Tip Companie" value={formData.company_type} onChange={e => setFormData({...formData, company_type: e.target.value})} placeholder="ex: SRL, PFA" required />
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Date de Contact</h2>
              <p className="text-sm text-slate-600 -mt-4">Aceste date sunt preluate din contul tău și nu pot fi modificate aici.</p>
              <Input label="Nume Reprezentant" value={user?.name || ''} readOnly disabled />
              <Input label="Telefon" value={user?.phone || ''} readOnly disabled />
              <Input label="E-mail" value={user?.email || ''} readOnly disabled />
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="text-amber-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800">Date Salon</h2>
              </div>
              <Input label="Nume Salon" value={formData.salon_name} onChange={e => setFormData({...formData, salon_name: e.target.value})} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipul Salonului</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['women', 'men', 'unisex'] as const).map(type => (
                    <button 
                      key={type} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, salon_type: type })} 
                      className={`p-3 rounded-lg border-2 font-medium ${
                        formData.salon_type === type 
                          ? 'border-amber-600 bg-amber-50 text-amber-700' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {type === 'women' ? 'Femei' : type === 'men' ? 'Bărbați' : 'Unisex'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresă</label>
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" 
                  rows={3} 
                  required 
                />
              </div>
              <Input label="Oraș" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required />
              <Input label="Țară" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required />
              <Input label="Coordonate GPS (opțional)" value={formData.coordinates} onChange={e => setFormData({ ...formData, coordinates: e.target.value })} placeholder="ex: 44.4268, 26.1025" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="text-amber-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800">Imagini Salon</h2>
              </div>
              
              <div className="space-y-6">
                {/* NOU: Secțiune pentru Logo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Logo Salon (opțional)
                  </label>
                  <p className="text-sm text-slate-600 mb-4">
                    Logo-ul va apărea în colțul din stânga sus al imaginii principale în carusel.
                  </p>
                  <ImageUploader 
                    onUpload={setLogoUrl} 
                    bucket="logos" 
                    path={`${user?.id}/logo`} 
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagine Principală (opțional)
                  </label>
                  <p className="text-sm text-slate-600 mb-4">
                    Aceasta va fi afișată în carusel și va fi prima imagine pe care o vor vedea clienții.
                  </p>
                  <ImageUploader 
                    onUpload={setFeaturedImage} 
                    bucket="providers" 
                    path={`${user?.id}/featured`} 
                    previewUrl={featuredImage}
                    label="Încarcă imagine principală"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Galerie Imagini (opțional)
                  </label>
                  <p className="text-sm text-slate-600 mb-4">
                    Adaugă mai multe imagini cu salonul tău pentru a atrage mai mulți clienți.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Imagine ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {galleryImages.length < 6 && (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            // Aici ar trebui să deschizi un uploader pentru galerie
                            // Pentru moment, vom folosi un input simplu
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                // Aici ar trebui să încarci imaginea și să obții URL-ul
                                // Pentru moment, vom simula
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setGalleryImages(prev => [...prev, e.target?.result as string]);
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <Plus size={24} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="text-amber-600" size={20} />
                  <h3 className="font-semibold text-slate-800">Conturi Bancare</h3>
                </div>
                {formData.bank_accounts?.map((account, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{account.bank_name}</p>
                      <p className="text-xs text-slate-600 font-mono">{account.iban}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveBankAccount(index)} className="p-1 hover:bg-red-100 rounded-full">
                      <X size={16} className="text-red-600" />
                    </button>
                  </div>
                ))}
                <div className="space-y-2">
                  <Input label="Nume Bancă" value={newBankAccount.bank_name} onChange={e => setNewBankAccount({...newBankAccount, bank_name: e.target.value})} />
                  <Input label="IBAN" value={newBankAccount.iban} onChange={e => setNewBankAccount({...newBankAccount, iban: e.target.value})} />
                  <Input label="SWIFT (opțional)" value={newBankAccount.swift} onChange={e => setNewBankAccount({...newBankAccount, swift: e.target.value})} />
                  <Button type="button" variant="outline" onClick={handleAddBankAccount} className="w-full">
                    <Plus size={16} className="mr-2" />Adaugă Cont Bancar
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bitcoin className="text-amber-600" size={20} />
                  <h3 className="font-semibold text-slate-800">Wallet Crypto</h3>
                </div>
                {formData.crypto_wallets?.map((wallet, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg mb-2 flex items-center justify-between">
                    <p className="text-sm font-mono">{wallet}</p>
                    <button type="button" onClick={() => handleRemoveCryptoWallet(index)} className="p-1 hover:bg-red-100 rounded-full">
                      <X size={16} className="text-red-600" />
                    </button>
                  </div>
                ))}
                <div className="space-y-2">
                  <Input label="Adresă Wallet" value={newCryptoWallet} onChange={e => setNewCryptoWallet(e.target.value)} placeholder="ex: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" />
                  <Button type="button" variant="outline" onClick={handleAddCryptoWallet} className="w-full">
                    <Plus size={16} className="mr-2" />Adaugă Wallet Crypto
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-8">
            {step > 1 && <Button type="button" variant="ghost" onClick={() => {
              console.log(`DEBUG: Navigare înapoi de la pasul ${step} la ${step - 1}`);
              setStep(step - 1);
            }} className="flex-1">Înapoi</Button>}
            {step < 4 ? <Button type="button" onClick={() => {
              console.log(`DEBUG: Navigare înainte de la pasul ${step} la ${step + 1}`);
              setStep(step + 1);
            }} disabled={!isStepValid()} className="flex-1">Următorul</Button> : <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(e); }} variant="success" loading={loading} className="flex-1">Finalizează Profilul</Button>}
          </div>
        </form>
      </div>
    </div>
  );
};
