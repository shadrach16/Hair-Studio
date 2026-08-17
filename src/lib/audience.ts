// audience.ts — who the feed is showing styles for.
//
// The brief was "a woman shouldn't be seeing men's hairstyles". The obvious
// implementation is an onboarding question, and it is the wrong one:
//
//   - It puts a form in front of the first result, and the whole point of the
//     zero-screen onboarding is that nothing stands between opening the app and
//     seeing a style on your own face.
//   - A binary question excludes people it shouldn't, and a third option in an
//     onboarding gate is worse UX than not asking.
//   - It is wrong often. People browse styles for a partner, a client, a child.
//     A permanent answer to a temporary question is a bad trade.
//
// So it is a preference, not a gate: default to everything, one tap to narrow,
// remembered, changeable at any moment from the surface it affects. That gets
// the same outcome for the person who wants it without charging everyone else
// an onboarding screen for it.

export type Audience = 'all' | 'female' | 'male';

const KEY = 'hairstudio_audience';

// "Everyone" rather than "All": the category row directly below also opens with
// "All", and Walk 1 watched a skimming reader hit "All ... All" on two unlabelled
// rows with no way to tell them apart. Different words cost nothing and remove
// the ambiguity without adding chrome.
export const AUDIENCE_OPTIONS: Array<{ id: Audience; label: string }> = [
  { id: 'all', label: 'Everyone' },
  { id: 'female', label: 'Women' },
  { id: 'male', label: 'Men' },
];

export function getAudience(): Audience {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'female' || v === 'male' ? v : 'all';
  } catch {
    return 'all';
  }
}

export function setAudience(a: Audience): void {
  try {
    if (a === 'all') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, a);
  } catch {
    /* private mode — the preference just does not persist */
  }
}

/**
 * The query fragment for the hairstyles API. 'all' sends nothing rather than
 * gender=All, so the default path is a plain unfiltered request.
 * The backend widens a specific gender to include unisex styles, so choosing
 * "Women" still surfaces the styles that work for anyone.
 */
export function audienceQuery(a: Audience): { gender?: string } {
  return a === 'all' ? {} : { gender: a };
}
