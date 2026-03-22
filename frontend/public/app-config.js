// Determina gli URL basati sull'host corrente
const getApiUrl = () => {
  if (window.location.hostname.includes('github.dev')) {
    // GitHub Codespace
    const match = window.location.hostname.match(/^([\w-]+)-(\d+)\./);
    if (match) {
      const codespaceId = match[1];
      return `https://${codespaceId}-5000.app.github.dev/api`;
    }
  }
  return 'http://localhost:5000/api';
};

const getKeycloakUrl = () => {
  if (window.location.hostname.includes('github.dev')) {
    // GitHub Codespace
    const match = window.location.hostname.match(/^([\w-]+)-(\d+)\./);
    if (match) {
      const codespaceId = match[1];
      return `https://${codespaceId}-8080.app.github.dev`;
    }
  }
  return 'http://localhost:8080';
};

window.__APP_CONFIG__ = {
  apiUrl: getApiUrl(),
  keycloakUrl: getKeycloakUrl(),
  keycloakRealm: 'registro-elettronico',
  keycloakClientId: 'registro-frontend',
};
