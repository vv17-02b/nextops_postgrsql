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

// Суворий тип для безпечного парсингу ObjectId без type-casting до any
interface MongoOidWrapper {
  "\$oid": string;
}

// Кастомні Enterprise-інтерфейси для мапінгу динамічних полів No-Code форми
interface CreateWarehouseFormPayload {
  name?: string;
  location?: string;
  description?: string;
  productId?: string;
  quantity?: string | number;
}

interface UpdateWarehouseFormPayload {
  name?: string;
  location?: string;
  productId?: string;
  quantity?: string | number;
}

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
    
    // Безпечне приведення типів (Type-Safe Mapping) замість any
    const formInput = dto as unknown as CreateWarehouseFormPayload;
    
    // Адаптуємо поля "name" та "description" з форми під структуру Warehouse
    const warehouseDoc = {
      productId: formInput.productId || 'unknown-product',
      location: formInput.location || formInput.name || 'Локація не вказана',
      quantity: Number(formInput.quantity || 100),
      updatedAt: new Date(),
    };

    await runCommand({
      insert: 'Warehouse',
      documents: [warehouseDoc]
    });

    // Знаходимо створений елемент через findAll, щоб оминути потенційний збій findFirst
    const list = await this.findAll();
    const item = list.find(w => w.location === warehouseDoc.location);

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

    return rawData.cursor.firstBatch.map((doc: MongoBatchDoc): Warehouse => {
      const rawId = doc._id;
      let cleanId = '';

      if (typeof rawId === 'object' && rawId !== null && Object.prototype.hasOwnProperty.call(rawId, '\$oid')) {
        cleanId = (rawId as MongoOidWrapper)["\$oid"];
      } else {
        cleanId = String(rawId || '');
      }

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
    if (!item) {
      throw new NotFoundException(`Запис складу з ID ${id} не знайдено`);
    }
    return item;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const runCommand = this.prisma['\$runCommandRaw'].bind(this.prisma);
    const formUpdate = dto as unknown as UpdateWarehouseFormPayload;

    await runCommand({
      update: 'Warehouse',
      updates: [
        {
          q: id.length === 24 ? { _id: { "\$oid": id } } : { _id: id },
          u: { 
            "\$set": { 
              location: dto.location,
              productId: formUpdate.productId || 'unknown-product',
              quantity: Number(formUpdate.quantity || 0),
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
