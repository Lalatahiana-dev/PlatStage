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
import { SkillService } from './skill.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Skills')
@Controller('skills')
export class SkillController {
  constructor(private skillService: SkillService) {}

  @Get()
  @ApiOperation({ summary: 'Mahita skills rehetra' })
  async findAll() {
    return this.skillService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mahita skill iray' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamorona skill vaovao (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: CreateSkillDto) {
    return this.skillService.create(body);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manova skill (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateSkillDto,
  ) {
    return this.skillService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mamafa skill (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.remove(id);
  }
}
