const DataTypes = require("sequelize");
const { Model } = DataTypes;

module.exports = class Comment extends Model {
  static init(sequelize) {
    return super.init(
      {
        // id가 기본적으로 들어있다.
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        productId: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
      },
      {
        modelName: "Comment",
        tableName: "comment",
        paranoid: true,
        charset: "utf8mb4",
        collate: "utf8_general_ci", // 한글 저장
        sequelize,
      }
    );
  }
  static associate(db) {
    db.Comment.belongsToMany(db.User);
  }
};
