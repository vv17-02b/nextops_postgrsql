import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

interface TenantStore {
  companyId: string | null;
  bypassTenant: boolean;
}

@Injectable()
export class TenantContext implements NestMiddleware {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  use(_request: Request, _response: Response, next: NextFunction): void {
    this.storage.run({ companyId: null, bypassTenant: false }, next);
  }

  getCompanyId(): string | null {
    return this.storage.getStore()?.companyId ?? null;
  }

  setCompanyId(companyId: string): void {
    const store = this.storage.getStore();
    if (store) {
      store.companyId = companyId;
      return;
    }
    this.storage.enterWith({ companyId, bypassTenant: false });
  }

  runWithCompany<T>(companyId: string, fn: () => T): T {
    return this.storage.run({ companyId, bypassTenant: false }, fn);
  }

  isTenantBypassed(): boolean {
    return this.storage.getStore()?.bypassTenant === true;
  }

  runWithoutTenant<T>(fn: () => T): T {
    const currentCompanyId = this.getCompanyId();
    return this.storage.run(
      { companyId: currentCompanyId, bypassTenant: true },
      fn,
    );
  }
}
