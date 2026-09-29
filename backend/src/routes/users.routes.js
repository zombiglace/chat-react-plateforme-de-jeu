const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { User } = require("../config/db");

router.get("/", protect, async (_, res) => {
  const users = await User.findAll({ attributes: { exclude: ["password"] } });
  res.json(users);
});

router.get("/me", protect, (req, res) => res.json(req.user));

module.exports = router;
