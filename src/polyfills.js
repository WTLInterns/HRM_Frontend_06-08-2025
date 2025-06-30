// Add global object polyfill for sockjs-client
if (typeof global === 'undefined') {
  window.global = window;
}
