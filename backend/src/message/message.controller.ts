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
import { MessageService } from './message.service';
import { AuthGuard } from '@nestjs/passport';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get('conversation/:id')
  @ApiOperation({ summary: "Mahita messages an'ny conversation" })
  @UseGuards(AuthGuard('jwt'))
  async findByConversation(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.findByConversation(id);
  }

  @Get('unread/:userId')
  @ApiOperation({ summary: 'Nombre total de messages non lus' })
  @UseGuards(AuthGuard('jwt'))
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return this.messageService.getUnreadCount(userId);
  }

  @Get('unread-by-conversation/:userId')
  @ApiOperation({ summary: 'Messages non lus par conversation' })
  @UseGuards(AuthGuard('jwt'))
  async getUnreadByConversation(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.messageService.getUnreadByConversation(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Mandefa message' })
  @UseGuards(AuthGuard('jwt'))
  async send(@Body() body: SendMessageDto) {
    return this.messageService.send(body);
  }

  @Put('conversation/:id/read-all')
  @ApiOperation({
    summary: "Mamaritra messages rehetra ao amin'ny conversation ho read",
  })
  @UseGuards(AuthGuard('jwt'))
  async markConversationAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body('id_user') id_user: number,
  ) {
    return this.messageService.markConversationAsRead(id, id_user);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mamaritra message ho read' })
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mamafa message' })
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.remove(id);
  }
}
