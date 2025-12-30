const bcrypt = require("bcryptjs");
const User = require("../repositories/users.repo");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

async function register({ name, email, password, role }) {
  const exists = await User.findOne({ email });
  if (exists) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || "user",
  });

  return user;
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: user._id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    const err = new Error("Refresh token required");
    err.statusCode = 401;
    throw err;
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: user._id, role: user.role, email: user.email };
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  user.refreshToken = null;
  await user.save();
}

async function me(userId) {
  const user = await User.findById(userId).select("-passwordHash -refreshToken");
  return user;
}

module.exports = { register, login, refresh, logout, me };