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
  @ApiOperation({ summary: 'Mahita interviews rehetra (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.interviewService.findAll();
  }

  // ✅ MANAMPY ITY — alohan'ny :id mba tsy hifangaro
  @Get('application/:id')
  @ApiOperation({ summary: "Mahita interview an'ny application" })
  @UseGuards(AuthGuard('jwt'))
  findByApplication(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.findByApplication(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mahita interview iray' })
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Mamorona interview (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async create(@Body() body: CreateInterviewDto) {
    return this.interviewService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Manova interview (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInterviewDto,
  ) {
    return this.interviewService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mamafa interview (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.interviewService.remove(id);
  }
}
