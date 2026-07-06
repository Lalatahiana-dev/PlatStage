import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.studentProfile.findMany({
      select: {
        id_student: true,
        phone: true,
        university: true,
        level: true,
        cv_url: true,
        address: true,
        photo_url: true,
        user: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });
  }
  async findByUser(id_user: number) {
    return this.prisma.studentProfile.findUnique({
      where: { id_user },
      select: {
        id_student: true,
        phone: true,
        university: true,
        level: true,
        cv_url: true,
        address: true,
        photo_url: true,
        user: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                id_skill: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
  async findOne(id_student: number) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id_student },
      select: {
        id_student: true,
        phone: true,
        university: true,
        level: true,
        cv_url: true,
        address: true,
        photo_url: true,
        user: {
          select: {
            id_user: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                id_skill: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(data: {
    phone?: string;
    university?: string;
    level?: string;
    address?: string;
    id_user: number;
  }) {
    return this.prisma.studentProfile.create({
      data,
    });
  }

  async update(
    id_student: number,
    data: {
      phone?: string;
      university?: string;
      level?: string;
      address?: string;
      photo_url?: string;
      cv_url?: string;
    },
  ) {
    return this.prisma.studentProfile.update({
      where: { id_student },
      data,
    });
  }

  async remove(id_student: number) {
    return this.prisma.studentProfile.delete({
      where: { id_student },
    });
  }
  //Relation etudient skill
  async addSkill(id_student: number, id_skill: number) {
    return this.prisma.studentSkill.create({
      data: { id_student, id_skill },
    });
  }

  async removeSkill(id_student: number, id_skill: number) {
    return this.prisma.studentSkill.deleteMany({
      where: { id_student, id_skill },
    });
  }
}
