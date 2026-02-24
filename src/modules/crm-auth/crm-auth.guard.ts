import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CrmAuthService } from './crm-auth.service'

/**
 * CrmAuthGuard validates JWT from the Authorization header
 * and checks the user against the CRM `users` table.
 */
@Injectable()
export class CrmAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly crmAuthService: CrmAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('Unauthorized: No token provided', HttpStatus.UNAUTHORIZED)
    }

    const token = authorization.split(' ')[1]

    try {
      const decoded: any = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      })

      if (!decoded?.id) {
        throw new UnauthorizedException('Invalid token payload')
      }

      const user = await this.crmAuthService.getUserById(decoded.id)
      if (!user) {
        throw new UnauthorizedException('User not found or deactivated')
      }

      req.crmUser = { id: user.id, role: user.role }
      return true
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}

export function Auth() {
  return applyDecorators(UseGuards(CrmAuthGuard))
}

export const GetCrmUserId = createParamDecorator((_data, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest()
  return req.crmUser?.id
})

export const GetCrmUserRole = createParamDecorator((_data, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest()
  return req.crmUser?.role
})
