// Prep-sheet mapping data + helpers. Drives the four checklist sections
// (Room Setup, Equipment, Products, Disposables) and the Treatment Order quick
// reference shown on /admin/prep/[id].
//
// Products and Protocols are now editable through the admin dashboard and live
// in content_blocks (with on-disk fallbacks in content/products.json and
// content/protocols.json). Room setup, equipment, and disposables remain in
// code — they're operational and rarely change.

export type FacialId = 'signature' | 'hydralux' | 'liquidfacelift' | 'lumin';
export type AddonId =
  | 'dermaplaning'
  | 'nuface'
  | 'led'
  | 'guasha'
  | 'serum'
  | 'eye'
  | 'lip'
  | 'collagen';
export type WaxingId = 'wax-lip' | 'wax-brow' | 'wax-combo';
export type ServiceId = FacialId | WaxingId;

const FACIAL_IDS: ReadonlySet<string> = new Set([
  'signature',
  'hydralux',
  'liquidfacelift',
  'lumin',
]);
const WAXING_IDS: ReadonlySet<string> = new Set(['wax-lip', 'wax-brow', 'wax-combo']);

export function isFacial(id: string): id is FacialId {
  return FACIAL_IDS.has(id);
}
export function isWaxing(id: string): id is WaxingId {
  return WAXING_IDS.has(id);
}

export type Brand =
  | 'dermalogica'
  | 'image'
  | 'esthemax'
  | 'biodance'
  | 'cosdebaha'
  | 'laneige'
  | 'generic';

export const BRAND_KEYS: readonly Brand[] = [
  'dermalogica',
  'image',
  'esthemax',
  'biodance',
  'cosdebaha',
  'laneige',
  'generic',
];

export const BRAND_LABEL: Record<Brand, string> = {
  dermalogica: 'Dermalogica',
  image: 'IMAGE',
  esthemax: 'Esthemax',
  biodance: 'Biodance',
  cosdebaha: 'Cos De BAHA',
  laneige: 'Laneige',
  generic: '',
};

export type Trigger =
  | { service: ServiceId }
  | { addon: AddonId }
  | { service?: string }
  | { addon?: string }
  | { anyFacial: true }
  | { anyWaxing: true }
  | { anyBrowWax: true };

export type ChecklistItem = {
  id: string;
  label: string;
  qty?: string;
  brand?: Brand;
  triggers: Trigger[];
};

// ── Section 1: Room Setup (in-code; not Paulina-editable in v1) ─────────────
export const ROOM_SETUP: ChecklistItem[] = [
  {
    id: 'room-sheet',
    label: 'Fresh bed sheet + face cradle cover',
    triggers: [{ anyFacial: true }, { anyWaxing: true }],
  },
  {
    id: 'room-blanket',
    label: 'Blanket for client',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'room-water',
    label: 'Water / tea for client',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'room-music',
    label: 'Music / ambiance on',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'room-intake',
    label: 'Intake form reviewed',
    triggers: [{ anyFacial: true }, { anyWaxing: true }],
  },
  {
    id: 'room-gloves',
    label: 'Hands washed + gloves ready',
    triggers: [{ anyFacial: true }, { addon: 'dermaplaning' }, { anyWaxing: true }],
  },
];

// ── Section 2: Equipment (in-code) ──────────────────────────────────────────
export const EQUIPMENT: ChecklistItem[] = [
  {
    id: 'eq-nuface',
    label: 'NuFace microcurrent device',
    triggers: [{ service: 'liquidfacelift' }, { addon: 'nuface' }],
  },
  {
    id: 'eq-therabody',
    label: 'Therabody LED mask',
    triggers: [{ service: 'lumin' }, { addon: 'led' }],
  },
  {
    id: 'eq-medicube',
    label: 'Medicube Booster Pro',
    triggers: [{ addon: 'serum' }],
  },
  {
    id: 'eq-guasha',
    label: 'Gua sha stone',
    triggers: [{ addon: 'guasha' }],
  },
  {
    id: 'eq-maglamp',
    label: 'Mag lamp',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'eq-extractors',
    label: 'Comedone extractors',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'eq-dermaplane',
    label: 'Dermaplaning handle + blade',
    triggers: [{ addon: 'dermaplaning' }],
  },
  {
    id: 'eq-waxwarmer',
    label: 'Wax warmer',
    triggers: [{ anyWaxing: true }],
  },
  {
    id: 'eq-tweezers',
    label: 'Tweezers',
    triggers: [{ anyBrowWax: true }],
  },
  {
    id: 'eq-browmap',
    label: 'Brow mapping pencil',
    triggers: [{ anyBrowWax: true }],
  },
];

// ── Section 4: Disposables (in-code) ────────────────────────────────────────
export const DISPOSABLES: ChecklistItem[] = [
  {
    id: 'd-fan-brush',
    label: 'Fan brush',
    qty: '×1–2',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'd-mixing-bowl',
    label: 'Mixing bowl + spatula',
    qty: '×1',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'd-esthetic-wipes',
    label: 'Esthetic wipes 4×4',
    qty: '×4–5',
    triggers: [{ anyFacial: true }, { addon: 'dermaplaning' }, { anyWaxing: true }],
  },
  {
    id: 'd-face-towels',
    label: 'Face towels',
    qty: '×3–4',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'd-spa-headband',
    label: 'Spa headband',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'd-spa-wrap',
    label: 'Spa wrap',
    triggers: [{ anyFacial: true }],
  },
  {
    id: 'd-safety-glasses',
    label: 'Safety glasses (client)',
    triggers: [{ service: 'lumin' }, { addon: 'led' }],
  },
  {
    id: 'd-dermaplane-blade',
    label: 'Dermaplaning blade (new)',
    qty: '×1',
    triggers: [{ addon: 'dermaplaning' }],
  },
  {
    id: 'd-wax-spatula',
    label: 'Wax spatula (small)',
    qty: '×1–2',
    triggers: [{ anyWaxing: true }],
  },
];

// ── Editable types: Product + Protocol ──────────────────────────────────────
// Persisted as JSON in content_blocks (admin-editable via /admin/dashboard) or
// the on-disk fallback in content/products.json + content/protocols.json.

export type Product = {
  id: string;
  label: string;
  brand?: Brand;
  triggers: Trigger[];
};

export type ProductsPayload = { products: Product[] };

export type ProtocolStep = {
  id: string;
  action: string;        // free-text label; may be empty when the step is just a product
  productIds: string[];  // 0+ refs into the products list
  combinator: 'or' | '+';// joiner when multiple products
  suffix: string;        // optional free-text after products: "(10–15 min)", etc.
};

export type ProtocolsPayload = {
  protocols: Record<string, ProtocolStep[]>;
};

// ── Selection / rendering helpers ───────────────────────────────────────────
function triggerMatches(
  trigger: Trigger,
  serviceId: string,
  addonIds: string[],
): boolean {
  if ('service' in trigger && trigger.service) return trigger.service === serviceId;
  if ('addon' in trigger && trigger.addon) return addonIds.includes(trigger.addon);
  if ('anyFacial' in trigger && trigger.anyFacial) return isFacial(serviceId);
  if ('anyWaxing' in trigger && trigger.anyWaxing) return isWaxing(serviceId);
  if ('anyBrowWax' in trigger && trigger.anyBrowWax) {
    return serviceId === 'wax-brow' || serviceId === 'wax-combo';
  }
  return false;
}

export function selectItems<T extends { triggers: Trigger[] }>(
  items: T[],
  serviceId: string,
  addonIds: string[],
): T[] {
  return items.filter((item) =>
    item.triggers.some((t) => triggerMatches(t, serviceId, addonIds)),
  );
}

export function protocolFor(
  protocols: Record<string, ProtocolStep[]>,
  serviceId: string,
): ProtocolStep[] | null {
  if (!isFacial(serviceId)) return null;
  return protocols[serviceId] ?? null;
}

// Render a structured step into a single display string. Products are looked
// up by id; unknown ids fall back to the literal id so a dangling reference
// is visible rather than silent.
export function renderStep(
  step: ProtocolStep,
  productsById: Map<string, Product>,
): string {
  const productNames = step.productIds.map(
    (id) => productsById.get(id)?.label ?? id,
  );
  const joined =
    productNames.length === 0
      ? ''
      : productNames.length === 1
        ? productNames[0]
        : productNames.join(` ${step.combinator} `);

  // Empty-action edge case: the step is just a product (e.g. "Post Extraction Solution").
  const head = step.action.trim();
  let text: string;
  if (head && joined) text = `${head} — ${joined}`;
  else if (head) text = head;
  else if (joined) text = joined;
  else text = '';

  const suffix = step.suffix.trim();
  return suffix ? `${text} ${suffix}`.trim() : text;
}

// Helper to build the products-by-id map once per render.
export function indexProducts(products: Product[]): Map<string, Product> {
  const m = new Map<string, Product>();
  for (const p of products) m.set(p.id, p);
  return m;
}
