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

  @Post()
  @ApiOperation({ summary: 'Mandefa message' })
  @UseGuards(AuthGuard('jwt'))
  async send(@Body() body: SendMessageDto) {
    return this.messageService.send(body);
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
