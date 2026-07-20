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
import { OfferService } from './offer.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BulkOfferStatusDto, BulkOfferDeleteDto } from './dto/admin-offer.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OfferStatus } from '@prisma/client';

@ApiTags('Offers')
@Controller('offers')
export class OfferController {
  constructor(private offerService: OfferService) {}

  @Post(':id/categories')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manampy category amin'ny offer (ADMIN/COMPANY)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async addCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { id_category: number },
  ) {
    return this.offerService.addCategory(id, body.id_category);
  }

  @Delete(':id/categories/:id_category')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Mamafa category avy amin'ny offer (ADMIN/COMPANY)",
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async removeCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_category', ParseIntPipe) id_category: number,
  ) {
    return this.offerService.removeCategory(id, id_category);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahita offers rehetra (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAllAdmin() {
    return this.offerService.findAllAdmin();
  }

  @Post('admin/bulk/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update offer status (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async bulkStatus(@Body() dto: BulkOfferStatusDto) {
    return this.offerService.bulkUpdateStatus(dto.offerIds, dto.status);
  }

  @Post('admin/bulk/delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete offers (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async bulkDelete(@Body() dto: BulkOfferDeleteDto) {
    return this.offerService.bulkRemove(dto.offerIds);
  }

  @Patch('admin/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manova status offer (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: OfferStatus },
  ) {
    return this.offerService.updateStatus(id, body.status);
  }

  @Get()
  @ApiOperation({ summary: 'Mahita offers published rehetra' })
  async findAll() {
    return this.offerService.findAll();
  }

  @Get('company/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mahita offers an'ny company" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  async findByCompany(@Param('id', ParseIntPipe) id: number) {
    return this.offerService.findByCompany(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mahita offer iray' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.offerService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamorona offer vaovao (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async create(@Body() body: CreateOfferDto) {
    return this.offerService.create(body);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manova offer (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOfferDto,
  ) {
    return this.offerService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamafa offer (ADMIN/COMPANY)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'COMPANY')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.offerService.remove(id);
  }
}
