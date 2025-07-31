import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '../../lib/utils';

interface WelcomeProps {
  onAccept: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onAccept }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-12">
          <div className="mb-8">
            <img 
              src="/logo.png" 
              alt="doo mee" 
              className="h-16 mx-auto mb-4 object-contain"
            />
            <p className="text-slate-600 text-lg font-medium">
              Rezervările la frizerie, simplificate
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 animate-slide-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Bun venit!
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Găsește și rezervă rapid la frizeriile din zona ta. 
                Experiență premium pentru stilul tău perfect.
              </p>
            </div>

            <div className="mb-8">
              <Checkbox
                id="terms-checkbox"
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                label={
                  <span>
                    Sunt de acord cu{' '}
                    <button className="text-amber-600 hover:text-amber-700 font-medium underline transition-colors">
                      Termenii și Condițiile
                    </button>{' '}
                    și{' '}
                    <button className="text-amber-600 hover:text-amber-700 font-medium underline transition-colors">
                      Politica de Confidențialitate
                    </button>
                  </span>
                }
              />
            </div>

            <Button
              onClick={onAccept}
              disabled={!acceptedTerms}
              className={cn(
                "w-full py-4 text-lg font-semibold transition-all duration-300 transform",
                acceptedTerms 
                  ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 hover:scale-105" 
                  : "bg-slate-300 cursor-not-allowed"
              )}
              size="lg"
            >
              Accept și Accesează
            </Button>
          </div>

          <p className="text-slate-500 text-sm mt-6">
            Începe să descoperi frizeriile din zona ta
          </p>
        </div>
      </div>
    </div>
  );
};
