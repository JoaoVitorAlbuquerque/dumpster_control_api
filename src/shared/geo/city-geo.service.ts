import { Injectable } from '@nestjs/common';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CityGeoService {
  private polygons: any[] = [];

  constructor() {
    const geoPath = path.join(
      process.cwd(),
      'src',
      'shared',
      'geo',
      'city.geojson',
    );
    const geojson = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));

    if (
      geojson?.type === 'FeatureCollection' &&
      Array.isArray(geojson.features)
    ) {
      this.polygons = geojson.features.filter(
        (f: any) =>
          f?.type === 'Feature' &&
          f?.geometry &&
          (f.geometry.type === 'Polygon' ||
            f.geometry.type === 'MultiPolygon') &&
          Array.isArray(f.geometry.coordinates),
      );
    } else if (geojson?.type === 'Feature') {
      this.polygons = [geojson];
    } else if (
      geojson?.type === 'Polygon' ||
      geojson?.type === 'MultiPolygon'
    ) {
      this.polygons = [{ type: 'Feature', properties: {}, geometry: geojson }];
    }

    console.log('[CityGeoService] polygons loaded:', this.polygons.length);
  }

  // turf usa [lng, lat]
  isInsideCity(lng: number, lat: number): boolean {
    const pt = point([lng, lat]);

    for (const poly of this.polygons) {
      if (booleanPointInPolygon(pt, poly)) return true;
    }
    return false;
  }
}
