import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get all interviews (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.interviewService.findAll();
  }

  @Get('application/:id')
  @ApiOperation({ summary: "Get interview by application" })
  @UseGuards(AuthGuard('jwt'))
  findByApplication(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.findByApplication(id);
  }

  @Get('company/:id')
  @ApiOperation({ summary: "Get company's interviews (COMPANY/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  findByCompany(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.findByCompany(id);
  }

  @Get('student/:id')
  @ApiOperation({ summary: "Get student's interviews (STUDENT/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.findByStudent(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interview details' })
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule interview (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async create(@Body() body: CreateInterviewDto) {
    return this.interviewService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update interview (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInterviewDto,
  ) {
    return this.interviewService.update(id, body);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark interview as completed (COMPANY/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  async complete(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.complete(id);
  }

  @Patch(':id/feedback')
  @ApiOperation({ summary: 'Add interview feedback (COMPANY/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  async addFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      rating?: number;
      strengths?: string;
      weaknesses?: string;
      feedback_notes?: string;
      final_decision?: string;
    },
  ) {
    return this.interviewService.addFeedback(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete interview (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.remove(id);
  }
}
