const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { Room, User } = require("../config/db");

router.get("/", protect, async (_, res) => {
  const rooms = await Room.findAll({
    include: [{ model: User, as: "createdBy", attributes: ["id", "username"] }],
    order: [["createdAt", "ASC"]],
  });
  res.json(rooms);
});

router.post("/", protect, async (req, res) => {
  const room = await Room.create({
    name: req.body.name,
    description: req.body.description || "",
    createdById: req.user.id,
  });
  res.json(room);
});

module.exports = router;
