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

const BEFORE =
  'https://res.cloudinary.com/djpcokxvn/image/upload/v1786138746/Hairstyles/bold_full_afro_with_vibrant_red_backdrop.jpg';
const AFTER =
  'https://res.cloudinary.com/djpcokxvn/image/upload/v1786138750/Hairstyles/purple_tinted_freeform_locs_with_studio_intensity.jpg';

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
      generationStatus={{ generatedImageUrl: AFTER }}
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
