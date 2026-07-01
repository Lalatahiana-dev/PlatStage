import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { CompanyModule } from './company/company.module';
import { OfferModule } from './offer/offer.module';
import { ApplicationModule } from './application/application.module';
import { StudentModule } from './student/student.module';
import { CategoryModule } from './category/category.module';
import { SkillModule } from './skill/skill.module';
import { FavoriteModule } from './favorite/favorite.module';
import { NotificationModule } from './notification/notification.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { InterviewModule } from './interview/interview.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PrismaModule,
    CompanyModule,
    OfferModule,
    ApplicationModule,
    StudentModule,
    CategoryModule,
    SkillModule,
    FavoriteModule,
    NotificationModule,
    ConversationModule,
    MessageModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [AppService], // ✅ esorina ny APP_GUARD
})
export class AppModule {}
