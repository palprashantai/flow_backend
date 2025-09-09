import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogEntity, OtpBoxEntity, Subscriber, SubscriberRecent, UserInfo, WorkflowLeadCreation } from './auth.entity'
import { CommonModule } from 'modules/common/common.module'
// import { GrpcClientModule } from 'grpc/grpc-client.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscriber, OtpBoxEntity, LogEntity, SubscriberRecent, WorkflowLeadCreation, UserInfo]),
    CommonModule,
    // GrpcClientModule,
  ],
  controllers: [AuthController],
  exports: [AuthService], // 👈 EXPORT IT
  providers: [AuthService],
})
export class AuthModule {}
