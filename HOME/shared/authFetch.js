(function(){
  // Global helper: fetchWithAuth(url, options)
  // - Relies on httpOnly auth cookies for authentication
  // - On 401, calls POST /api/auth/refresh with credentials to obtain a new access token cookie,
  //   then retries the original request once.

  async function tryRefresh() {
    try {
      var origin = (typeof window !== 'undefined' && window.F2C_API_ORIGIN) ? window.F2C_API_ORIGIN : 'http://localhost:5000';
      const res = await fetch(origin + '/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) return false;
      // server sets new accessToken cookie; return true on success
      return true;
    } catch (e) {
      return false;
    }
  }

  // fetchWithAuth relies on httpOnly cookies for auth. It sends requests with
  // credentials and, on 401, asks the server to refresh the access cookie and retries once.
  window.fetchWithAuth = async function(url, options = {}){
    options = Object.assign({}, options);
    options.headers = Object.assign({}, options.headers || {});
    if (!('credentials' in options)) options.credentials = 'include';

    let res;
    try {
      res = await fetch(url, options);
    } catch (e) {
      throw e;
    }

    if (res.status !== 401) return res;

    // try refresh once (will set new accessToken cookie)
    const refreshed = await tryRefresh();
    if (!refreshed) return res;

    // retry original request (cookies include new access token)
    try {
      const retry = await fetch(url, options);
      return retry;
    } catch (e) {
      throw e;
    }
  };
})();
