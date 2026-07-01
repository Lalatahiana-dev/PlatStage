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
import { OfferService } from './offer.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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

  @Get()
  @ApiOperation({ summary: 'Mahita offers published rehetra' })
  async findAll() {
    return this.offerService.findAll();
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
