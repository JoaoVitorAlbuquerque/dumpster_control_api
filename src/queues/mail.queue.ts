import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailQueue {
  constructor(@InjectQueue('mail') private queue: Queue) {}

  sendPasswordResetEmail(data: { to: string; name: string; link: string }) {
    console.log('Enviando email de redefinição de senha para', data.to);

    return this.queue.add('password-reset', data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  sendWelcomeEmail(data: { to: string; name: string }) {
    return this.queue.add('welcome', data, { attempts: 3 });
  }
}
