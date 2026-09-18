import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import type { Warehouse } from '@prisma/client';

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    await this.prisma.$runCommandRaw({
      insert: 'Warehouse',
      documents: [
        {
          name: dto.name,
          location: dto.location,
          description: dto.description || null,
        }
      ]
    });

    return {
      id: 'new-warehouse',
      name: dto.name,
      location: dto.location,
      description: dto.description || null,
    } as unknown as Warehouse;
  }

  async findAll(): Promise<Warehouse[]> {
  
    const rawData = await this.prisma.$runCommandRaw({
      find: 'Warehouse',
    }) as any;

    if (!rawData || !rawData.cursor || !rawData.cursor.firstBatch) {
      return [];
    }

   
    return rawData.cursor.firstBatch.map((doc: any) => ({
      id: doc._id?.$oid || String(doc._id || ''),
      name: doc.name || doc.location || 'Без назви',
      location: doc.location || 'Локація не вказана',
      description: doc.description || null,
    })) as unknown as Warehouse[];
  }

  async findOne(id: string): Promise<Warehouse> {
    const list = await this.findAll();
    const item = list.find(w => w.id === id);
    if (!item) throw new NotFoundException(`Склад з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    // Для NoSQL гнучкості оновлюємо через сиру команду
    await this.prisma.$runCommandRaw({
      update: 'Warehouse',
      updates: [
        {
          q: { _id: { $oid: id } },
          u: { $set: { name: dto.name, location: dto.location, description: dto.description } },
        }
      ]
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<Warehouse> {
    const item = await this.findOne(id);
    
    // Видаляємо документ безпосередньо за його ObjectId
    await this.prisma.$runCommandRaw({
      delete: 'Warehouse',
      deletes: [
        {
          q: { _id: id.length === 24 ? { $oid: id } : id },
          limit: 1
        }
      ]
    });

    return item;
  }
}
