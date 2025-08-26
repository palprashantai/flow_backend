import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { HttpModule } from '@nestjs/axios'
import { dataSourceOptions } from './databases/data-source'
import { JwtModule } from '@nestjs/jwt'
import { RateLimitMiddleware } from 'middlewares/rate-limit.middleware'
import { AuthModule } from 'modules/auth/auth.module'
import { CommonModule } from 'modules/common/common.module'
import { SettingModule } from 'modules/setting/setting.module'
import { CacheModule } from 'cache.module'
import { PortfolioModule } from 'modules/portfolio/portfolio.module'
import { UserModule } from 'modules/user/user.module'
import { PaymentModule } from 'modules/payment/payment.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    // MailerModule.register(),
    {
      ...HttpModule.register({}),
      global: true,
    },
    {
      ...JwtModule.register({ secret: process.env.JWT_SECRET }),
      global: true,
    },

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    AuthModule,
    UserModule,
    SettingModule,
    CommonModule,
    PortfolioModule,
    PaymentModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes({ path: '*', method: RequestMethod.POST })
  }
}
