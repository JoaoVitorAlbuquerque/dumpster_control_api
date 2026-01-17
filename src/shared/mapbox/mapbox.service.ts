import { BadRequestException, Injectable } from '@nestjs/common';

type Feature = {
  id: string;
  place_name: string;
  relevance?: number;
  geometry: { coordinates: [number, number] }; // [lng, lat]
};

@Injectable()
export class MapboxService {
  async geocode(address: string) {
    const token = process.env.MAPBOX_TOKEN;
    if (!token) throw new Error('MAPBOX_TOKEN não configurado');

    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
      `?access_token=${token}&country=BR&limit=1&language=pt`;

    const res = await fetch(url);
    if (!res.ok) throw new BadRequestException(`Mapbox HTTP ${res.status}`);

    const data = await res.json();
    const f: Feature | undefined = data?.features?.[0];
    if (!f) throw new BadRequestException('Endereço não encontrado.');

    const [lng, lat] = f.geometry.coordinates;

    console.log('Mapbox geocode:', { address, lat, lng, featureId: f.id });

    return {
      lat,
      lng,
      formatted: f.place_name,
      featureId: f.id,
      relevance: f.relevance ?? null,
    };
  }
}
