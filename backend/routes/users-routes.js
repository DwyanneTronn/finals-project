const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [
    check("firstName").not().isEmpty(),
    check("lastName").not().isEmpty(),
    check("mobileNumber").not().isEmpty(),
    check("email")
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post(
  "/login",
  [
    check("email")
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
  ],
  usersController.login
);

module.exports = router;
