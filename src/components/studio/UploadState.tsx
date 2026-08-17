import React from 'react';
import CameraUpload from '@/components/CameraUpload';
import { IonIcon } from '@ionic/react';
import { giftOutline } from 'ionicons/icons';
import GoogleSignInButton from '@/components/GoogleSignInButton';

type UploadMode = 'camera' | 'library';

interface UploadStateProps {
  uploadMode: UploadMode;
  selectedPhoto: File | null;
  isAuthenticated: boolean;
  selectedHairstyle?: any;
  onPhotoSelect: (file: File, mimeType: string) => void;
  onClearPhoto: () => void;
  onStyleSelect?: (hairstyle: any) => void;
  onBack?: () => void;
}

export const UploadState: React.FC<UploadStateProps> = ({
  uploadMode,
  selectedPhoto,
  isAuthenticated,
  selectedHairstyle,
  onPhotoSelect,
  onClearPhoto,
  onStyleSelect,
  onBack,
}) => (
  <div className="flex-1 flex items-start justify-center px-1 py-4 overflow-y-auto">
    <div className="w-full max-w-md">
      <CameraUpload
        mode={uploadMode}
        onPhotoSelect={onPhotoSelect}
        onClearPhoto={onClearPhoto}
        selectedPhoto={selectedPhoto}
        selectedHairstyle={selectedHairstyle}
        onStyleSelect={onStyleSelect}
        onBack={onBack}
      />
      {!isAuthenticated && !selectedPhoto && (
        <div className="mt-5 mx-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm">
          {/* Was a gift emoji doing an icon's job, which the design system rules
              out, next to "5 free credits" — the currency the rest of the app no
              longer speaks, and a number that did not even match the 10-credit
              signup grant on the User model. No number is better than a wrong
              one, and this is the first money a new user ever sees. */}
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
            <IonIcon icon={giftOutline} style={{ fontSize: 16 }} className="text-brass" />
          </div>
          <p className="text-[12px] text-gray-400 flex-1">
            <span className="font-medium text-gray-600">Free looks</span> when you sign up
          </p>
          <GoogleSignInButton
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[11px] rounded-lg border-gray-200 flex-shrink-0"
          >
            Sign up
          </GoogleSignInButton>
        </div>
      )}
    </div>
  </div>
);