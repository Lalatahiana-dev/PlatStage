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
      orderBy: { created_at: 'desc' },
    });
  }

  async findOfferIdsByStudent(id_student: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: { id_student },
      select: { id_offer: true },
    });
    return favorites.map((f) => f.id_offer);
  }

  async add(data: { id_student: number; id_offer: number }) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        id_student_id_offer: {
          id_student: data.id_student,
          id_offer: data.id_offer,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.favorite.create({ data });
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
