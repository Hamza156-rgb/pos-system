// Wraps async route handlers and forwards errors to the error middleware
export default (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
