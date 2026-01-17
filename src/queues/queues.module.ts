import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.processor';
import { MailQueue } from './mail.queue';
import { GeocodeQueue } from './geocode.queue';
import { GeocodeProcessor } from './geocode.processor';
import { MapboxService } from 'src/shared/mapbox/mapbox.service';
import { CityGeoService } from 'src/shared/geo/city-geo.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    // registra as filas
    BullModule.registerQueue({ name: 'mail' }),
    BullModule.registerQueue({ name: 'geocode' }),
  ],
  providers: [
    MailProcessor,
    MailQueue,
    GeocodeQueue,
    GeocodeProcessor,
    MapboxService,
    CityGeoService,
  ],
  exports: [MailQueue, GeocodeQueue],
})
export class QueuesModule {}
