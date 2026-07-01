import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('user/:id')
  @ApiOperation({ summary: "Mahita notifications an'ny user" })
  @UseGuards(AuthGuard('jwt'))
  async findByUser(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findByUser(id);
  }

  @Post()
  @ApiOperation({ summary: 'Mamorona notification (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: CreateNotificationDto) {
    return this.notificationService.create(body);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mamaritra notification ho read' })
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Put('user/:id/read-all')
  @ApiOperation({ summary: 'Mamaritra notifications rehetra ho read' })
  @UseGuards(AuthGuard('jwt'))
  async markAllAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAllAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mamafa notification' })
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.remove(id);
  }
}
