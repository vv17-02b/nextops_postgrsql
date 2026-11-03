import { Controller, Get, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error: unknown) {
      this.logger.error(
        'Database readiness check failed.',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException('Database is unavailable');
    }

    return { status: 'ok' };
  }
}
