// PermissionPrimer — explain the ask before the OS asks (M4).
//
// The app currently calls CapacitorCamera.getPhoto() cold: the Android dialog
// appears with no context, and a denial dead-ends at "Camera access denied or
// operation cancelled" with the user dumped back to the choice screen. On
// Android a second denial is permanent, so a cold ask that gets refused can
// lock a user out of the app's only real feature for good.
//
// A primer costs one tap and buys three things: the user knows WHY, the app
// gets to state what happens to the photo, and "Not now" becomes a soft exit
// that does NOT burn the OS-level ask.

import React from 'react';
import { IonIcon } from '@ionic/react';
import { cameraOutline, imagesOutline, sunnyOutline } from 'ionicons/icons';
import { BottomSheet } from '@/components/ui/BottomSheet';

export type PermissionKind = 'camera' | 'photos';

interface PermissionPrimerProps {
  isOpen: boolean;
  kind: PermissionKind;
  onClose: () => void;
  /** Proceed to the real OS permission dialog. */
  onContinue: () => void;
}

const COPY: Record<PermissionKind, { icon: string; title: string; body: string; cta: string }> = {
  camera: {
    icon: cameraOutline,
    title: 'Take a photo',
    // Accurate, not reassuring-but-false: the photo IS uploaded — it has to be,
    // that is where the styling happens. Say so plainly.
    body: 'Hair Studio needs your camera to put a style on your own face. Your photo is uploaded only to create your look.',
    cta: 'Allow camera',
  },
  photos: {
    icon: imagesOutline,
    title: 'Choose a photo',
    body: 'Pick one photo to try styles on. Hair Studio only receives the photo you choose — it never browses your library.',
    cta: 'Choose photo',
  },
};

export const PermissionPrimer: React.FC<PermissionPrimerProps> = ({
  isOpen,
  kind,
  onClose,
  onContinue,
}) => {
  const copy = COPY[kind];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} breakpoints={[0, 0.55]} initialBreakpoint={0.55}>
      <div className="px-1 pb-2 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface ring-1 ring-hairline">
          <IonIcon icon={copy.icon} style={{ fontSize: 26 }} className="text-brass" />
        </div>

        <h2 className="mt-5 font-display text-[24px] leading-tight text-ink">{copy.title}</h2>

        <p className="mx-auto mt-3 max-w-[20rem] text-[14px] leading-relaxed text-ink-2">
          {copy.body}
        </p>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-ink-3">
          {/* Not a padlock: this line is a framing tip, and a lock next to it
              reads as a privacy claim it does not make. */}
          <IonIcon icon={sunnyOutline} style={{ fontSize: 13 }} />
          Best results with a clear, front-facing photo
        </p>

        <button
          onClick={onContinue}
          className="mt-7 h-[52px] w-full rounded-full bg-brass text-[15px] font-semibold text-white active:scale-[0.99]"
        >
          {copy.cta}
        </button>

        {/* A soft exit. Dismissing here does NOT spend the one-shot OS ask, which
            on Android is what makes a refusal permanent. */}
        <button
          onClick={onClose}
          className="mt-2 h-11 w-full text-[14px] text-ink-3"
        >
          Not now
        </button>
      </div>
    </BottomSheet>
  );
};

export default PermissionPrimer;
