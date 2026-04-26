// Server-side service/addon lookup. The booking API uses this to compute pricing
// from trusted content, so the client cannot tamper with totals.

import { getContent } from './content-store';

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

type ServicesPayload = { facials: Service[]; waxing: Service[] };
type AddonsPayload = { addons: Addon[] };

async function loadMaps(): Promise<{
  services: Map<string, Service>;
  addons: Map<string, Addon>;
}> {
  const [services, addonsData] = await Promise.all([
    getContent<ServicesPayload>('services'),
    getContent<AddonsPayload>('addons'),
  ]);

  const serviceMap = new Map<string, Service>();
  for (const s of [...services.facials, ...services.waxing]) serviceMap.set(s.id, s);

  const addonMap = new Map<string, Addon>();
  for (const a of addonsData.addons) addonMap.set(a.id, a);

  return { services: serviceMap, addons: addonMap };
}

export type PriceCalc = {
  service: Service;
  addons: Addon[];
  totalCents: number;
  depositCents: number;
};

export async function priceFor(
  serviceId: string,
  addonIds: string[],
): Promise<PriceCalc | { error: string }> {
  const { services, addons: addonMap } = await loadMaps();

  const service = services.get(serviceId);
  if (!service) return { error: `Unknown service: ${serviceId}` };

  const addons: Addon[] = [];
  for (const id of addonIds) {
    const a = addonMap.get(id);
    if (!a) return { error: `Unknown add-on: ${id}` };
    addons.push(a);
  }

  const totalDollars = service.price + addons.reduce((s, a) => s + a.price, 0);
  const totalCents = Math.round(totalDollars * 100);
  // 50% deposit, rounded to whole cents.
  const depositCents = Math.round(totalCents / 2);

  return { service, addons, totalCents, depositCents };
}

export async function getService(id: string): Promise<Service | undefined> {
  const { services } = await loadMaps();
  return services.get(id);
}
