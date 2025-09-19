// // rate-limit.middleware.ts

// import { Injectable, NestMiddleware } from '@nestjs/common'
// import { Request, Response, NextFunction } from 'express'
// import { RateLimiterMemory } from 'rate-limiter-flexible'
// import { ConfigService } from '@nestjs/config'

// @Injectable()
// export class RateLimitMiddleware implements NestMiddleware {
//   private limiter: RateLimiterMemory

//   constructor(public readonly configService: ConfigService) {
//     // Set the rate limit to 100 POST requests per minute (adjust as needed)
//     this.limiter = new RateLimiterMemory({
//       points: parseInt(configService.get('POINTS')),
//       duration: parseFloat(configService.get('DURATION')), // in seconds
//     })
//   }

//   async use(req: Request, res: Response, next: NextFunction) {
//     // Apply rate limiting only to POST requests
//     if (req.method === 'POST') {
//       try {
//         await this.limiter.consume(req.ip)
//       } catch (error) {
//         return res.status(429).json({ message: 'Too Many Requests' })
//       }
//     }
//     next()
//   }
// }
