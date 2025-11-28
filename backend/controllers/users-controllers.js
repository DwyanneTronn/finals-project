const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { firstName, lastName, mobileNumber, email, password, places } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  // Generate name from firstName and lastName for backward compatibility
  const name = `${firstName} ${lastName}`;

  const createdUser = new User({
    name,
    firstName,
    lastName,
    mobileNumber,
    email,
    image:
      "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_incoming&w=740&q=80",
    password,
    places,
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.error("--- SIGNUP FAILED ---", err);

    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  console.log("=== LOGIN ATTEMPT ===");
  console.log("Request body received:", req.body);
  
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);
  console.log("Password provided:", password ? "Yes (hidden)" : "No");

  let existingUser;

  try {
    console.log("Querying database for user with email:", email);
    console.log("Login Email Input:", email);
    // Normalize email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase().trim();
    console.log("Normalized email for query:", normalizedEmail);
    console.log("Query: User.findOne({ email: normalizedEmail })");
    existingUser = await User.findOne({ email: normalizedEmail });
    console.log("User query result:", existingUser ? "User found" : "User not found");
    if (existingUser) {
      console.log("Found user ID:", existingUser.id);
      console.log("Found user email:", existingUser.email);
      console.log("Stored password matches:", existingUser.password === password ? "Yes" : "No");
    }
  } catch (err) {
    console.log("Database error during login:", err.message);
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    console.log("Login failed - User not found or password mismatch");
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  console.log("Login successful! Sending response");
  res.json({
    message: "Logged in!",
    userId: existingUser.id,
    email: existingUser.email,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
