import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { Subscriber } from 'modules/auth/auth.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
