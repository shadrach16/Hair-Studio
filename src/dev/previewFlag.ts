// The studio hook rewrites the query string on mount (?studio_status=discover),
// so anything read from window.location.search inside a render or effect is
// already gone. Capturing it at module-evaluation time — which runs during
// import, before React mounts — is what makes ?preview=... survive.
export const PREVIEW_PARAMS = new URLSearchParams(window.location.search);
export const PREVIEW = PREVIEW_PARAMS.get('preview');
