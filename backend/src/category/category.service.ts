import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      select: {
        id_category: true,
        name: true,
        description: true,
      },
    });
  }

  async findOne(id_category: number) {
    const category = await this.prisma.category.findUnique({
      where: { id_category },
      select: {
        id_category: true,
        name: true,
        description: true,
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.category.create({ data });
  }

  async update(
    id_category: number,
    data: { name?: string; description?: string },
  ) {
    return this.prisma.category.update({
      where: { id_category },
      data,
    });
  }

  async remove(id_category: number) {
    return this.prisma.category.delete({
      where: { id_category },
    });
  }
}
