import React from 'react';
import GoogleSignInButton from './GoogleSignInButton';
import { Crown, X, Wand2, Gift, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  showProBenefits?: boolean;
  /** 'default' = generic sign-in, 'credits' = "5 free credits" welcome sheet */
  variant?: 'default' | 'credits';
  /** Optional hairstyle thumbnail shown in credits variant */
  hairstyleThumbnail?: string;
  hairstyleName?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title,
  description,
  showProBenefits = false,
  variant = 'default',
  hairstyleThumbnail,
  hairstyleName,
}: AuthModalProps) {
  
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  React.useEffect(()=>{
    // Preserve the current studio state so we redirect back here after sign-in
    const currentStatus = new URLSearchParams(window.location.search).get('studio_status') || 'discover';
    localStorage.setItem("studio_status", currentStatus);
  },[])

  const resolvedTitle = title || (variant === 'credits' ? 'Start with free looks' : 'Sign in to continue');
  const resolvedDescription = description || (variant === 'credits' 
    ? 'Create a free account to unlock all hairstyles and start trying them on.' 
    : 'Sign in to choose any hairstyles');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md sm:mx-4"
          >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-9 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="px-6 pt-4 pb-8 sm:px-8 sm:pt-6 sm:pb-10">

                {variant === 'credits' ? (
                  <>
                    {/* Credits variant — visually rich */}
                    <div className="flex flex-col items-center text-center">
                      {/* Hairstyle preview or gift icon */}
                      {hairstyleThumbnail ? (
                        <div className="relative mb-5">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-sm">
                            <img src={hairstyleThumbnail} alt={hairstyleName || ''} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-sm">
                            <Wand2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                          <Gift className="w-7 h-7 text-gray-300" />
                        </div>
                      )}

                      <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">{resolvedTitle}</h2>
                      <p className="text-[13px] text-gray-400 mt-1.5 max-w-[260px] leading-relaxed">{resolvedDescription}</p>

                      {/* Credits badge */}
                      <div className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 ring-1 ring-black/[0.04]">
                        <Coins className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">Free looks</span>
                        <span className="text-[11px] text-gray-400">on sign up</span>
                      </div>

                      {/* Benefits mini-list */}
                      <div className="mt-5 w-full grid grid-cols-2 gap-2">
                        {[
                          { emoji: '💇', text: 'Hairstyle try-on' },
                          { emoji: '📸', text: 'HD quality results' },
                          { emoji: '💾', text: 'Save your looks' },
                          { emoji: '🔓', text: 'Unlock all styles' },
                        ].map((b) => (
                          <div key={b.text} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50/80">
                            <span className="text-xs">{b.emoji}</span>
                            <span className="text-[11px] font-medium text-gray-600">{b.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sign in button */}
                    <div className="mt-6">
                      <GoogleSignInButton 
                        onSuccess={handleSuccess}
                        className="w-full h-12 text-[14px] font-semibold rounded-2xl"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Default variant */}
                    <div className="text-center mb-7">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7" viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
                          <path d="M9.827,24 C9.827,22.476 10.08,21.014 10.532,19.644 L2.623,13.604 C1.082,16.734 0.214,20.26 0.214,24 C0.214,27.737 1.081,31.261 2.62,34.388 L10.525,28.337 C10.077,26.973 9.827,25.517 9.827,24" fill="#FBBC05"/>
                          <path d="M23.714,10.133 C27.025,10.133 30.016,11.307 32.366,13.227 L39.202,6.4 C35.036,2.773 29.695,0.533 23.714,0.533 C14.427,0.533 6.445,5.844 2.623,13.604 L10.532,19.644 C12.355,14.112 17.549,10.133 23.714,10.133" fill="#EB4335"/>
                          <path d="M23.714,37.867 C17.549,37.867 12.355,33.888 10.532,28.356 L2.623,34.395 C6.445,42.156 14.427,47.467 23.714,47.467 C29.445,47.467 34.918,45.431 39.025,41.618 L31.518,35.814 C29.4,37.149 26.732,37.867 23.714,37.867" fill="#34A853"/>
                          <path d="M46.145,24 C46.145,22.613 45.932,21.12 45.611,19.733 L23.714,19.733 L23.714,28.8 L36.318,28.8 C35.688,31.891 33.972,34.268 31.518,35.814 L39.025,41.618 C43.339,37.614 46.145,31.649 46.145,24" fill="#4285F4"/>
                        </svg>
                      </div>
                      <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">{resolvedTitle}</h2>
                      <p className="text-[14px] text-gray-400 mt-1.5 max-w-[260px] mx-auto leading-relaxed">{resolvedDescription}</p>
                    </div>

                    {/* Pro benefits */}
                    {showProBenefits && (
                      <div className="mb-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-black/[0.04]">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50">
                            <Crown className="w-3.5 h-3.5 text-purple-500" />
                          </span>
                          <span className="text-[13px] font-semibold text-gray-800">Pro Benefits</span>
                        </div>
                        <ul className="space-y-2 text-[13px] text-gray-500">
                          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> Unlimited hairstyle generations</li>
                          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> HD quality exports without watermarks</li>
                          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> Priority processing & support</li>
                          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /> Access to premium hairstyles</li>
                        </ul>
                      </div>
                    )}

                    {/* Sign in button */}
                    <GoogleSignInButton 
                      onSuccess={handleSuccess}
                      className="w-full h-12 text-[14px] font-semibold rounded-2xl"
                    />
                  </>
                )}
                
                {/* Legal */}
                <p className="text-[11px] text-gray-300 text-center mt-5 leading-relaxed">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-gray-400 underline decoration-gray-200 underline-offset-2">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-gray-400 underline decoration-gray-200 underline-offset-2">Privacy Policy</a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}