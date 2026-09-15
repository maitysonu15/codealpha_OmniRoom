/**
 * OmniRoom - Runtime Environment & API Configuration
 * Automatically detects hosting environment (Vercel, Localhost, Custom Production Host).
 */
(function() {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const customApiUrl = typeof window !== 'undefined' 
    ? (localStorage.getItem('omniroom_api_url') || localStorage.getItem('onemeet_api_url')) 
    : null;
  const customWsUrl = typeof window !== 'undefined' 
    ? (localStorage.getItem('omniroom_ws_url') || localStorage.getItem('onemeet_ws_url')) 
    : null;

  const defaultApiBase = isLocal
    ? (window.location.port && window.location.port !== '8080' ? 'http://localhost:8080/api' : '/api')
    : (window.location.origin.includes('vercel.app') ? '/api' : `${window.location.origin}/api`);

  const wsProtocol = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss:' : 'ws:';
  const defaultWsBase = isLocal
    ? `${wsProtocol}//${window.location.hostname || '127.0.0.1'}:8080`
    : `${wsProtocol}//${window.location.host}`;

  const configObj = {
    API_URL: customApiUrl || defaultApiBase,
    WS_URL: customWsUrl || defaultWsBase,
    IS_LOCAL: isLocal,
    ENV: isLocal ? 'development' : 'production'
  };

  window.OMNIROOM_CONFIG = configObj;
  window.OPENMEET_CONFIG = configObj;
})();
