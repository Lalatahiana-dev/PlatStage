import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.skill.findMany({
      select: {
        id_skill: true,
        name: true,
      },
    });
  }

  async findOne(id_skill: number) {
    const skill = await this.prisma.skill.findUnique({
      where: { id_skill },
      select: {
        id_skill: true,
        name: true,
      },
    });

    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }

  async create(data: { name: string }) {
    return this.prisma.skill.create({ data });
  }

  async update(id_skill: number, data: { name: string }) {
    return this.prisma.skill.update({
      where: { id_skill },
      data,
    });
  }

  async remove(id_skill: number) {
    return this.prisma.skill.delete({
      where: { id_skill },
    });
  }
}
