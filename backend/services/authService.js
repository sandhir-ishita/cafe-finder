const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function registerUser({ name, email, password }) {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("An account with that email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
  signToken,
};
