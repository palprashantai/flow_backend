const dotenv = require('dotenv')
const { DataSource } = require('typeorm')
dotenv.config()

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.HOST,
  port: +process.env.MYSQL_PORT,
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  entities: ['./src/modules/**/*.entity{.ts,.js}'],
  migrations: ['./src/*-migrations*{.ts,.js}'],
  synchronize: false,
  // MySQL specific options
  charset: 'utf8mb4',
  timezone: '+00:00',
  // CLI configuration for migrations
  cli: {
    migrationsDir: 'src/migrations',
  },
  // Additional MySQL connection options
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
})

exports.dataSource = dataSource