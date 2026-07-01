import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async findByStudent(id_student: number) {
    return this.prisma.favorite.findMany({
      where: { id_student },
      select: {
        id_favorite: true,
        created_at: true,
        offer: {
          select: {
            id_offer: true,
            title: true,
            location: true,
            salary: true,
            deadline: true,
            status: true,
            company: {
              select: {
                company_name: true,
                logo_url: true,
                sector: true,
              },
            },
          },
        },
      },
    });
  }

  async add(data: { id_student: number; id_offer: number }) {
    return this.prisma.favorite.create({
      data,
    });
  }

  async remove(id_favorite: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id_favorite },
    });

    if (!favorite) throw new NotFoundException('Favorite not found');

    return this.prisma.favorite.delete({
      where: { id_favorite },
    });
  }
}
