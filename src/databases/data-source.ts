import { DataSource, DataSourceOptions } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.HOST,
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: +(process.env.MYSQL_PORT || '3306'),
  synchronize: false,
  entities: ['dist/modules/**/*.entity.js'],
  // MySQL specific options
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Connection pool settings (optional but recommended)
  extra: {
    connectionLimit: 10,
  },
}

const initializeDataSource = async () => {
  const dataSourceConn = new DataSource(dataSourceOptions)
  try {
    // console.log('dataSourceOptions', dataSourceOptions)
    await dataSourceConn.initialize()
    console.log('MySQL Database connected successfully')
    return dataSourceConn
  } catch (err) {
    console.error('Error during Data Source initialization', err)
    throw err
  }
}

export const dataSource = initializeDataSource()
