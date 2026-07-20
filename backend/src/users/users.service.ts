import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

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
        status: true,
        last_login: true,
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
        student: {
          select: {
            id_student: true,
            university: true,
            photo_url: true,
          },
        },
        company: {
          select: {
            id_company: true,
            company_name: true,
            logo_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id_user: id },
      select: {
        id_user: true,
        nom: true,
        prenom: true,
        email: true,
        status: true,
        last_login: true,
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
        student: {
          select: {
            id_student: true,
            university: true,
            level: true,
            phone: true,
            address: true,
            photo_url: true,
            cv_url: true,
          },
        },
        company: {
          select: {
            id_company: true,
            company_name: true,
            sector: true,
            logo_url: true,
            website: true,
            is_verified: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id_user: id },
    });
    if (!existing) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== existing.email) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (dup) throw new ConflictException('Email already in use');
    }

    return this.prisma.user.update({
      where: { id_user: id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.prenom !== undefined && { prenom: dto.prenom }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      select: {
        id_user: true,
        nom: true,
        prenom: true,
        email: true,
        status: true,
        created_at: true,
      },
    });
  }

  async updateStatus(id: number, status: 'ACTIVE' | 'INACTIVE') {
    const user = await this.prisma.user.findUnique({
      where: { id_user: id },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id_user: id },
      data: { status },
      select: { id_user: true, status: true },
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id_user: id },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id_user: id } });
    return { message: 'User deleted' };
  }

  async resetPassword(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id_user: id },
    });
    if (!user) throw new NotFoundException('User not found');

    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hashed = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id_user: id },
      data: { password: hashed },
    });

    return { temporaryPassword: tempPassword };
  }

  async bulkUpdateStatus(userIds: number[], status: 'ACTIVE' | 'INACTIVE') {
    await this.prisma.user.updateMany({
      where: { id_user: { in: userIds } },
      data: { status },
    });
    return { updated: userIds.length };
  }

  async bulkRemove(userIds: number[]) {
    await this.prisma.user.deleteMany({
      where: { id_user: { in: userIds } },
    });
    return { deleted: userIds.length };
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

  async updateLastLogin(id: number) {
    return this.prisma.user.update({
      where: { id_user: id },
      data: { last_login: new Date() },
    });
  }
}
