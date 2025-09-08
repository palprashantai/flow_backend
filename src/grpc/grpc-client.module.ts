// src/grpc/grpc-client.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcClientService } from './grpc-client.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WORKFLOW_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'workflow',
          protoPath: join(__dirname, 'proto/workflow.proto'), // Correct path to proto file
          url: 'localhost:50051', // This should match your CRM server's gRPC port
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  providers: [GrpcClientService],
  exports: [GrpcClientService],
})
export class GrpcClientModule {}