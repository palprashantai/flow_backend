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

/**
 * AuthGuard validates JWT from the Authorization header.
 * - Checks for presence of 'Bearer' token.
 * - Verifies the token using JWT_SECRET.
 * - Attaches `user.id` to the request object.
 *
 * @throws HttpException(UNAUTHORIZED) if header is missing or token invalid.
 * @throws HttpException(FORBIDDEN) if token format is invalid.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
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
      throw error
    }
  }
}

/**
 * Decorator to apply AuthGuard to route handlers.
 */
export function Auth() {
  return applyDecorators(UseGuards(AuthGuard))
}

/**
 * Param decorator to extract authenticated user's ID from request.
 */
export const GetUserId = createParamDecorator((data, ctx: ExecutionContext): number => {
  const req = ctx.switchToHttp().getRequest()
  return req.user?.id
})
