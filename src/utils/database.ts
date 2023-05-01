import { db_host, db_name, db_user, db_password } from './config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(db_name, db_user, db_password, {
  host: db_host,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

export { connectDB, sequelize, Sequelize };

export default sequelize;
