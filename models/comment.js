const Sequelize = require('sequelize');

module.exports = class Comment extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        // id가 기본적으로 들어있다.
        author: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        email: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        datetime: {
          type: Sequelize.DATE,
          allowNull: false
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
        collate: "utf8mb4_general_ci", // 한글 저장
        sequelize,
      }
    );
  }
  static associate(db) {
    db.Comment.belongsTo(db.User);
  }
};
