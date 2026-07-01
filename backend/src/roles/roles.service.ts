import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  create(name: string) {
    return this.prisma.role.create({
      data: { name },
    });
  }

  findAll() {
    return this.prisma.role.findMany();
  }

  findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async assignRole(userId: number, roleId: number) {
    const existing = await this.prisma.userRole.findFirst({
      where: {
        id_user: userId,
        id_role: roleId,
      },
    });

    if (existing) {
      return { message: 'Role already assigned' };
    }

    return this.prisma.userRole.create({
      data: {
        id_user: userId,
        id_role: roleId,
      },
    });
  }
}
