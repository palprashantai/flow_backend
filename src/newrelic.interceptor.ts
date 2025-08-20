import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { logger } from 'middlewares/logger.middleware'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

const util = require('util')
const newrelic = require('newrelic')

@Injectable()
export class NewrelicInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return newrelic.startWebTransaction(context.getHandler().name, function () {
      const transaction = newrelic.getTransaction()

      const req = context.switchToHttp().getRequest()
      const { originalUrl, method, params, query, body } = req

      return next.handle().pipe(
        tap(
          (data) => {
            /* logger.log('info', `${util.inspect(context.getHandler().name)}`, {
              data,
              ...{ originalUrl, method, params, query },
              body,
            }) */
            return transaction.end()
          },
          (error) => {
            logger.log('error', `${util.inspect(context.getHandler().name)}`, {
              error,
              ...{ originalUrl, method, params, query },
              body,
            })
            return error
          }
        )
      )
    })
  }
}
