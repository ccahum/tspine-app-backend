import { Global, Module } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { TraceCorrelationId } from './trace.correlation.id';

export const ALS_TOKEN = 'ASYNC_LOCAL_STORAGE';

@Global()
@Module({
  providers: [
    {
      provide: ALS_TOKEN,
      useValue: new AsyncLocalStorage<TraceCorrelationId>(),
    },
  ],
  exports: [ALS_TOKEN],
})
export class CustomAsyncLocalStorage {}
