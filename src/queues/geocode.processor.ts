import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RequestsRepository } from 'src/shared/database/repositories/requests.repositories';
import { MapboxService } from 'src/shared/mapbox/mapbox.service';
import { CityGeoService } from 'src/shared/geo/city-geo.service';

@Processor('geocode')
export class GeocodeProcessor extends WorkerHost {
  constructor(
    private readonly requestsRepo: RequestsRepository,
    private readonly mapbox: MapboxService,
    private readonly cityGeo: CityGeoService,
  ) {
    super();
  }

  async process(job: Job<{ requestId: string; address: string }>) {
    const { requestId, address } = job.data;

    try {
      const geo = await this.mapbox.geocode(address);
      const insideCity = this.cityGeo.isInsideCity(geo.lng, geo.lat);

      await this.requestsRepo.update({
        where: { id: requestId },
        data: {
          latitude: geo.lat,
          longitude: geo.lng,
          addressFormatted: geo.formatted,
          geocodeStatus: 'DONE',
          geocodeProvider: 'MAPBOX',
          geocodeRelevance: geo.relevance ?? undefined,
          geocodedAt: new Date(),
          geocodeError: null,
          insideCity,
        },
      });

      console.log('Geocode processed for request:', requestId);

      return { ok: true };
    } catch (e: any) {
      await this.requestsRepo.update({
        where: { id: requestId },
        data: {
          geocodeStatus: 'FAILED',
          geocodeError: e?.message ?? 'Geocode failed',
        },
      });
      throw e;
    }
  }
}
