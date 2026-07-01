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
  @ApiOperation({ summary: 'Mahita applications rehetra (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.applicationService.findAll();
  }

  // ✅ alohan'ny :id
  @Get('student/:id')
  @ApiOperation({
    summary: "Mahita applications an'ny student (STUDENT/ADMIN)",
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findByStudent(id);
  }

  // ✅ alohan'ny :id
  @Get('offer/:id')
  @ApiOperation({ summary: "Mahita applications an'ny offer (COMPANY/ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  findByOffer(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findByOffer(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mahita application iray (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Mampiditra candidature (STUDENT)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT')
  async create(@Body() body: CreateApplicationDto) {
    return this.applicationService.create(body);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Manova status candidature (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateApplicationStatusDto,
  ) {
    return this.applicationService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mamafa candidature (STUDENT/ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.remove(id);
  }
}
