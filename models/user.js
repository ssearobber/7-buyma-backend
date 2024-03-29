const DataTypes = require("sequelize");
const { Model } = DataTypes;

module.exports = class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        // id가 기본적으로 들어있다.
        email: {
          type: DataTypes.STRING(30), // STRING, TEXT, BOOLEAN, INTEGER, FLOAT, DATETIME
          allowNull: false, // 필수
          unique: true, // 고유한 값
        },
        nickname: {
          type: DataTypes.STRING(30),
          allowNull: false, // 필수
        },
        password: {
          type: DataTypes.STRING(100),
          allowNull: false, // 필수
        },
        isblock: {
          type: DataTypes.BOOLEAN,
          allowNull: false
        },
        role: {
          type: DataTypes.STRING(30),
          allowNull: false
        },
        create_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        date_created: {
          type: DataTypes.DATE,
          allowNull: false
        },
        update_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        last_updated: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        modelName: "User",
        timestamps: false,
        tableName: "user",
        paranoid: true,
        charset: "utf8",
        collate: "utf8_general_ci", // 한글 저장
        sequelize,
      }
    );
  }
  static associate(db) {
    db.User.hasMany(db.Comment);
  }
};
