const rateLimit = require("express-rate-limit");

const generalLimiter = rateLimit({
  windowMs: 10 * 6000, // 1 menit
  max: 10, // max 10 request/menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

module.exports = { generalLimiter };