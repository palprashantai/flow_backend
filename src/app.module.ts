import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { HttpModule } from '@nestjs/axios'
import { dataSourceOptions } from './databases/data-source'
import { JwtModule } from '@nestjs/jwt'
import { AuthModule } from 'modules/auth/auth.module'
import { CommonModule } from 'modules/common/common.module'
import { CacheModule } from 'cache.module'


import { CustomerModule } from 'modules/customer/customer.module'
import { EnquiryModule } from 'modules/enquiry/enquiry.module'
import { BookingModule } from 'modules/booking/booking.module'
import { TravelPackageModule } from 'modules/travel-package/travel-package.module'
import { ItineraryModule } from 'modules/itinerary/itinerary.module'
import { QuotationModule } from 'modules/quotation/quotation.module'
import { CrmPaymentModule } from 'modules/crm-payment/crm-payment.module'
import { InvoiceModule } from 'modules/invoice/invoice.module'
import { CrmAuthModule } from 'modules/crm-auth/crm-auth.module'
import { CrmUserModule } from 'modules/user/crm-user.module'
import { CalendarEventModule } from 'modules/calendar-event/calendar-event.module'

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

    // TypeOrmModule.forRoot({
    //   name: 'secondary',
    //   type: 'mysql',
    //   host: process.env.SECONDARY_DB_HOST || 'localhost',
    //   port: parseInt(process.env.SECONDARY_DB_PORT || '3306'),
    //   username: process.env.SECONDARY_DB_USER || 'root',
    //   password: process.env.SECONDARY_DB_PASS || 'password2',
    //   database: process.env.SECONDARY_DB_NAME || 'analytics_db',
    //   entities: [__dirname + '/path/to/analytics/**/*.entity{.ts,.js}'],
    //   synchronize: false,
    //   extra: {
    //     connectionLimit: 10, // adjust higher if needed
    //   },
    //   // autoLoadEntities: true, // optional if entities path is set
    // }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    //GrpcClientModule,
    AuthModule,
    CommonModule,

    CustomerModule,
    EnquiryModule,
    BookingModule,
    TravelPackageModule,
    ItineraryModule,
    QuotationModule,
    CrmPaymentModule,
    InvoiceModule,
    CalendarEventModule,
    CacheModule,
    CrmAuthModule,
    CrmUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
// implements NestModule {
//   // configure(consumer: MiddlewareConsumer) {
//   //   // consumer.apply(RateLimitMiddleware).forRoutes({ path: '*', method: RequestMethod.POST })
//   // }
// }
