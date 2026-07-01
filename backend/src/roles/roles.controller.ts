import { Controller, Get, Post, Body } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.rolesService.create(name);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }
  @Post('assign')
  assignRole(@Body() body: { id_user: number; id_role: number }) {
    return this.rolesService.assignRole(body.id_user, body.id_role);
  }
}
