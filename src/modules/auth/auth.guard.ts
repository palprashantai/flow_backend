import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

import { errors } from 'error'
import { getUserBy } from './auth.repository'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()

    if (!req.headers.authorization) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    req.user = await this.validateToken(req.headers.authorization)

    return true
  }

  private async validateToken(auth: string) {
    try {
      if (!auth.startsWith('Bearer ')) {
        throw new HttpException('Invalid access token', HttpStatus.FORBIDDEN)
      }

      const token = auth.split(' ')[1]

      const decoded: any = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      })

      if (!decoded?.id) {
        throw new HttpException('Invalid token payload', HttpStatus.UNAUTHORIZED)
      }

      const userDetails = await getUserBy({ id: decoded.id })
      if (!userDetails) throw errors.UserNotFound

      // ✅ Only attach user id
      return { id: decoded.id }
    } catch (error) {
      throw errors.Logout
    }
  }
}

// ✅ Decorator to apply AuthGuard
export function Auth() {
  return applyDecorators(UseGuards(AuthGuard))
}

// ✅ Param decorator for user id
export const GetUserId = createParamDecorator((data, ctx: ExecutionContext): number => {
  const req = ctx.switchToHttp().getRequest()
  return req.user?.id
})
