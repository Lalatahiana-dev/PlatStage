import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id_user: true,
        nom: true,
        prenom: true,
        email: true,
        created_at: true,
        updated_at: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
  }) {
    const user = await this.prisma.user.create({ data });

    const roleUser = await this.prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (roleUser) {
      await this.prisma.userRole.create({
        data: {
          id_user: user.id_user,
          id_role: roleUser.id_role,
        },
      });
    }

    // ✅ Averina miaraka amin'ny roles
    return this.prisma.user.findUniqueOrThrow({
      where: { id_user: user.id_user },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async assignRole(id_user: number, id_role: number) {
    return this.prisma.userRole.create({
      data: { id_user, id_role },
    });
  }
}
