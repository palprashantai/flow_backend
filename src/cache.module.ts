// src/common/cache/cache.module.ts
import { Module, Global } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as NodeCache from 'node-cache'

@Global()
@Module({
  imports: [ConfigModule], // Ensure ConfigModule is imported
  providers: [
    {
      provide: 'NODE_CACHE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttl = Number(configService.get('CACHE_TTL_SECONDS')) || 300
        return new NodeCache({ stdTTL: ttl })
      },
    },
  ],
  exports: ['NODE_CACHE'],
})
export class CacheModule {}
