export default function respPWA(req, res, next) {
  res.setHeader('Service-Worker-Allowed', '/');
  next();
}
