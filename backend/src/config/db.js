const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl:
      process.env.DATABASE_URL?.includes("neon.tech") ||
      process.env.DATABASE_URL?.includes("render.com")
        ? { require: true, rejectUnauthorized: false }
        : false,
  },
});
const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("membre", "admin"), defaultValue: "membre" },
  online: { type: DataTypes.BOOLEAN, defaultValue: false },
  muted: { type: DataTypes.BOOLEAN, defaultValue: false },
  mutedUntil: { type: DataTypes.DATE, allowNull: true },
  mutedReason: { type: DataTypes.STRING, defaultValue: "" },
  banned: { type: DataTypes.BOOLEAN, defaultValue: false },
  bannedReason: { type: DataTypes.STRING, defaultValue: "" },
  // 🏆 Classements
  unoWins: { type: DataTypes.INTEGER, defaultValue: 0 },
  chessWins: { type: DataTypes.INTEGER, defaultValue: 0 },
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

const BanList = sequelize.define("BanList", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: true },
  reason: { type: DataTypes.STRING, defaultValue: "" },
});

// Associations
User.hasMany(Room, { foreignKey: "createdById", as: "createdRooms" });
Room.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

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

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connecté");
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronisées");
    if ((await Room.count()) === 0) {
      await Room.create({ name: "general", description: "Salon principal" });
      console.log("➕ Salon #general créé");
    }
  } catch (e) {
    console.error("❌ Erreur DB :", e.message);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  connectDB,
  User,
  Room,
  Message,
  Document,
  BanList,
};
