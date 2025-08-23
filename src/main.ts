import { NestFactory } from '@nestjs/core'
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe, Logger } from '@nestjs/common'
import * as path from 'path'
import compression from 'compression'
import basicAuth from 'express-basic-auth'
import helmet from 'helmet' // ✅ Fixed import
import morgan from 'morgan'

import { AppModule } from './app.module'
import { setupSwagger } from './swagger'
import { ConfigService } from '@nestjs/config'
// import { NewrelicInterceptor } from 'newrelic.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), {
    cors: true,
    logger: process.env.LOGGER ? JSON.parse(process.env.LOGGER) : ['log', 'error', 'warn'], // ✅ Fixed logger
  })
  const configService = app.get(ConfigService) // ✅ Get ConfigService from app context

  app.enable('trust proxy')
  app.use(helmet()) // ✅ No need for .default()
  app.use(compression()) // ✅ Now works correctly
  app.use(
    '/api-docs', // ✅ Match the route from swagger setup
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'password', // ✅ Added fallbacks
      },
    })
  )
  app.use(morgan('combined'))
  setupSwagger(app)

  app.setBaseViewsDir(path.join(__dirname, '..', 'templates'))
  app.setViewEngine('ejs')

  // app.useGlobalInterceptors(new NewrelicInterceptor())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      dismissDefaultMessages: false,
      validationError: {
        target: false,
      },
    })
  )

  const port = configService.get<number>('PORT') || 3000
  await app.listen(port)

  const logger: Logger = new Logger('Bootstrap')
  logger.log(`🚀 StreetFolios API Server running at http://localhost:${port}`)
  logger.log(`📚 API Documentation available at http://localhost:${port}/api-docs`)
}

bootstrap().catch((error) => {
  console.error('❌ Error starting server:', error)
  process.exit(1)
})
