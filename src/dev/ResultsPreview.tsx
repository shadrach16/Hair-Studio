// DEV-only harness for the results screen.
//
// Two things make this worth having rather than testing on a real generation:
// visual work moved to the browser (no device), and generation is down
// app-wide while Gemini prepaid billing is depleted — so there is currently no
// way to reach `studioState === 'results'` by using the app.
//
// Mounted from Index.tsx behind `import.meta.env.DEV && ?preview=results`, so
// it is dead-stripped from production bundles.
//
//   npm run dev  ->  http://localhost:5173/?preview=results

import React, { useEffect, useState } from 'react';
import ResultsViewer from '@/components/ResultsViewer';
import { PREVIEW_PARAMS } from '@/dev/previewFlag';
import ConfirmGenerateScreen from '@/components/ConfirmGenerateScreen';
import { ProcessingState } from '@/components/studio/ProcessingState';
import { PermissionPrimer } from '@/components/ui/PermissionPrimer';
import CameraUpload from '@/components/CameraUpload';

const BEFORE =
  'https://res.cloudinary.com/djpcokxvn/image/upload/v1786138746/Hairstyles/bold_full_afro_with_vibrant_red_backdrop.jpg';
const AFTER =
  'https://res.cloudinary.com/djpcokxvn/image/upload/v1786138750/Hairstyles/purple_tinted_freeform_locs_with_studio_intensity.jpg';

/** Shared fixture: the "before" arrives as a File (it comes from the camera). */
function useFixturePhoto(): File | null {
  const [photo, setPhoto] = useState<File | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(BEFORE)
      .then((r) => r.blob())
      .then((b) => alive && setPhoto(new File([b], 'before.jpg', { type: 'image/jpeg' })))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return photo;
}

/** ?preview=confirm — the tier picker, where the quality names are shown. */
export const ConfirmPreview: React.FC = () => {
  const photo = useFixturePhoto();
  if (!photo) return null;
  return (
    <ConfirmGenerateScreen
      selectedPhoto={photo}
      selectedHairstyle={{ name: 'Purple-Tinted Freeform Locs', thumbnail: AFTER } as any}
      userCredits={PREVIEW_PARAMS.has('credits') ? Number(PREVIEW_PARAMS.get('credits')) : 6}
      isPro={PREVIEW_PARAMS.has('pro')}
      isAuthenticated={!PREVIEW_PARAMS.has('guest')}
      onGenerate={() => {}}
      onBack={() => {}}
      onBuyCredits={() => {}}
    />
  );
};

/** ?preview=photo — the "Add your photo" screen with a style selected. */
export const PhotoPreview: React.FC = () => (
  <div className="mx-auto w-full max-w-md px-4 py-4">
    <CameraUpload
      mode="camera"
      onPhotoSelect={() => {}}
      onClearPhoto={() => {}}
      selectedPhoto={null}
      selectedHairstyle={{ name: 'Purple-Tinted Freeform Locs', thumbnail: AFTER } as any}
      onStyleSelect={() => {}}
      onBack={() => {}}
    />
  </div>
);

/** ?preview=primer[&kind=photos] — the permission sheet is native-gated, so it
 *  never appears in a browser without this. */
export const PrimerPreview: React.FC = () => (
  <PermissionPrimer
    isOpen
    kind={(PREVIEW_PARAMS.get('kind') as any) || 'camera'}
    onClose={() => {}}
    onContinue={() => {}}
  />
);

/** ?preview=processing — the wait screen. ?progress=N pins the hairline. */
export const ProcessingPreview: React.FC = () => {
  const photo = useFixturePhoto();
  if (!photo) return null;
  return (
    <ProcessingState
      selectedPhoto={photo}
      selectedHairstyle={{ name: 'Purple-Tinted Freeform Locs', id: 'preview' }}
      progress={PREVIEW_PARAMS.has('progress') ? Number(PREVIEW_PARAMS.get('progress')) : 45}
    />
  );
};

export const ResultsPreview: React.FC = () => {
  const [photo, setPhoto] = useState<File | null>(null);

  // ResultsViewer takes the "before" as a File (it comes from the camera), so
  // the fixture has to round-trip through a Blob.
  useEffect(() => {
    let alive = true;
    fetch(BEFORE)
      .then((r) => r.blob())
      .then((b) => alive && setPhoto(new File([b], 'before.jpg', { type: 'image/jpeg' })))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const params = PREVIEW_PARAMS;

  return (
    <ResultsViewer
      selectedPhoto={photo}
      selectedHairstyle={{ name: 'Purple-Tinted Freeform Locs' }}
      generationStatus={{
        generatedImageUrl: AFTER,
        // ?identity=N exercises the likeness line either side of its threshold.
        identityScore: PREVIEW_PARAMS.has('identity')
          ? Number(PREVIEW_PARAMS.get('identity'))
          : 92,
      }}
      generationId="preview"
      referralCode="PREVIEW"
      // ?guest / ?pro / ?credits=N exercise the contextual nudges, which are
      // mutually exclusive and easy to get wrong.
      isGuest={params.has('guest')}
      isPro={params.has('pro')}
      availableCredits={params.has('credits') ? Number(params.get('credits')) : 5}
      onTryAnother={() => {}}
      onRetrySameStyle={() => {}}
      onShowPricing={() => {}}
      onShowAuth={() => {}}
    />
  );
};

export default ResultsPreview;
