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
  charset: 'utf8mb4',
  timezone: '+00:00',
  cli: {
    migrationsDir: 'src/migrations',
  },
  extra: {
    connectionLimit: 10,
    connectTimeout: 30000, // 30 seconds handshake timeout
    acquireTimeout: 60000,  // optional, max wait for free connection
  },
})

exports.dataSource = dataSource