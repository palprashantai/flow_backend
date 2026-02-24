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
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CrmAuthService } from './crm-auth.service'

@Injectable()
export class CrmAuthGuard implements CanActivate {
  private readonly logger = new Logger(CrmAuthGuard.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly crmAuthService: CrmAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const authorization = req.headers.authorization

    this.logger.debug(`Incoming request: ${req.method} ${req.url}`)

    if (!authorization) {
      this.logger.warn('Authorization header missing')
      throw new HttpException(
        'Unauthorized: No token provided',
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (!authorization.startsWith('Bearer ')) {
      this.logger.warn('Invalid Authorization format (missing Bearer)')
      throw new HttpException(
        'Unauthorized: Invalid token format',
        HttpStatus.UNAUTHORIZED,
      )
    }

    const token = authorization.split(' ')[1]

    this.logger.debug(`Token received (first 15 chars): ${token.slice(0, 15)}...`)

    try {
      const decoded: any = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })

      this.logger.debug(`Token decoded. User ID: ${decoded?.id}`)

      if (!decoded?.id) {
        this.logger.error('Decoded token missing user id')
        throw new UnauthorizedException('Invalid token payload')
      }

      const user = await this.crmAuthService.getUserById(decoded.id)

      if (!user) {
        this.logger.warn(`User not found or deactivated. ID: ${decoded.id}`)
        throw new UnauthorizedException('User not found or deactivated')
      }

      this.logger.debug(
        `User authenticated successfully. ID=${user.id}, Role=${user.role}`,
      )

      req.crmUser = { id: user.id, role: user.role }

      return true
    } catch (error) {
      this.logger.error(
        `JWT verification failed: ${error.message}`,
        error.stack,
      )

      if (error instanceof HttpException) throw error

      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}

export function Auth() {
  return applyDecorators(UseGuards(CrmAuthGuard))
}

export const GetCrmUserId = createParamDecorator(
  (_data, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest()
    return req.crmUser?.id
  },
)

export const GetCrmUserRole = createParamDecorator(
  (_data, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest()
    return req.crmUser?.role
  },
)