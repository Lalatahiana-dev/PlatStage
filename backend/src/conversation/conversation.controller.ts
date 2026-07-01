import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @Get('student/:id')
  @ApiOperation({
    summary: "Mahita conversations an'ny student (STUDENT/ADMIN)",
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findByStudent(id);
  }

  @Get('company/:id')
  @ApiOperation({
    summary: "Mahita conversations an'ny company (COMPANY/ADMIN)",
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  async findByCompany(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findByCompany(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mahita conversation iray' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'COMPANY', 'ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Mamorona conversation vaovao' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'COMPANY', 'ADMIN')
  async create(@Body() body: CreateConversationDto) {
    return this.conversationService.create(body);
  }
}
