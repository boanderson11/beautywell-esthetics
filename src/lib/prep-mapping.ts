// Prep-sheet mapping data. Drives the four checklist sections (Room Setup,
// Equipment, Products, Disposables) and the Treatment Order quick reference
// shown on /admin/prep/[id]. Pure data + a small selector — nothing reactive.
//
// The brief was written with a fresh-install set of service IDs (`led`,
// `microcurrent`, `ledboost`, `seruminfusion`, `eyerescue`, `liprenewal`,
// `collagenmask`, `waxlip`, etc.). The live `content/services.json` and
// `content/addons.json` use a different set: `lumin`, `nuface`, `led`,
// `serum`, `eye`, `lip`, `collagen`, `wax-lip`, `wax-brow`, `wax-combo`.
// Everything below uses the live IDs.

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

export type Trigger =
  | { service: ServiceId }
  | { addon: AddonId }
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

export type ProtocolStep = { n: number; text: string };

// ── Section 1: Room Setup ───────────────────────────────────────────────────
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

// ── Section 2: Equipment ────────────────────────────────────────────────────
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

// ── Section 3: Products ─────────────────────────────────────────────────────
// Each product appears if ANY of its trigger services/add-ons are in the booking.
// Brand badges are intentionally surfaced here — this is a back-of-house tool,
// never seen by clients.
export const PRODUCTS: ChecklistItem[] = [
  // Cleansers
  {
    id: 'p-precleanse',
    label: 'PreCleanse Balm',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }, { service: 'hydralux' }, { service: 'lumin' }],
  },
  {
    id: 'p-special-cleansing-gel',
    label: 'Special Cleansing Gel',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }, { service: 'lumin' }],
  },
  {
    id: 'p-intensive-moisture-cleanser',
    label: 'Intensive Moisture Cleanser',
    brand: 'dermalogica',
    triggers: [{ service: 'hydralux' }],
  },
  {
    id: 'p-vital-c-cleanser',
    label: 'Vital C Hydrating Cleanser',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },
  {
    id: 'p-ormedic-cleanser',
    label: 'Ormedic Balancing Cleanser',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },

  // Toner / serum-toner hybrids
  {
    id: 'p-pro-multi-active-toner',
    label: 'PRO Multi-Active Toner',
    brand: 'dermalogica',
    triggers: [
      { service: 'signature' },
      { service: 'hydralux' },
      { service: 'lumin' },
      { addon: 'dermaplaning' },
    ],
  },
  {
    id: 'p-ormedic-balancing-serum',
    label: 'Ormedic Balancing Antioxidant Serum',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },

  // Exfoliants / enzyme
  {
    id: 'p-daily-microfoliant',
    label: 'Daily Microfoliant',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'p-exfoliant-accelerator',
    label: 'Exfoliant Accelerator',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'p-multi-active-scaling-gel',
    label: 'Multi-Active Scaling Gel',
    brand: 'dermalogica',
    triggers: [{ service: 'hydralux' }],
  },
  {
    id: 'p-multivitamin-thermafoliant',
    label: 'MultiVitamin Thermafoliant',
    brand: 'dermalogica',
    triggers: [{ service: 'lumin' }],
  },
  {
    id: 'p-calming-botanical-mixer',
    label: 'Calming Botanical Mixer',
    brand: 'dermalogica',
    triggers: [{ service: 'lumin' }],
  },

  // Treatments / massage / conductive
  {
    id: 'p-post-extraction-solution',
    label: 'Post Extraction Solution',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'p-pro-massage-gel-cream',
    label: 'PRO Massage Gel-Cream',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }, { addon: 'guasha' }],
  },
  {
    id: 'p-pro-conductive-masque',
    label: 'PRO Conductive Masque Base',
    brand: 'dermalogica',
    triggers: [{ service: 'liquidfacelift' }, { addon: 'nuface' }],
  },

  // Masks
  {
    id: 'p-hydrojelly-ha',
    label: 'Hydrojelly — Hyaluronic Acid',
    brand: 'esthemax',
    triggers: [{ service: 'signature' }, { service: 'hydralux' }],
  },
  {
    id: 'p-hydrojelly-vitc',
    label: 'Hydrojelly — Vitamin C',
    brand: 'esthemax',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'p-biodance-collagen',
    label: 'Biodance Collagen Mask',
    brand: 'biodance',
    triggers: [{ service: 'liquidfacelift' }, { addon: 'collagen' }],
  },
  {
    id: 'p-biocellulose-sheet',
    label: 'Bio-cellulose collagen sheet mask',
    brand: 'generic',
    triggers: [{ service: 'hydralux' }],
  },

  // Serums
  {
    id: 'p-cosdebaha-ha-serum',
    label: 'Pure Hyaluronic Acid Serum',
    brand: 'cosdebaha',
    triggers: [{ service: 'hydralux' }, { addon: 'serum' }],
  },
  {
    id: 'p-biolumin-c-serum',
    label: 'BioLumin-C Serum',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }],
  },
  {
    id: 'p-circular-hydration-serum',
    label: 'Circular Hydration Serum',
    brand: 'dermalogica',
    triggers: [{ service: 'lumin' }],
  },
  {
    id: 'p-max-stem-cell-serum',
    label: 'The MAX Stem Cell Serum',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }, { addon: 'eye' }, { addon: 'serum' }],
  },
  {
    id: 'p-vital-c-ace-serum',
    label: 'Vital C Hydrating ACE Serum',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },

  // Moisturizers / SPF
  {
    id: 'p-active-moist',
    label: 'Active Moist',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }, { service: 'lumin' }],
  },
  {
    id: 'p-skin-smoothing-cream',
    label: 'Skin Smoothing Cream',
    brand: 'dermalogica',
    triggers: [{ service: 'hydralux' }],
  },
  {
    id: 'p-physical-defense-spf30',
    label: 'Invisible Physical Defense SPF 30',
    brand: 'dermalogica',
    triggers: [{ service: 'signature' }, { service: 'hydralux' }, { service: 'lumin' }],
  },
  {
    id: 'p-vital-c-facial-oil',
    label: 'Vital C Hydrating Facial Oil',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },
  {
    id: 'p-max-stem-cell-creme',
    label: 'The MAX Stem Cell Crème',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },
  {
    id: 'p-daily-prevention-spf50',
    label: 'Daily Prevention SPF 50',
    brand: 'image',
    triggers: [{ service: 'liquidfacelift' }],
  },

  // Lip / eye add-on products
  {
    id: 'p-laneige-lip-mask',
    label: 'Laneige Lip Sleeping Mask',
    brand: 'laneige',
    triggers: [{ addon: 'lip' }],
  },
  {
    id: 'p-lip-sugar-scrub',
    label: 'Lip sugar scrub',
    triggers: [{ addon: 'lip' }],
  },
  {
    id: 'p-undereye-patches',
    label: 'Hydrogel under-eye patches',
    brand: 'generic',
    triggers: [{ addon: 'eye' }],
  },

  // Wax-line products
  {
    id: 'p-prewax-cleanser',
    label: 'Pre-wax cleanser',
    triggers: [{ anyWaxing: true }],
  },
  {
    id: 'p-hard-wax',
    label: 'Hard wax',
    triggers: [{ anyWaxing: true }],
  },
  {
    id: 'p-postwax-oil',
    label: 'Post-wax soothing oil',
    triggers: [{ anyWaxing: true }],
  },
];

// ── Section 4: Disposables ──────────────────────────────────────────────────
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

// ── Treatment Order Quick Reference ─────────────────────────────────────────
// Paulina's actual validated workflow per facial. Toner deliberately comes
// AFTER the mask in every protocol.
export const PROTOCOLS: Record<FacialId, ProtocolStep[]> = {
  signature: [
    { n: 1, text: 'First cleanse — PreCleanse Balm' },
    { n: 2, text: 'Second cleanse — Special Cleansing Gel' },
    { n: 3, text: 'Exfoliation — Daily Microfoliant or Exfoliant Accelerator' },
    { n: 4, text: 'Extractions under mag lamp' },
    { n: 5, text: 'Post Extraction Solution' },
    { n: 6, text: 'Massage — PRO Massage Gel-Cream' },
    { n: 7, text: 'Mask — Hydrojelly HA or Vitamin C (10–15 min)' },
    { n: 8, text: 'Tone — PRO Multi-Active Toner' },
    { n: 9, text: 'Serum — BioLumin-C Serum' },
    { n: 10, text: 'Finish — Active Moist + SPF 30' },
  ],
  hydralux: [
    { n: 1, text: 'First cleanse — PreCleanse Balm' },
    { n: 2, text: 'Second cleanse — Intensive Moisture Cleanser' },
    { n: 3, text: 'Light exfoliation — Multi-Active Scaling Gel' },
    { n: 4, text: 'Mask — Bio-cellulose or Hydrojelly HA (10–15 min)' },
    { n: 5, text: 'Tone — PRO Multi-Active Toner' },
    { n: 6, text: 'HA Layering — 3 layers on damp skin' },
    { n: 7, text: 'Finish — Skin Smoothing Cream + SPF 30' },
  ],
  liquidfacelift: [
    { n: 1, text: 'First cleanse — Vital C Hydrating Cleanser' },
    { n: 2, text: 'Second cleanse — Ormedic Balancing Cleanser' },
    { n: 3, text: 'Conductive medium — PRO Conductive Masque Base' },
    { n: 4, text: 'Mask — Biodance Collagen Mask' },
    { n: 5, text: 'Tone — Ormedic Balancing Antioxidant Serum' },
    { n: 6, text: 'Peptide infusion — The MAX Stem Cell Serum' },
    { n: 7, text: 'Microcurrent sculpting — NuFace' },
    { n: 8, text: 'Vitamin C — Vital C Hydrating ACE Serum' },
    { n: 9, text: 'Finish — Facial Oil + MAX Crème + SPF 50' },
  ],
  lumin: [
    { n: 1, text: 'First cleanse — PreCleanse Balm' },
    { n: 2, text: 'Second cleanse — Special Cleansing Gel' },
    { n: 3, text: 'Enzyme — MultiVitamin Thermafoliant + Botanical Mixer' },
    { n: 4, text: 'Tone — PRO Multi-Active Toner' },
    { n: 5, text: 'Serum — Circular Hydration Serum' },
    { n: 6, text: 'LED mask session (15–20 min)' },
    { n: 7, text: 'Finish — Active Moist + SPF 30' },
  ],
};

// ── Selection logic ─────────────────────────────────────────────────────────
function triggerMatches(
  trigger: Trigger,
  serviceId: string,
  addonIds: string[],
): boolean {
  if ('service' in trigger) return trigger.service === serviceId;
  if ('addon' in trigger) return addonIds.includes(trigger.addon);
  if ('anyFacial' in trigger) return isFacial(serviceId);
  if ('anyWaxing' in trigger) return isWaxing(serviceId);
  if ('anyBrowWax' in trigger) {
    return serviceId === 'wax-brow' || serviceId === 'wax-combo';
  }
  return false;
}

export function selectItems(
  items: ChecklistItem[],
  serviceId: string,
  addonIds: string[],
): ChecklistItem[] {
  return items.filter((item) =>
    item.triggers.some((t) => triggerMatches(t, serviceId, addonIds)),
  );
}

export function protocolFor(serviceId: string): ProtocolStep[] | null {
  if (isFacial(serviceId)) return PROTOCOLS[serviceId];
  return null;
}

// Brand → human label, used for badge text. Kept here so the view layer is
// dumb data-driven.
export const BRAND_LABEL: Record<Brand, string> = {
  dermalogica: 'Dermalogica',
  image: 'IMAGE',
  esthemax: 'Esthemax',
  biodance: 'Biodance',
  cosdebaha: 'Cos De BAHA',
  laneige: 'Laneige',
  generic: '',
};
