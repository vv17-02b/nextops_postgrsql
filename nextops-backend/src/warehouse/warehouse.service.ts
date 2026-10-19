import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import type { Warehouse } from '@prisma/client';

interface MongoBatchDoc {
  _id?: { "\$oid": string } | string;
  productId?: string;
  location?: string;
  quantity?: number;
  updatedAt?: string | Date;
}

interface MongoCursor {
  firstBatch: MongoBatchDoc[];
}

interface MongoRawResult {
  cursor?: MongoCursor;
}

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
    
    // Створюємо документ, що повністю відповідає товарній схемі складу
    const warehouseDoc = {
      productId: (dto as any).productId || 'unknown-product',
      location: dto.location,
      quantity: Number((dto as any).quantity || 0),
      updatedAt: new Date(),
    };

    await runCommand({
      insert: 'Warehouse',
      documents: [warehouseDoc]
    });

    // Надійно знаходимо створений елемент через офіційний Prisma Client
    const item = await this.prisma.warehouse.findFirst({
      where: { location: dto.location, productId: warehouseDoc.productId },
    });

    if (!item) {
      throw new NotFoundException('Помилка ініціалізації залишків на складі в MongoDB Atlas');
    }

    return item;
  }

  async findAll(): Promise<Warehouse[]> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
  
    const rawData = await runCommand({
      find: 'Warehouse',
    }) as unknown as MongoRawResult;

    if (!rawData || !rawData.cursor || !rawData.cursor.firstBatch) {
      return [];
    }

    // Відображаємо дані у сувору структуру Warehouse моделі Prisma
    return rawData.cursor.firstBatch.map((doc: MongoBatchDoc) => {
      const rawId = doc._id;
      const cleanId = typeof rawId === 'object' && rawId ? (rawId as any)['\$oid'] : String(rawId || '');

      return {
        id: cleanId,
        productId: doc.productId || 'unknown-product',
        location: doc.location || 'Локація не вказана',
        quantity: Number(doc.quantity || 0),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      };
    });
  }

  async findOne(id: string): Promise<Warehouse> {
    const list = await this.findAll();
    const item = list.find(w => w.id === id);
    if (!item) throw new NotFoundException(`Запис складу з ID ${id} не знайдено`);
    return item;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);

    await runCommand({
      update: 'Warehouse',
      updates: [
        {
          q: id.length === 24 ? { _id: { "\$oid": id } } : { _id: id },
          u: { 
            "\$set": { 
              location: dto.location,
              productId: (dto as any).productId,
              quantity: Number((dto as any).quantity || 0),
              updatedAt: new Date()
            } 
          },
        }
      ]
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<Warehouse> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
    const item = await this.findOne(id);
    
    await runCommand({
      delete: 'Warehouse',
      deletes: [
        {
          q: id.length === 24 ? { _id: { "\$oid": id } } : { _id: id },
          limit: 1
        }
      ]
    });

    return item;
  }
}
