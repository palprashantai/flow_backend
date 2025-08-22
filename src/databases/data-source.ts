import { DataSource, DataSourceOptions } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.HOST || '127.0.0.1',
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: +(process.env.MYSQL_PORT || 3306),
  synchronize: false,
  logging: true,
  entities: ['dist/modules/**/*.entity.js'],
  charset: 'utf8mb4',
  timezone: '+00:00',
  extra: {
    connectionLimit: 10,
    connectTimeout: 30000, // 30s handshake timeout
  },
}

const initializeDataSource = async () => {
  const dataSourceConn = new DataSource(dataSourceOptions)
  try {
    await dataSourceConn.initialize()
    console.log('✅ MySQL Database connected successfully')
    return dataSourceConn
  } catch (err) {
    console.error('❌ Error during Data Source initialization', err)
    throw err
  }
}

export const dataSource = initializeDataSource()
