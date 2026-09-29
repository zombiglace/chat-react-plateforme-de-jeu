const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("membre", "admin"), defaultValue: "membre" },
    avatar: { type: DataTypes.STRING, defaultValue: "" },
    online: { type: DataTypes.BOOLEAN, defaultValue: false },
    registrationIp: { type: DataTypes.STRING, defaultValue: "" },
    muted: { type: DataTypes.BOOLEAN, defaultValue: false },
    mutedUntil: { type: DataTypes.DATE, allowNull: true },
    mutedReason: { type: DataTypes.STRING, defaultValue: "" },
    banned: { type: DataTypes.BOOLEAN, defaultValue: false },
    bannedReason: { type: DataTypes.STRING, defaultValue: "" },
  });

  const Room = sequelize.define("Room", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    description: { type: DataTypes.STRING, defaultValue: "" },
  });

  const Message = sequelize.define("Message", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM("text", "emoji", "system"),
      defaultValue: "text",
    },
  });

  const Document = sequelize.define("Document", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    size: DataTypes.INTEGER,
    mimetype: DataTypes.STRING,
  });

  // 🆕 Table de bans persistants
  const BanList = sequelize.define("BanList", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: true },
    ip: { type: DataTypes.STRING, allowNull: true },
    reason: { type: DataTypes.STRING, defaultValue: "Non spécifié" },
    bannedBy: { type: DataTypes.INTEGER, allowNull: true },
  });

  // -------- Associations --------
  User.hasMany(Room, { foreignKey: "createdById", as: "createdRooms" });
  Room.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

  User.belongsToMany(Room, {
    through: "RoomMembers",
    as: "rooms",
    foreignKey: "userId",
  });
  Room.belongsToMany(User, {
    through: "RoomMembers",
    as: "members",
    foreignKey: "roomId",
  });

  User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
  Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  User.hasMany(Message, { foreignKey: "receiverId", as: "receivedMessages" });
  Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

  Room.hasMany(Message, {
    foreignKey: "roomId",
    as: "messages",
    onDelete: "CASCADE",
  });
  Message.belongsTo(Room, { foreignKey: "roomId", as: "room" });

  User.hasMany(Document, { foreignKey: "uploadedById", as: "documents" });
  Document.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

  Room.hasMany(Document, { foreignKey: "roomId", as: "documents" });
  Document.belongsTo(Room, { foreignKey: "roomId", as: "room" });

  return { User, Room, Message, Document, BanList };
};
