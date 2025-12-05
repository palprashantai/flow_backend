import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { HttpModule } from '@nestjs/axios'
import { dataSourceOptions } from './databases/data-source'
import { JwtModule } from '@nestjs/jwt'
// import { RateLimitMiddleware } from 'middlewares/rate-limit.middleware'
import { AuthModule } from 'modules/auth/auth.module'
import { CommonModule } from 'modules/common/common.module'
import { SettingModule } from 'modules/setting/setting.module'
import { CacheModule } from 'cache.module'
import { PortfolioModule } from 'modules/portfolio/portfolio.module'
import { UserModule } from 'modules/user/user.module'
import { PaymentModule } from 'modules/payment/payment.module'
import { SmallcaseModule } from 'modules/smallcase/smallcase.module'
import { ReferralModule } from 'modules/referral/referral.module'
//import { GrpcClientModule } from 'grpc/grpc-client.module'

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

    TypeOrmModule.forRoot({
      name: 'secondary',
      type: 'mysql',
      host: process.env.SECONDARY_DB_HOST || 'localhost',
      port: parseInt(process.env.SECONDARY_DB_PORT || '3306'),
      username: process.env.SECONDARY_DB_USER || 'root',
      password: process.env.SECONDARY_DB_PASS || 'password2',
      database: process.env.SECONDARY_DB_NAME || 'analytics_db',
      entities: [__dirname + '/path/to/analytics/**/*.entity{.ts,.js}'],
      synchronize: false,
      extra: {
        connectionLimit: 10, // adjust higher if needed
      },
      // autoLoadEntities: true, // optional if entities path is set
    }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    //GrpcClientModule,
    AuthModule,
    UserModule,
    SettingModule,
    CommonModule,
    PortfolioModule,
    PaymentModule,
    SmallcaseModule,
    ReferralModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
// implements NestModule {
//   // configure(consumer: MiddlewareConsumer) {
//   //   // consumer.apply(RateLimitMiddleware).forRoutes({ path: '*', method: RequestMethod.POST })
//   // }
// }
