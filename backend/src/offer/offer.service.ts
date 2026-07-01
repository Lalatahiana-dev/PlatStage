import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus } from '@prisma/client';

@Injectable()
export class OfferService {
  constructor(private prisma: PrismaService) {}
  async addCategory(id_offer: number, id_category: number) {
    return this.prisma.offerCategory.create({
      data: { id_offer, id_category },
    });
  }

  async removeCategory(id_offer: number, id_category: number) {
    return this.prisma.offerCategory.deleteMany({
      where: { id_offer, id_category },
    });
  }
  async findAll() {
    return this.prisma.offer.findMany({
      where: { status: OfferStatus.PUBLISHED },
      select: {
        id_offer: true,
        title: true,
        description: true,
        requirements: true,
        location: true,
        salary: true,
        deadline: true,
        status: true,
        created_at: true,
        updated_at: true,
        company: {
          select: {
            id_company: true,
            company_name: true,
            logo_url: true,
            sector: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id_category: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id_offer: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { id_offer },
      select: {
        id_offer: true,
        title: true,
        description: true,
        requirements: true,
        location: true,
        salary: true,
        deadline: true,
        status: true,
        created_at: true,
        updated_at: true,
        company: {
          select: {
            id_company: true,
            company_name: true,
            logo_url: true,
            sector: true,
            website: true,
            address: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id_category: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async create(data: {
    title: string;
    description: string;
    requirements?: string;
    location?: string;
    salary?: number;
    deadline?: Date;
    id_company: number;
  }) {
    return this.prisma.offer.create({ data });
  }

  async update(
    id_offer: number,
    data: {
      title?: string;
      description?: string;
      requirements?: string;
      location?: string;
      salary?: number;
      deadline?: Date;
      status?: OfferStatus;
    },
  ) {
    return this.prisma.offer.update({
      where: { id_offer },
      data,
    });
  }

  async remove(id_offer: number) {
    return this.prisma.offer.delete({
      where: { id_offer },
    });
  }
}
