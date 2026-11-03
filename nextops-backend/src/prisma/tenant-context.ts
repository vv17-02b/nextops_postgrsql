import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

interface TenantStore {
  companyId: string | null;
}

@Injectable()
export class TenantContext implements NestMiddleware {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  use(_request: Request, _response: Response, next: NextFunction): void {
    this.storage.run({ companyId: null }, next);
  }

  getCompanyId(): string | null {
    return this.storage.getStore()?.companyId ?? null;
  }

  setCompanyId(companyId: string): void {
    const store = this.storage.getStore();
    if (store) {
      store.companyId = companyId;
    }
  }
}
