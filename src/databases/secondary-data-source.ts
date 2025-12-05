import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const secondaryDataSourceOptions: DataSourceOptions = {
  name: 'secondary',
  type: 'mysql',
  host: process.env.SECONDARY_DB_HOST || 'localhost',
  port: +(process.env.SECONDARY_DB_PORT || 3306),
  username: process.env.SECONDARY_DB_USER || 'root',
  password: process.env.SECONDARY_DB_PASS || 'password2',
  database: process.env.SECONDARY_DB_NAME || 'analytics_db',
  entities: [__dirname + '/../modules/analytics/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
  extra: { connectionLimit: 10 },
};
