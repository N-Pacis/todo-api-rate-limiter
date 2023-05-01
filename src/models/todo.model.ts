import { DataTypes } from 'sequelize';
import UserModel from './user.model';
import sequelize from '../utils/database';
import { Todo } from '../types/todo';

const TodoModel = sequelize.define(
  'todos',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      references: {
        model: UserModel,
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
      allowNull: true,
    }
  },
  {
    timestamps: true,
  }
);

Todo.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      references: {
        model: UserModel,
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'todos',
    timestamps: true,
  }
);

Todo.belongsTo(UserModel, {
  foreignKey: 'created_by',
  as: 'user',
});

export default TodoModel;
