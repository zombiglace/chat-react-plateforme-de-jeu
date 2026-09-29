const router = require("express").Router();
const { Op } = require("sequelize");
const { protect } = require("../middleware/auth");
const { Message, User } = require("../config/db");

router.get("/room/:roomId", protect, async (req, res) => {
  const msgs = await Message.findAll({
    where: { roomId: req.params.roomId },
    include: [{ model: User, as: "sender", attributes: ["id", "username", "role"] }],
    order: [["createdAt", "ASC"]],
    limit: 200,
  });
  res.json(msgs);
});

router.get("/private/:userId", protect, async (req, res) => {
  const me = req.user.id;
  const other = req.params.userId;
  const msgs = await Message.findAll({
    where: {
      [Op.or]: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    },
    include: [{ model: User, as: "sender", attributes: ["id", "username", "role"] }],
    order: [["createdAt", "ASC"]],
    limit: 200,
  });
  res.json(msgs);
});

module.exports = router;
