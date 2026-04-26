// Server-side service/addon lookup. The booking API uses this to compute pricing
// from trusted JSON, so the client cannot tamper with totals.

import fs from 'node:fs';
import path from 'node:path';

export type Service = {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
  description: string;
};

let _cache: { services: Map<string, Service>; addons: Map<string, Addon> } | null = null;

function load() {
  if (_cache) return _cache;
  const root = process.cwd();
  const services = JSON.parse(fs.readFileSync(path.join(root, 'content', 'services.json'), 'utf-8'));
  const addonsData = JSON.parse(fs.readFileSync(path.join(root, 'content', 'addons.json'), 'utf-8'));

  const serviceMap = new Map<string, Service>();
  for (const s of [...services.facials, ...services.waxing]) serviceMap.set(s.id, s);

  const addonMap = new Map<string, Addon>();
  for (const a of addonsData.addons) addonMap.set(a.id, a);

  _cache = { services: serviceMap, addons: addonMap };
  return _cache;
}

export function getService(id: string): Service | undefined {
  return load().services.get(id);
}

export function getAddon(id: string): Addon | undefined {
  return load().addons.get(id);
}

export type PriceCalc = {
  service: Service;
  addons: Addon[];
  totalCents: number;
  depositCents: number;
};

export function priceFor(serviceId: string, addonIds: string[]): PriceCalc | { error: string } {
  const service = getService(serviceId);
  if (!service) return { error: `Unknown service: ${serviceId}` };

  const addons: Addon[] = [];
  for (const id of addonIds) {
    const a = getAddon(id);
    if (!a) return { error: `Unknown add-on: ${id}` };
    addons.push(a);
  }

  const totalDollars = service.price + addons.reduce((s, a) => s + a.price, 0);
  const totalCents = Math.round(totalDollars * 100);
  // 50% deposit, rounded to whole cents.
  const depositCents = Math.round(totalCents / 2);

  return { service, addons, totalCents, depositCents };
}
