import { PRODUCTS, Product } from './products.ts';

export type PriceTierKey = 'mrp' | 'retail' | 'earnBase' | 'p25' | 'p35' | 'p42' | 'p50';

export interface ProductItem extends Product {
  id?: string;
  category?: string;
  active?: boolean;
}

export interface SiteSettings {
  brandTitle: string;
  pageHeading: string;
  pageSubtitle: string;
  primaryColor: string;
  currencySymbol: string;
  defaultTier: PriceTierKey;
  showEarnBaseByDefault: boolean;
  tierLabels: Record<PriceTierKey, string>;
  enabledTiers: Record<PriceTierKey, boolean>;
  searchPlaceholder: string;
  searchHelpText: string;
  quickFilterTags: string[];
  customerSectionTitle: string;
  customerSectionSubtitle: string;
  customerNamePlaceholder: string;
  customerPhonePlaceholder: string;
  requireCustomerNameForPdf: boolean;
  customerNameErrorMsg: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappButtonLabel: string;
  invoiceTitle: string;
  invoiceSubtitle: string;
  distributorName: string;
  distributorContact: string;
  footerLine1: string;
  footerLine2: string;
  adminPin: string;
}

export interface AppStatePayload {
  products: ProductItem[];
  settings: SiteSettings;
  updatedAt: string;
}

export function inferCategory(name: string): string {
  const lower = (name || '').toLowerCase();
  if (
    lower.includes('formula 1') ||
    lower.includes('protein') ||
    lower.includes('shakemate') ||
    lower.includes('dinoshake')
  ) {
    return 'Core Shakes & Protein';
  }
  if (lower.includes('afresh') || lower.includes('liftoff') || lower.includes('h24')) {
    return 'Energy & Sports (H24)';
  }
  if (
    lower.includes('aloe') ||
    lower.includes('fiber') ||
    lower.includes('fibre') ||
    lower.includes('probiotic') ||
    lower.includes('triphala')
  ) {
    return 'Digestive & Aloe';
  }
  if (
    lower.includes('skin') ||
    lower.includes('facial') ||
    lower.includes('moisturizer') ||
    lower.includes('cleanser') ||
    lower.includes('toner') ||
    lower.includes('serum')
  ) {
    return 'Skin & Outer Nutrition';
  }
  return 'Targeted Nutrition';
}

export const DEFAULT_PRODUCTS: ProductItem[] = PRODUCTS.map((p, idx) => ({
  ...p,
  id: `prod_${idx + 1}`,
  category: inferCategory(p.name),
  active: true,
}));

export const DEFAULT_SETTINGS: SiteSettings = {
  brandTitle: 'HERBALIFE CALCULATOR',
  pageHeading: 'Price & Volume Point Calculator',
  pageSubtitle:
    'Instant multi-tier price calculation (MRP, Retail, 25%, 35%, 42%, 50%) · Volume Points (VP) · Customer Quote Generator',
  primaryColor: '#1E562A',
  currencySymbol: '₹',
  defaultTier: 'p35',
  showEarnBaseByDefault: false,
  tierLabels: {
    mrp: 'MRP',
    retail: 'Retail Price',
    earnBase: 'Earn Base',
    p25: '25%',
    p35: '35%',
    p42: '42%',
    p50: '50%',
  },
  enabledTiers: {
    mrp: true,
    retail: true,
    earnBase: true,
    p25: true,
    p35: true,
    p42: true,
    p50: true,
  },
  searchPlaceholder:
    'Type any letter or word — e.g. V, Vanilla, Protein, Aloe, Formula 1, 1233...',
  searchHelpText:
    'Type one letter to see matching products. Use ↑ ↓ and Enter to add quickly.',
  quickFilterTags: ['Formula 1', 'Protein', 'Afresh', 'Aloe', 'Skin', 'Calcium'],
  customerSectionTitle: 'Customer Details',
  customerSectionSubtitle: 'Required for PDF Invoice · Saved automatically',
  customerNamePlaceholder: 'Customer Name *',
  customerPhonePlaceholder: 'Phone Number (Optional)',
  requireCustomerNameForPdf: true,
  customerNameErrorMsg:
    'PDF save করার আগে Customer Name লিখুন · Please enter Customer Name before saving PDF.',
  whatsappEnabled: true,
  whatsappNumber: '919433523525',
  whatsappMessage: 'Hello, I need help',
  whatsappButtonLabel: 'Help',
  invoiceTitle: 'HERBALIFE',
  invoiceSubtitle: 'Price & Volume Point Estimate',
  distributorName: 'TANMOY DARI',
  distributorContact: '+91 9433523525',
  footerLine1:
    'পণ্যের মূল্য ও ভলিউম পয়েন্টের তথ্য প্রদত্ত Herbalife Price List থেকে নেওয়া হয়েছে। লেনদেনের আগে বর্তমান অফিসিয়াল Price List-এর সঙ্গে তথ্য যাচাই করুন।',
  footerLine2:
    'ওয়েবসাইটটি তৈরি করেছেন: TANMOY DARI। এই ওয়েবসাইটটি পণ্যের মূল্য ও ভলিউম পয়েন্ট সহজে হিসাব করার জন্য তৈরি করা হয়েছে।',
  adminPin: '1234',
};

export function sanitizeSettings(raw?: Partial<SiteSettings> | null): SiteSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    tierLabels: {
      ...DEFAULT_SETTINGS.tierLabels,
      ...(raw.tierLabels && typeof raw.tierLabels === 'object' ? raw.tierLabels : {}),
    },
    enabledTiers: {
      ...DEFAULT_SETTINGS.enabledTiers,
      ...(raw.enabledTiers && typeof raw.enabledTiers === 'object' ? raw.enabledTiers : {}),
    },
    quickFilterTags: Array.isArray(raw.quickFilterTags)
      ? raw.quickFilterTags
      : DEFAULT_SETTINGS.quickFilterTags,
  };
}
