(function (w) {
  // When the UI is served from the same Express app as the API (port 5000), use that origin
  // so cookies and /uploads paths work. Otherwise assume API on localhost:5000 (e.g. Live Server).
  function computeOrigin() {
    try {
      if (String(w.location.port) === '5000') return w.location.origin;
    } catch (e) { /* ignore */ }
    return 'http://localhost:5000';
  }

  w.F2C_API_ORIGIN = computeOrigin();

  /** Prefix /uploads/... with API origin when needed */
  w.F2C_resolveUploadUrl = function (src, placeholder) {
    placeholder = placeholder || 'https://via.placeholder.com/200x150?text=No+Image';
    if (!src) return placeholder;
    if (src.startsWith('/uploads')) return w.F2C_API_ORIGIN + src;
    return src;
  };
})(typeof window !== 'undefined' ? window : globalThis);
