window.ACI_UI = {
  escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  media(path) {
    if (typeof path !== 'string') return '';
    return /^(?:\/?photos\/[a-z0-9-]+\/[a-zA-Z0-9._-]+\.webp|\/api\/public-media\/portfolio\/[a-z0-9-]+\/[a-zA-Z0-9-]+\.webp)$/.test(path) ? '/' + path.replace(/^\//, '') : '';
  }
};
