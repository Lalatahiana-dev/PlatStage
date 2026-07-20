import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagingGateway } from './messaging.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [MessagingGateway],
  exports: [MessagingGateway],
})
export class MessagingModule {}
