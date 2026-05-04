const authService = require("../services/authService");

async function register(req, res) {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);
  res.json(result);
}

module.exports = {
  register,
  login,
};
