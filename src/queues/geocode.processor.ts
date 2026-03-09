import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RequestsRepository } from 'src/shared/database/repositories/requests.repositories';
import { MapboxService } from 'src/shared/mapbox/mapbox.service';
import { CityGeoService } from 'src/shared/geo/city-geo.service';
import { endOfYear, startOfYear } from 'date-fns';
import { MailQueue } from './mail.queue';

@Processor('geocode')
export class GeocodeProcessor extends WorkerHost {
  constructor(
    private readonly requestsRepo: RequestsRepository,
    private readonly mapbox: MapboxService,
    private readonly cityGeo: CityGeoService,
    private mailQueue: MailQueue,
  ) {
    super();
  }

  async process(job: Job<{ requestId: string; address: string }>) {
    const { requestId, address } = job.data;

    try {
      const geo = await this.mapbox.geocode(address);
      const insideCity = this.cityGeo.isInsideCity(geo.lng, geo.lat);

      const updatedRequest = await this.requestsRepo.update({
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

      if (updatedRequest.addressFormatted) {
        this.checkAbuseAndAlert(
          updatedRequest.cpf,
          updatedRequest.addressFormatted,
        ).catch((err) => {
          console.error(
            `Falha no envio do alerta de abuso (Request ${requestId}):`,
            err,
          );
        });
      }

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

  private async checkAbuseAndAlert(cpf: string, addressFormatted: string) {
    const start = startOfYear(new Date());
    const end = endOfYear(new Date());

    const [cpfCount, addressCount] = await Promise.all([
      this.requestsRepo.count({
        where: {
          cpf,
          orderDate: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] },
        },
      }),
      this.requestsRepo.count({
        where: {
          addressFormatted,
          orderDate: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] },
        },
      }),
    ]);

    const alertReasons = [];
    if (cpfCount >= 6)
      alertReasons.push(
        `O CPF <b>${cpf}</b> atingiu ${cpfCount} solicitações neste ano (limite: 6).`,
      );
    if (addressCount >= 4)
      alertReasons.push(
        `O endereço <b>${addressFormatted}</b> recebeu ${addressCount} caçambas neste ano (limite: 4).`,
      );

    if (alertReasons.length > 0) {
      // await this.resend.emails.send({
      //   from: 'sistema@suaprefeitura.gov.br',
      //   to: 'admin_fiscalizacao@suaprefeitura.gov.br',
      //   subject: '⚠️ ALERTA: Abuso de Solicitação de Caçamba',
      //   html: `<ul>${alertReasons.map((r) => `<li>${r}</li>`).join('')}</ul>`,
      // });
      await this.mailQueue.sendAlertAbuseRequestEmail({
        alertReasons,
      });
    }
  } // Será removido quando o módulo de alerta for implementado
}
