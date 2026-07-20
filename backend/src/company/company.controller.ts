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
import { CompanyService } from './company.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  VerifyDto,
  UpdateCompanyStatusDto,
  BulkVerifyDto,
  BulkCompanyStatusDto,
  BulkCompanyDeleteDto,
} from './dto/admin-action.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Mahita companies rehetra' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get('user/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahita company arakaraka ny id_user' })
  @UseGuards(AuthGuard('jwt'))
  findByUser(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findByUser(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mahita company iray' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamorona company vaovao (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  create(@Body() body: CreateCompanyDto) {
    return this.companyService.create(body);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manova company (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, body);
  }

  @Patch(':id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify or unverify a company (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyDto,
  ) {
    return this.companyService.verify(id, dto.is_verified);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate or suspend a company (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.companyService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamafa company (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.delete(id);
  }

  @Post('bulk/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk verify/unverify companies (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  bulkVerify(@Body() dto: BulkVerifyDto) {
    return this.companyService.bulkVerify(dto.companyIds, dto.is_verified);
  }

  @Post('bulk/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk activate/suspend companies (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  bulkStatus(@Body() dto: BulkCompanyStatusDto) {
    return this.companyService.bulkUpdateStatus(
      dto.companyIds,
      dto.status,
    );
  }

  @Post('bulk/delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete companies (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  bulkDelete(@Body() dto: BulkCompanyDeleteDto) {
    return this.companyService.bulkRemove(dto.companyIds);
  }
}
