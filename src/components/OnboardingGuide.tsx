// @file: OnboardingGuide.tsx
// Clean, native-feeling onboarding with smooth transitions

import React, { useState, useCallback, useEffect } from 'react';
import {
  Camera,
  ArrowRight,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { apiService } from '@/lib/api';

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (skipped: boolean) => void;
}

const ONBOARDING_VERSION = 3;

const triggerHaptic = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch (e) {}
};

const slides = [
  {
    id: 'photo',
    emoji: '📸',
    title: 'Snap or upload\nyour photo',
    description: 'A quick selfie is all you need. Good lighting gives the best AI results.',
    gradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
    accentColor: 'bg-sky-500',
  },
  {
    id: 'style',
    emoji: '💇',
    title: 'Choose any\nhairstyle',
    description: 'Browse hundreds of curated styles — braids, locs, fades, wigs and more.',
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    accentColor: 'bg-amber-500',
  },
  {
    id: 'result',
    emoji: '🪞',
    title: 'See it on you\nin seconds',
    description: 'AI transforms your look instantly. Save it, share it, or show your stylist.',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    accentColor: 'bg-emerald-500',
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ 
  isOpen, 
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      apiService.trackEvent('onboarding_started', { version: ONBOARDING_VERSION });
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    triggerHaptic();
    if (step < slides.length - 1) {
      const next = step + 1;
      setStep(next);
      apiService.trackEvent('onboarding_step_viewed', {
        step: next,
        stepId: slides[next].id,
        version: ONBOARDING_VERSION,
      });
    } else {
      apiService.trackEvent('onboarding_completed', {
        version: ONBOARDING_VERSION,
        stepsViewed: slides.length,
      });
      onComplete?.(false);
      onClose();
    }
  }, [step, onClose, onComplete]);

  const handleSkip = useCallback(() => {
    triggerHaptic();
    apiService.trackEvent('onboarding_skipped', {
      version: ONBOARDING_VERSION,
      skippedAtStep: step,
      stepId: slides[step].id,
    });
    onComplete?.(true);
    onClose();
  }, [onClose, onComplete, step]);

  if (!isOpen) return null;

  const isLast = step === slides.length - 1;
  const current = slides[step];

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden">
      {/* Ambient gradient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + '-bg'}
          className={`absolute inset-0 bg-gradient-to-b ${current.gradient}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* Header: Logo + Skip */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(16px,calc(var(--safe-area-top,0px)+12px))] pb-2">
        <div className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/djpcokxvn/image/upload/v1777118970/HairStudio/app_logo_premium.png"
            alt="Hair Studio"
            className="w-8 h-8 rounded-full ring-1 ring-black/[0.06]"
          />
          <span className="text-[14px] font-bold text-gray-900 tracking-tight">Hair Studio</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-[13px] font-semibold text-gray-400 active:text-gray-600 transition-colors py-1.5 px-3 rounded-full active:bg-gray-100"
        >
          Skip
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="flex flex-col items-center w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Large emoji */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <span className="text-[72px] leading-none block">{current.emoji}</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-[32px] font-bold text-gray-900 text-center tracking-tight leading-[1.15] whitespace-pre-line mb-3">
              {current.title}
            </h1>

            {/* Description */}
            <p className="text-[15px] leading-relaxed text-gray-400 text-center max-w-[280px]">
              {current.description}
            </p>

            {/* Step indicator chips */}
            <div className="flex items-center gap-3 mt-8">
              {slides.map((s, i) => (
                <motion.button
                  key={s.id}
                  onClick={() => { triggerHaptic(); setStep(i); }}
                  className={`flex items-center gap-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'h-8 px-3.5 bg-gray-900 shadow-sm'
                      : 'h-8 w-8 bg-gray-100 active:bg-gray-200'
                  }`}
                  layout
                  aria-label={`Step ${i + 1}`}
                >
                  {i === step ? (
                    <>
                      <span className="text-[11px] font-bold text-white">{i + 1}/{slides.length}</span>
                    </>
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full mx-auto ${
                      i < step ? 'bg-gray-400' : 'bg-gray-300'
                    }`} />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 px-6 pb-[max(28px,calc(28px+var(--safe-area-bottom,0px)))]">
        <motion.button
          onClick={handleNext}
          className="w-full h-[54px] rounded-2xl bg-[#1a1a1a] active:scale-[0.98] text-white font-semibold text-[15px] transition-transform flex items-center justify-center gap-2 shadow-sm"
          whileTap={{ scale: 0.98 }}
        >
          {isLast ? (
            <>
              Get Started
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingGuide;
