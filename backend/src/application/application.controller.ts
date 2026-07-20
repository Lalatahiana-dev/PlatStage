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
import { ApplicationService } from './application.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all applications (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.applicationService.findAll();
  }

  @Get('student/:id')
  @ApiOperation({ summary: "Get student's applications (STUDENT/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findByStudent(id);
  }

  @Get('offer/:id')
  @ApiOperation({ summary: "Get applications for an offer (COMPANY/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  findByOffer(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findByOffer(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submit application (STUDENT)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT')
  async create(@Body() body: CreateApplicationDto) {
    return this.applicationService.create(body);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update application status (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateApplicationStatusDto,
  ) {
    return this.applicationService.updateStatus(id, body.status);
  }

  @Patch(':id/notes')
  @ApiOperation({ summary: 'Update application notes (COMPANY/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  async updateNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { notes: string },
  ) {
    return this.applicationService.updateNotes(id, body.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application (STUDENT/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.remove(id);
  }
}
