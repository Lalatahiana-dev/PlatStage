import { Injectable, BadRequestException } from '@nestjs/common';
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

  // ✅ MANAMPY ITY — ho an'ny register, tsy azo assign ADMIN
  async assignDefaultRole(userId: number, roleName: string) {
    if (roleName === 'ADMIN') {
      throw new BadRequestException(
        'Cannot assign ADMIN role during registration',
      );
    }

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new BadRequestException(`Role ${roleName} not found`);
    }

    const existing = await this.prisma.userRole.findFirst({
      where: { id_user: userId, id_role: role.id_role },
    });

    if (existing) return existing;

    return this.prisma.userRole.create({
      data: { id_user: userId, id_role: role.id_role },
    });
  }
}
