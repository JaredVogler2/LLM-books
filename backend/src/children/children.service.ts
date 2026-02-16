import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateChildDto) {
    return this.prisma.childProfile.create({
      data: { ...dto, userId },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.childProfile.findMany({
      where: { userId },
      include: { characterProfiles: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const child = await this.prisma.childProfile.findUnique({
      where: { id },
      include: { characterProfiles: true },
    });
    if (!child) throw new NotFoundException('Child profile not found');
    return child;
  }

  async update(id: string, userId: string, dto: UpdateChildDto) {
    await this.verifyOwnership(id, userId);
    return this.prisma.childProfile.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.verifyOwnership(id, userId);
    return this.prisma.childProfile.delete({ where: { id } });
  }

  private async verifyOwnership(id: string, userId: string) {
    const child = await this.prisma.childProfile.findFirst({
      where: { id, userId },
    });
    if (!child) throw new NotFoundException('Child profile not found');
    return child;
  }
}
