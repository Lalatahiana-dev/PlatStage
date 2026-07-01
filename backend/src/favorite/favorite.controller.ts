import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('favorites')
export class FavoriteController {
  constructor(private favoriteService: FavoriteService) {}

  @Get('student/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN') // ✅
  async findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.favoriteService.findByStudent(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT') // ✅ STUDENT ihany
  async add(@Body() body: { id_student: number; id_offer: number }) {
    return this.favoriteService.add(body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('STUDENT', 'ADMIN') // ✅
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.favoriteService.remove(id);
  }
}
