import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class GeocodeQueue {
  constructor(@InjectQueue('geocode') private readonly queue: Queue) {}

  enqueue(requestId: string, address: string) {
    return this.queue.add(
      'geocode-request',
      { requestId, address },
      { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
    );
  }
}
