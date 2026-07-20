import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manao ny paramètres rehetra (ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.settingsService.findAll();
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manova ny paramètres (ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async update(@Body() body: UpdateSettingsDto) {
    return this.settingsService.update(body);
  }

  @Get('system')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fafao ny fampahalalana systeme (ADMIN)" })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getSystemInfo() {
    return this.settingsService.getSystemInfo();
  }
}
