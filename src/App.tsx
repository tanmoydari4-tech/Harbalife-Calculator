/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Printer,
  RotateCcw,
  Share2,
  Check,
  AlertCircle,
  FileText,
  Download,
  Copy,
  History,
  MessageCircle,
  User,
  Phone,
  ShoppingBag,
  Settings
} from 'lucide-react';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  ProductItem,
  SiteSettings,
  PriceTierKey,
  inferCategory,
  sanitizeSettings,
} from './data/defaultConfig';
import AdminPanel from './components/AdminPanel';
import { subscribeToFirebaseStore, saveToFirebaseStore } from './lib/firebase';
import { downloadQuotePdf } from './lib/pdfGenerator';

export const PRIMARY_TIERS: PriceTierKey[] = ['mrp', 'retail', 'p25', 'p35', 'p42', 'p50'];
export const ALL_TIERS: PriceTierKey[] = ['mrp', 'retail', 'earnBase', 'p25', 'p35', 'p42', 'p50'];

export interface SavedQuote {
  id: string;
  customerName: string;
  customerPhone: string;
  tier: PriceTierKey;
  items: { index: number; qty: number }[];
  totalPrice: number;
  totalVp: number;
  totalQty: number;
  createdAt: string;
}

export function getProductPrice(p: ProductItem, tier: PriceTierKey): number {
  return Number(p[tier] ?? 0);
}

export default function App() {
  // Active tab state (Tier Matrix removed per user request)
  const [activeTab, setActiveTab] = useState<
    'calculator' | 'catalog' | 'quotes' | 'admin'
  >('calculator');

  // Dynamic Products & Site Settings (loaded from Firebase + server API + localStorage cache)
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const cached = localStorage.getItem('hl_admin_products_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PRODUCTS;
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const cached = localStorage.getItem('hl_admin_settings_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        return sanitizeSettings(parsed);
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Subscribe to Firebase Firestore ("harbalife-calculator") + fallback to backend on mount
  useEffect(() => {
    let mounted = true;
    let receivedFromFirebase = false;

    // 1. Real-time listener on user's Firebase Firestore ("harbalife-calculator")
    const unsubscribe = subscribeToFirebaseStore(
      (cloudData) => {
        if (!mounted) return;
        receivedFromFirebase = true;
        if (Array.isArray(cloudData.products) && cloudData.products.length > 0) {
          setProducts(cloudData.products);
          try {
            localStorage.setItem('hl_admin_products_v1', JSON.stringify(cloudData.products));
          } catch {
            // ignore
          }
        }
        if (cloudData.settings) {
          const merged = sanitizeSettings(cloudData.settings);
          setSettings(merged);
          try {
            localStorage.setItem('hl_admin_settings_v1', JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      },
      () => {
        // If Firestore rules/database not created yet, fallback silently
      }
    );

    // 2. Also fetch from local Express server store (only if JSON endpoint exists)
    fetch('./api/app-data')
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (!mounted || !data || receivedFromFirebase) return;
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          try {
            localStorage.setItem('hl_admin_products_v1', JSON.stringify(data.products));
          } catch {
            // ignore
          }
        }
        if (data.settings) {
          const merged = sanitizeSettings(data.settings);
          setSettings(merged);
          try {
            localStorage.setItem('hl_admin_settings_v1', JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Static hosting (GitHub Pages / Netlify) — uses Firebase + localStorage
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Format currency dynamically using settings.currencySymbol
  const formatMoney = (n: number): string => {
    const sym = settings.currencySymbol || '₹';
    return sym + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Cart state: Map of product array index -> quantity
  const [cart, setCart] = useState<Map<number, number>>(() => {
    try {
      const saved = localStorage.getItem('hl_cart_v1');
      if (saved) {
        const parsed: [number, number][] = JSON.parse(saved);
        return new Map(parsed);
      }
    } catch {
      // ignore
    }
    return new Map();
  });

  // Selected Price Tier
  const [tier, setTierState] = useState<PriceTierKey>(() => {
    try {
      const saved = localStorage.getItem('tier') as PriceTierKey;
      if (saved && ALL_TIERS.includes(saved)) return saved;
    } catch {
      // ignore
    }
    return settings.defaultTier || 'p35';
  });

  const [showEarnBase, setShowEarnBase] = useState<boolean>(settings.showEarnBaseByDefault);

  // Customer Details
  const [customerName, setCustomerName] = useState<string>(
    () => localStorage.getItem('hl_customer_name') || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    () => localStorage.getItem('hl_customer_phone') || ''
  );
  const [nameError, setNameError] = useState<boolean>(false);

  // Search & Autocomplete state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);

  // Catalog filter state
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [catalogSort, setCatalogSort] = useState<
    'default' | 'name' | 'vp-desc' | 'price-asc' | 'price-desc'
  >('default');

  // Confirmation & Modal states
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  // Saved Quotes History
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>(() => {
    try {
      const raw = localStorage.getItem('hl_saved_quotes_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);

  const triggerFeedback = (msg: string) => {
    setCopiedFeedback(msg);
    setTimeout(() => setCopiedFeedback(null), 2800);
  };

  // Admin save handler: saves to Firebase Firestore ("harbalife-calculator") + server + localStorage
  const handleAdminSaveAll = async (
    newProducts: ProductItem[],
    newSettings: SiteSettings,
    message?: string
  ) => {
    setProducts(newProducts);
    setSettings(newSettings);
    try {
      localStorage.setItem('hl_admin_products_v1', JSON.stringify(newProducts));
      localStorage.setItem('hl_admin_settings_v1', JSON.stringify(newSettings));
    } catch {
      // ignore
    }

    // Save to Firebase Firestore ("harbalife-calculator") and local backend in parallel
    await Promise.allSettled([
      saveToFirebaseStore(newProducts, newSettings),
      fetch('/api/app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: newProducts, settings: newSettings }),
      }),
    ]);

    triggerFeedback(message || 'Saved to Firebase & Admin Database');
  };

  const handleAdminResetDefaults = async (target: 'products' | 'settings' | 'all') => {
    const nextProducts = target === 'settings' ? products : DEFAULT_PRODUCTS;
    const nextSettings = target === 'products' ? settings : DEFAULT_SETTINGS;
    await handleAdminSaveAll(nextProducts, nextSettings, 'Restored default configuration');
  };

  const setTier = (newTier: PriceTierKey) => {
    setTierState(newTier);
    try {
      localStorage.setItem('tier', newTier);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('hl_cart_v1', JSON.stringify(Array.from(cart.entries())));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('hl_customer_name', customerName);
      localStorage.setItem('hl_customer_phone', customerPhone);
    } catch {
      // ignore
    }
  }, [customerName, customerPhone]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchCardRef.current && !searchCardRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active products visible to customers
  const activeProductsWithIndices = useMemo(() => {
    return products
      .map((p, index) => ({ p, index }))
      .filter(({ p }) => p.active !== false);
  }, [products]);

  // Filtered products for autocomplete search
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    return activeProductsWithIndices
      .filter(({ p }) => {
        const text = ((p.code || '') + ' ' + (p.name || '')).toLowerCase();
        return tokens.every((t) => text.includes(t));
      })
      .slice(0, 30);
  }, [searchQuery, activeProductsWithIndices]);

  useEffect(() => {
    if (filteredSuggestions.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= filteredSuggestions.length) {
      setSelectedIndex(filteredSuggestions.length - 1);
    }
  }, [filteredSuggestions, selectedIndex]);

  // Cart manipulation handlers
  const addToCart = (index: number, focusSearch = true) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(index, (next.get(index) || 0) + 1);
      return next;
    });
    setSearchQuery('');
    setIsSuggestionsOpen(false);
    setSelectedIndex(0);
    if (focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const changeQty = (index: number, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const current = next.get(index) || 0;
      const updated = current + delta;
      if (updated <= 0) {
        next.delete(index);
      } else {
        next.set(index, updated);
      }
      return next;
    });
  };

  const setQtyDirect = (index: number, value: string) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    setCart((prev) => {
      const next = new Map(prev);
      if (parsed === 0) {
        next.delete(index);
      } else {
        next.set(index, parsed);
      }
      return next;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  };

  const handleClearAll = () => {
    setCart(new Map());
    setCustomerName('');
    setCustomerPhone('');
    setSearchQuery('');
    setNameError(false);
    setConfirmClearOpen(false);
  };

  // Computed Cart Entries & Totals
  const cartEntries = useMemo(() => {
    const list: {
      index: number;
      product: ProductItem;
      qty: number;
      unitPrice: number;
      lineTotal: number;
      unitMrp: number;
      lineMrp: number;
      unitVp: number;
      lineVp: number;
    }[] = [];

    cart.forEach((qty, index) => {
      const product = products[index];
      if (!product || qty <= 0) return;
      const unitPrice = getProductPrice(product, tier);
      const unitMrp = product.mrp;
      const unitVp = Number(product.vp);
      list.push({
        index,
        product,
        qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        unitMrp,
        lineMrp: unitMrp * qty,
        unitVp,
        lineVp: unitVp * qty,
      });
    });
    return list;
  }, [cart, tier, products]);

  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalMrp = 0;
    let totalQty = 0;
    let totalVp = 0;

    for (const item of cartEntries) {
      totalPrice += item.lineTotal;
      totalMrp += item.lineMrp;
      totalQty += item.qty;
      totalVp += item.lineVp;
    }

    const totalSavings = Math.max(0, totalMrp - totalPrice);
    const savingsPercent = totalMrp > 0 ? ((totalSavings / totalMrp) * 100).toFixed(1) : '0.0';

    const byTier: Record<PriceTierKey, number> = {
      mrp: 0,
      retail: 0,
      earnBase: 0,
      p25: 0,
      p35: 0,
      p42: 0,
      p50: 0,
    };

    for (const item of cartEntries) {
      ALL_TIERS.forEach((tKey) => {
        byTier[tKey] += getProductPrice(item.product, tKey) * item.qty;
      });
    }

    return {
      itemCount: cartEntries.length,
      totalPrice,
      totalMrp,
      totalQty,
      totalVp,
      totalSavings,
      savingsPercent,
      byTier,
    };
  }, [cartEntries]);

  const saveQuoteToHistory = () => {
    if (cartEntries.length === 0) return;
    const newQuote: SavedQuote = {
      id: Date.now().toString(),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      tier,
      items: cartEntries.map((item) => ({ index: item.index, qty: item.qty })),
      totalPrice: totals.totalPrice,
      totalVp: totals.totalVp,
      totalQty: totals.totalQty,
      createdAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updated = [newQuote, ...savedQuotes.slice(0, 29)];
    setSavedQuotes(updated);
    try {
      localStorage.setItem('hl_saved_quotes_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    triggerFeedback('Quote saved to history');
  };

  const handleSavePdf = () => {
    if (settings.requireCustomerNameForPdf && !customerName.trim()) {
      setNameError(true);
      if (activeTab === 'admin') setActiveTab('calculator');
      setTimeout(() => {
        customerNameInputRef.current?.focus();
        customerNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setNameError(false);
    if (cartEntries.length > 0) {
      saveQuoteToHistory();
    }
    setInvoiceModalOpen(true);
  };

  const tierLabel = (tKey: PriceTierKey) => settings.tierLabels[tKey] || tKey;

  const handleDownloadPdfFile = () => {
    downloadQuotePdf({
      customerName: customerName.trim() || 'Customer',
      customerPhone: customerPhone.trim(),
      tier,
      tierLabel: tierLabel(tier),
      cartEntries,
      totalPrice: totals.totalPrice,
      totalMrp: totals.totalMrp,
      totalQty: totals.totalQty,
      totalVp: totals.totalVp,
      totalSavings: totals.totalSavings,
      savingsPercent: totals.savingsPercent,
      settings,
    });
    triggerFeedback('PDF file downloaded (.pdf)');
  };

  const executePrint = () => {
    handleDownloadPdfFile();
  };

  const buildTextSummary = () => {
    const lines: string[] = [];
    lines.push(`*${settings.invoiceTitle} - ${settings.invoiceSubtitle.toUpperCase()}*`);
    if (customerName.trim()) lines.push(`Customer: *${customerName.trim()}*`);
    if (customerPhone.trim()) lines.push(`Phone: ${customerPhone.trim()}`);
    lines.push(`Selected Tier: *${tierLabel(tier)}*`);
    lines.push('--------------------------------');
    cartEntries.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. *${item.product.name}* ${item.product.code ? `[#${item.product.code}]` : ''}\n   ${formatMoney(item.unitPrice)} × ${item.qty} = *${formatMoney(item.lineTotal)}* (${item.lineVp.toFixed(2)} VP)`
      );
    });
    lines.push('--------------------------------');
    lines.push(`Total Quantity: *${totals.totalQty}*`);
    lines.push(`Total Volume Points: *${totals.totalVp.toFixed(2)} VP*`);
    if (totals.totalSavings > 0) {
      lines.push(`MRP Total: ${formatMoney(totals.totalMrp)} (Save ${formatMoney(totals.totalSavings)})`);
    }
    lines.push(`*GRAND TOTAL: ${formatMoney(totals.totalPrice)}*`);
    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildTextSummary());
      triggerFeedback('Bill summary copied to clipboard');
    } catch {
      triggerFeedback('Could not copy text');
    }
  };

  const getWhatsAppShareUrl = () => {
    const text = encodeURIComponent(buildTextSummary());
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      return `https://wa.me/${phoneWithCountry}?text=${text}`;
    }
    return `https://wa.me/?text=${text}`;
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen && searchQuery.trim()) {
      setIsSuggestionsOpen(true);
    }
    if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter' && filteredSuggestions.length > 0) {
      e.preventDefault();
      const target = filteredSuggestions[selectedIndex] || filteredSuggestions[0];
      if (target) {
        addToCart(target.index);
      }
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
    }
  };

  // Categories for Catalog view
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    activeProductsWithIndices.forEach(({ p }) =>
      set.add(p.category || inferCategory(p.name))
    );
    return Array.from(set);
  }, [activeProductsWithIndices]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/) : [];

    const base = activeProductsWithIndices
      .map(({ p, index }) => ({
        p,
        index,
        category: p.category || inferCategory(p.name),
      }))
      .filter(({ p, category }) => {
        if (selectedCategory !== 'All' && category !== selectedCategory) return false;
        if (tokens.length === 0) return true;
        const text = ((p.code || '') + ' ' + (p.name || '')).toLowerCase();
        return tokens.every((t) => text.includes(t));
      });

    if (catalogSort === 'name') {
      base.sort((a, b) => a.p.name.localeCompare(b.p.name));
    } else if (catalogSort === 'vp-desc') {
      base.sort((a, b) => b.p.vp - a.p.vp);
    } else if (catalogSort === 'price-asc') {
      base.sort((a, b) => getProductPrice(a.p, tier) - getProductPrice(b.p, tier));
    } else if (catalogSort === 'price-desc') {
      base.sort((a, b) => getProductPrice(b.p, tier) - getProductPrice(a.p, tier));
    }

    return base;
  }, [catalogSearch, selectedCategory, catalogSort, tier, activeProductsWithIndices]);

  const loadSavedQuote = (quote: SavedQuote) => {
    setCustomerName(quote.customerName === 'Walk-in Customer' ? '' : quote.customerName);
    setCustomerPhone(quote.customerPhone || '');
    setTier(quote.tier);
    const nextMap = new Map<number, number>();
    quote.items.forEach(({ index, qty }) => {
      if (products[index] && qty > 0) {
        nextMap.set(index, qty);
      }
    });
    setCart(nextMap);
    setActiveTab('calculator');
    triggerFeedback(`Loaded quote for ${quote.customerName}`);
  };

  const deleteSavedQuote = (id: string) => {
    const updated = savedQuotes.filter((q) => q.id !== id);
    setSavedQuotes(updated);
    try {
      localStorage.setItem('hl_saved_quotes_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const visibleTiers = useMemo(() => {
    const baseList = showEarnBase ? ALL_TIERS : PRIMARY_TIERS;
    const filtered = baseList.filter((tKey) => settings.enabledTiers[tKey] !== false);
    return filtered.length > 0 ? filtered : (['p35'] as PriceTierKey[]);
  }, [showEarnBase, settings.enabledTiers]);

  const whatsappHelpUrl = `https://wa.me/${(settings.whatsappNumber || '919433523525').replace(/\D/g, '')}?text=${encodeURIComponent(settings.whatsappMessage || 'Hello, I need help')}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#14211B]">
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="no-print sticky top-0 z-30 bg-[#1E562A] text-white border-b border-[#164220] shadow-xs">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#calculator"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('calculator');
            }}
            className="text-sm sm:text-xl font-extrabold tracking-tight text-white truncate max-w-[190px] sm:max-w-none"
          >
            {settings.brandTitle || 'HERBALIFE CALCULATOR'}
          </a>

          {/* Zone 2: Navigation links (Tier Matrix removed) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/80">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'text-white border-white font-semibold'
                  : 'border-transparent hover:text-white hover:border-white/40'
              }`}
            >
              Calculator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'text-white border-white font-semibold'
                  : 'border-transparent hover:text-white hover:border-white/40'
              }`}
            >
              Price List ({activeProductsWithIndices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quotes')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'quotes'
                  ? 'text-white border-white font-semibold'
                  : 'border-transparent hover:text-white hover:border-white/40'
              }`}
            >
              Saved Quotes ({savedQuotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'text-white border-white font-semibold'
                  : 'border-transparent hover:text-white hover:border-white/40'
              }`}
            >
              Admin Panel
            </button>
          </nav>

          {/* Zone 3: Primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#1E562A] bg-white rounded-lg hover:bg-[#EDF7F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Workspace Mode Switcher (Tier Matrix removed, full width responsive) */}
      <div className="no-print md:hidden bg-white border-b border-[#DCE5DF] px-2.5 py-2 grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center truncate transition-colors ${
            activeTab === 'calculator'
              ? 'bg-[#1E562A] text-white'
              : 'bg-[#F4F7F5] text-[#4A5D54]'
          }`}
        >
          Calculator {totals.itemCount > 0 ? `(${totals.itemCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center truncate transition-colors ${
            activeTab === 'catalog'
              ? 'bg-[#1E562A] text-white'
              : 'bg-[#F4F7F5] text-[#4A5D54]'
          }`}
        >
          Price List ({activeProductsWithIndices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quotes')}
          className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center truncate transition-colors ${
            activeTab === 'quotes'
              ? 'bg-[#1E562A] text-white'
              : 'bg-[#F4F7F5] text-[#4A5D54]'
          }`}
        >
          Quotes ({savedQuotes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`py-2 px-1 text-[11px] font-bold rounded-lg text-center truncate transition-colors ${
            activeTab === 'admin'
              ? 'bg-[#1E562A] text-white'
              : 'bg-[#F4F7F5] text-[#4A5D54]'
          }`}
        >
          Admin Panel
        </button>
      </div>

      {/* Toast Notification Banner */}
      {copiedFeedback && (
        <div className="no-print fixed bottom-20 right-5 z-50 bg-[#14211B] text-white px-4 py-2.5 rounded-lg shadow-lg border border-white/10 flex items-center gap-2 text-xs font-medium">
          <Check className="w-4 h-4 text-[#4ADE80] shrink-0" />
          <span>{copiedFeedback}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="no-print flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Sub-header workspace toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#14211B] tracking-tight">
              {settings.pageHeading}
            </h1>
            <p className="text-xs text-[#5A6B63]">{settings.pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'admin' ? 'calculator' : 'admin')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#1E562A] text-white border-[#1E562A]'
                  : 'bg-white text-[#1E562A] border-[#B5DEC1] hover:bg-[#EDF7F0]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{activeTab === 'admin' ? '← Back to Calculator' : 'Admin Panel'}</span>
            </button>

            {activeTab !== 'admin' && (
              <>
                {!confirmClearOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="px-3.5 py-2 text-xs font-bold text-[#B91C1C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#FEF2F2] border border-[#FCA5A5] px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-semibold text-[#991B1B] whitespace-nowrap">
                      Clear cart & customer?
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 text-xs font-bold bg-[#DC2626] text-white rounded hover:bg-[#B91C1C] cursor-pointer whitespace-nowrap"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearOpen(false)}
                      className="px-2 py-1 text-xs font-medium text-[#4A5D54] hover:text-[#14211B] cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TAB 5: ADMIN PANEL */}
        {activeTab === 'admin' ? (
          <AdminPanel
            products={products}
            settings={settings}
            onSaveAll={handleAdminSaveAll}
            onResetDefaults={handleAdminResetDefaults}
            formatMoney={formatMoney}
          />
        ) : (
          <>
            {/* Customer Details Section */}
            <section className="bg-white border border-[#DCE5DF] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="customerName" className="text-xs font-bold text-[#4A5D54] tracking-tight">
                  {settings.customerSectionTitle}
                </label>
                <span className="text-xs text-[#687771]">
                  {settings.customerSectionSubtitle}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User className="w-4 h-4 text-[#687771] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={customerNameInputRef}
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder={settings.customerNamePlaceholder}
                    required={settings.requireCustomerNameForPdf}
                    className={`w-full h-11 pl-10 pr-3.5 text-sm bg-white border rounded-lg outline-none transition-all ${
                      nameError
                        ? 'border-[#DC2626] ring-3 ring-[#DC2626]/15'
                        : 'border-[#C5D3CB] focus:border-[#1E562A] focus:ring-3 focus:ring-[#1E562A]/15'
                    }`}
                  />
                </div>

                <div className="relative">
                  <Phone className="w-4 h-4 text-[#687771] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={settings.customerPhonePlaceholder}
                    className="w-full h-11 pl-10 pr-3.5 text-sm bg-white border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A] focus:ring-3 focus:ring-[#1E562A]/15 transition-all font-mono"
                  />
                </div>
              </div>

              {nameError && (
                <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settings.customerNameErrorMsg}</span>
                </div>
              )}
            </section>

            {/* Select Price Tier Bar (Mobile-responsive grid) */}
            <section className="bg-white border border-[#DCE5DF] rounded-xl p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold text-[#4A5D54] whitespace-nowrap">
                  Select Price Tier
                </span>
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {visibleTiers.map((tKey) => {
                    const isActive = tier === tKey;
                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => setTier(tKey)}
                        className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold text-center transition-colors whitespace-nowrap cursor-pointer border ${
                          isActive
                            ? 'bg-[#1E562A] text-white border-[#1E562A] shadow-2xs'
                            : 'bg-white text-[#2F3E37] border-[#C5D3CB] hover:bg-[#F4F7F5] hover:border-[#9EB2A7]'
                        }`}
                      >
                        {tierLabel(tKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {settings.enabledTiers.earnBase !== false && (
                <button
                  type="button"
                  onClick={() => setShowEarnBase((v) => !v)}
                  className="text-xs font-medium text-[#5A6B63] hover:text-[#1E562A] transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  {showEarnBase ? `Hide ${tierLabel('earnBase')}` : `+ Show ${tierLabel('earnBase')} Tier`}
                </button>
              )}
            </section>

            {/* TAB 1: CALCULATOR VIEW */}
            {activeTab === 'calculator' && (
              <>
                {/* Search a Product Card */}
                <section
                  ref={searchCardRef}
                  className="bg-white border border-[#DCE5DF] rounded-xl p-4 sm:p-5 relative z-20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="productSearch" className="text-sm font-bold text-[#14211B]">
                      Find a Product
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('catalog')}
                      className="text-xs font-semibold text-[#1E562A] hover:underline cursor-pointer"
                    >
                      Browse Full Price List ({activeProductsWithIndices.length} items) →
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-5 h-5 text-[#5A6B63] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      id="productSearch"
                      type="text"
                      autoComplete="off"
                      value={searchQuery}
                      onFocus={() => {
                        if (searchQuery.trim()) setIsSuggestionsOpen(true);
                      }}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedIndex(0);
                        setIsSuggestionsOpen(Boolean(e.target.value.trim()));
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={settings.searchPlaceholder}
                      className="w-full h-13 pl-12 pr-11 text-sm sm:text-base bg-white border-2 border-[#B5C6BD] rounded-xl outline-none focus:border-[#1E562A] focus:ring-4 focus:ring-[#1E562A]/12 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSuggestionsOpen(false);
                          searchInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        className="w-8 h-8 rounded-full text-[#5A6B63] hover:bg-[#EDF3EF] hover:text-[#14211B] flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {isSuggestionsOpen && searchQuery.trim() !== '' && (
                    <div className="absolute left-4 right-4 sm:left-5 sm:right-5 top-[104px] bg-white border border-[#C5D3CB] rounded-xl shadow-xl max-h-[380px] overflow-y-auto z-30 divide-y divide-[#EDF2EE]">
                      {filteredSuggestions.length === 0 ? (
                        <div className="py-10 px-4 text-center text-sm text-[#687771]">
                          No matching product found for "{searchQuery}"
                        </div>
                      ) : (
                        filteredSuggestions.map(({ p, index }, i) => {
                          const isSelected = i === selectedIndex;
                          const inCartQty = cart.get(index) || 0;
                          const activePrice = getProductPrice(p, tier);

                          return (
                            <div
                              key={p.id || index}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addToCart(index);
                              }}
                              onMouseEnter={() => setSelectedIndex(i)}
                              className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#E9F5EC]' : 'hover:bg-[#F4F9F5]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono text-xs font-bold text-[#5A6B63] min-w-[52px] shrink-0">
                                  {p.code || '—'}
                                </span>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-[#14211B] truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-xs text-[#5A6B63] mt-0.5 font-mono">
                                    {Number(p.vp).toFixed(2)} VP · {tierLabel(tier)}
                                    {tier !== 'mrp' && ` · MRP ${formatMoney(p.mrp)}`}
                                    {inCartQty > 0 && ` · In cart: ${inCartQty}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono text-sm font-extrabold text-[#1E562A] tabular-nums">
                                  {formatMoney(activePrice)}
                                </span>
                                <span className="w-7 h-7 rounded-lg bg-[#1E562A] text-white flex items-center justify-center">
                                  <Plus className="w-4 h-4" />
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Quick Starter Suggestions & Search Help */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#687771]">
                    <span>{settings.searchHelpText}</span>
                    {settings.quickFilterTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[#5A6B63] font-medium">Quick filter:</span>
                        {settings.quickFilterTags.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              setSelectedIndex(0);
                              setIsSuggestionsOpen(true);
                              searchInputRef.current?.focus();
                            }}
                            className="px-2 py-0.5 text-xs font-medium text-[#1E562A] bg-[#EDF7F0] hover:bg-[#D8EFE0] rounded transition-colors cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Main 2-Column Cart & Summary Layout */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Column: Selected Products List */}
                  <div className="lg:col-span-8 bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#EDF2EE] flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#14211B]">Selected Products</h2>
                      <span className="text-xs font-mono font-semibold text-[#5A6B63] tabular-nums">
                        {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} · {totals.totalQty} units
                      </span>
                    </div>

                    {cartEntries.length === 0 ? (
                      <div className="py-14 px-6 text-center">
                        <ShoppingBag className="w-10 h-10 text-[#9EB2A7] mx-auto mb-3 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-[#2F3E37]">No product selected yet</p>
                        <p className="text-xs text-[#687771] mt-1 max-w-md mx-auto">
                          Type a letter or word in the search box above to find a product, or browse the full Herbalife price list.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => searchInputRef.current?.focus()}
                            className="px-4 py-2 text-xs font-bold text-white bg-[#1E562A] hover:bg-[#164220] rounded-lg transition-colors cursor-pointer"
                          >
                            Search Products
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('catalog')}
                            className="px-4 py-2 text-xs font-bold text-[#1E562A] bg-[#EDF7F0] hover:bg-[#D8EFE0] rounded-lg transition-colors cursor-pointer"
                          >
                            Browse All {activeProductsWithIndices.length} Products
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#EDF2EE]">
                        {cartEntries.map((item) => {
                          const lineSavings = item.lineMrp - item.lineTotal;
                          return (
                            <div
                              key={item.index}
                              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFDFB] transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-[#14211B] leading-snug">
                                  {item.product.name}
                                </div>
                                <div className="text-xs text-[#5A6B63] mt-1 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span>Stock No: {item.product.code || '—'}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>Unit VP: {item.unitVp.toFixed(2)}</span>
                                  {tier !== 'mrp' && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>MRP: {formatMoney(item.unitMrp)}</span>
                                    </>
                                  )}
                                </div>
                                <div className="text-xs text-[#2F3E37] mt-1.5 font-mono tabular-nums">
                                  {tierLabel(tier)}: {formatMoney(item.unitPrice)} × {item.qty} ={' '}
                                  <strong className="font-bold text-[#14211B]">
                                    {formatMoney(item.lineTotal)}
                                  </strong>
                                  {' · '}
                                  <span className="font-semibold text-[#1E562A]">
                                    {item.lineVp.toFixed(2)} VP
                                  </span>
                                  {lineSavings > 0 && (
                                    <span className="text-[#15803D] ml-2">
                                      (Save {formatMoney(lineSavings)})
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.index)}
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:text-[#991B1B] cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EDF2EE]">
                                <div className="text-right sm:hidden font-mono text-sm font-bold text-[#14211B] tabular-nums">
                                  {formatMoney(item.lineTotal)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => changeQty(item.index, -1)}
                                    aria-label="Decrease quantity"
                                    className="w-8 h-8 rounded-lg border border-[#C5D3CB] bg-white hover:bg-[#F4F7F5] text-[#14211B] font-bold flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.qty}
                                    onChange={(e) => setQtyDirect(item.index, e.target.value)}
                                    aria-label={`Quantity for ${item.product.name}`}
                                    className="w-12 h-8 text-center font-mono text-sm font-bold border border-[#C5D3CB] rounded-lg bg-white outline-none focus:border-[#1E562A] tabular-nums"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => changeQty(item.index, 1)}
                                    aria-label="Increase quantity"
                                    className="w-8 h-8 rounded-lg border border-[#C5D3CB] bg-white hover:bg-[#F4F7F5] text-[#14211B] font-bold flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Sticky Total Summary */}
                  <aside className="lg:col-span-4 bg-white border border-[#DCE5DF] rounded-xl lg:sticky lg:top-20 overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#EDF2EE] flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#14211B]">Total Summary</h2>
                      <span className="text-xs font-semibold text-[#1E562A]">
                        Tier: {tierLabel(tier)}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="text-xs font-semibold text-[#5A6B63]">
                        Grand Total ({tierLabel(tier)})
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-[#14211B] font-mono tabular-nums tracking-tight mt-1">
                        {formatMoney(totals.totalPrice)}
                      </div>

                      {totals.totalSavings > 0 && (
                        <div className="mt-1.5 text-xs font-medium text-[#15803D] font-mono tabular-nums">
                          You save {formatMoney(totals.totalSavings)} ({totals.savingsPercent}%) off MRP{' '}
                          {formatMoney(totals.totalMrp)}
                        </div>
                      )}

                      <div className="mt-4 divide-y divide-[#EDF2EE] border-t border-b border-[#EDF2EE]">
                        <div className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-[#4A5D54]">Total Quantity</span>
                          <strong className="font-mono font-bold text-[#14211B] tabular-nums">
                            {totals.totalQty}
                          </strong>
                        </div>
                        <div className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-[#4A5D54]">Total Volume Points</span>
                          <strong className="font-mono font-bold text-[#1E562A] tabular-nums">
                            {totals.totalVp.toFixed(2)} VP
                          </strong>
                        </div>
                        <div className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-[#4A5D54]">Total MRP Value</span>
                          <span className="font-mono font-semibold text-[#5A6B63] tabular-nums">
                            {formatMoney(totals.totalMrp)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 p-3 rounded-lg bg-[#EDF7F0] text-xs text-[#2F3E37] flex items-center justify-between">
                        <span>Selected Price Tier:</span>
                        <strong className="font-bold text-[#1E562A]">{tierLabel(tier)}</strong>
                      </div>

                      {/* Live All-Tier Comparison Breakdown */}
                      {cartEntries.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#EDF2EE]">
                          <div className="text-xs font-bold text-[#4A5D54] mb-2">
                            Compare Cart Across Tiers
                          </div>
                          <div className="space-y-1">
                            {visibleTiers.map((tKey) => {
                              const isCurrent = tier === tKey;
                              const amount = totals.byTier[tKey];
                              return (
                                <button
                                  key={tKey}
                                  type="button"
                                  onClick={() => setTier(tKey)}
                                  className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isCurrent
                                      ? 'bg-[#1E562A] text-white font-bold'
                                      : 'hover:bg-[#F4F7F5] text-[#2F3E37]'
                                  }`}
                                >
                                  <span>{tierLabel(tKey)}</span>
                                  <span className="font-mono tabular-nums">{formatMoney(amount)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-5 space-y-2">
                        <button
                          type="button"
                          onClick={handleSavePdf}
                          className="w-full py-2.5 px-4 bg-[#1E562A] hover:bg-[#164220] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Save PDF / Print Invoice</span>
                        </button>

                        {cartEntries.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={getWhatsAppShareUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp Bill</span>
                            </a>
                            <button
                              type="button"
                              onClick={handleCopySummary}
                              className="py-2 px-3 bg-[#F4F7F5] hover:bg-[#E4ECE7] text-[#14211B] border border-[#C5D3CB] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Summary</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </aside>
                </section>
              </>
            )}

            {/* TAB 2: FULL PRICE LIST CATALOG VIEW */}
            {activeTab === 'catalog' && (
              <section className="bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#EDF2EE] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#14211B]">
                        Complete Herbalife Price & VP Catalog ({filteredCatalog.length} of{' '}
                        {activeProductsWithIndices.length} Products)
                      </h2>
                      <p className="text-xs text-[#5A6B63]">
                        Click any product's + button to add it directly to your calculation cart. Active price column:{' '}
                        <strong>{tierLabel(tier)}</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-[#5A6B63] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Filter catalog..."
                          className="w-full h-9 pl-9 pr-8 text-xs bg-[#F4F7F5] border border-[#C5D3CB] rounded-lg outline-none focus:bg-white focus:border-[#1E562A]"
                        />
                        {catalogSearch && (
                          <button
                            type="button"
                            onClick={() => setCatalogSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6B63] hover:text-[#14211B] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <select
                        value={catalogSort}
                        onChange={(e) => setCatalogSort(e.target.value as typeof catalogSort)}
                        aria-label="Sort products"
                        className="h-9 px-2.5 text-xs font-medium bg-[#F4F7F5] border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A] cursor-pointer"
                      >
                        <option value="default">Default Order</option>
                        <option value="name">Name (A–Z)</option>
                        <option value="vp-desc">Volume Points (High–Low)</option>
                        <option value="price-asc">Price (Low–High)</option>
                        <option value="price-desc">Price (High–Low)</option>
                      </select>
                    </div>
                  </div>

                  {/* Category Segmented Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#1E562A] text-white'
                            : 'bg-[#F4F7F5] text-[#4A5D54] hover:bg-[#E4ECE7]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4F7F5] border-b border-[#DCE5DF] text-[11px] font-bold text-[#4A5D54]">
                        <th className="py-3 px-4">Stock No</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-3 text-right">VP</th>
                        <th className="py-3 px-3 text-right">{tierLabel('mrp')}</th>
                        <th className="py-3 px-3 text-right text-[#1E562A]">
                          {tierLabel(tier)} (Active)
                        </th>
                        <th className="py-3 px-4 text-right">Add to Cart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2EE] text-xs sm:text-sm">
                      {filteredCatalog.map(({ p, index, category }) => {
                        const qtyInCart = cart.get(index) || 0;
                        const activePrice = getProductPrice(p, tier);
                        return (
                          <tr key={p.id || index} className="hover:bg-[#F9FCFA] transition-colors">
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-[#5A6B63] whitespace-nowrap">
                              {p.code || '—'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#14211B]">{p.name}</div>
                              <div className="text-[11px] text-[#687771]">{category}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#2F3E37] whitespace-nowrap">
                              {Number(p.vp).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-[#5A6B63] whitespace-nowrap">
                              {formatMoney(p.mrp)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-[#1E562A] whitespace-nowrap bg-[#EDF7F0]/50">
                              {formatMoney(activePrice)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {qtyInCart === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => addToCart(index, false)}
                                  className="px-3 py-1.5 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </button>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => changeQty(index, -1)}
                                    className="w-7 h-7 rounded border border-[#C5D3CB] bg-white hover:bg-[#F4F7F5] flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-mono text-xs font-bold tabular-nums">
                                    {qtyInCart}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => changeQty(index, 1)}
                                    className="w-7 h-7 rounded border border-[#C5D3CB] bg-white hover:bg-[#F4F7F5] flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TAB 4: SAVED QUOTES HISTORY */}
            {activeTab === 'quotes' && (
              <section className="bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#EDF2EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#14211B]">
                      Saved Customer Quotes ({savedQuotes.length})
                    </h2>
                    <p className="text-xs text-[#5A6B63]">
                      Quotes are saved automatically in your browser when you click Save PDF or click Save Current Quote below.
                    </p>
                  </div>
                  {cartEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={saveQuoteToHistory}
                      className="px-3.5 py-2 text-xs font-bold bg-[#1E562A] text-white rounded-lg hover:bg-[#164220] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                      + Save Current Cart as Quote
                    </button>
                  )}
                </div>

                {savedQuotes.length === 0 ? (
                  <div className="py-14 px-6 text-center">
                    <History className="w-10 h-10 text-[#9EB2A7] mx-auto mb-3 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-[#2F3E37]">No saved quotes yet</p>
                    <p className="text-xs text-[#687771] mt-1">
                      Add products to your calculator and click "Save PDF" to keep a record of customer estimates.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EDF2EE]">
                    {savedQuotes.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFDFB]"
                      >
                        <div>
                          <div className="text-sm font-bold text-[#14211B]">
                            {q.customerName}
                            {q.customerPhone && (
                              <span className="font-mono text-xs font-normal text-[#5A6B63] ml-2">
                                · {q.customerPhone}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#5A6B63] mt-0.5 font-mono tabular-nums">
                            {q.createdAt} · Tier: {tierLabel(q.tier)} · {q.totalQty} units ·{' '}
                            {q.totalVp.toFixed(2)} VP
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-extrabold text-[#1E562A] tabular-nums">
                            {formatMoney(q.totalPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => loadSavedQuote(q)}
                            className="px-3 py-1.5 text-xs font-bold bg-[#EDF7F0] hover:bg-[#1E562A] text-[#1E562A] hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Load Quote
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSavedQuote(q.id)}
                            aria-label="Delete saved quote"
                            className="p-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Bilingual Attribution & Disclaimer Footer (Customizable from Admin Panel) */}
      <footer className="no-print mt-auto py-6 px-4 text-center text-[#5A6B63] text-xs leading-relaxed border-t border-[#DCE5DF] bg-white">
        <div className="max-w-[900px] mx-auto space-y-1">
          {settings.footerLine1 && <p>{settings.footerLine1}</p>}
          {settings.footerLine2 && (
            <p className="font-semibold text-[#2F3E37]">{settings.footerLine2}</p>
          )}
        </div>
      </footer>

      {/* Floating WhatsApp Help Button (Customizable from Admin Panel) */}
      {settings.whatsappEnabled && (
        <a
          href={whatsappHelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="no-print fixed left-5 bottom-5 z-40 bg-[#25D366] hover:bg-[#1EBE5B] text-white px-4 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>{settings.whatsappButtonLabel || 'Help'}</span>
        </a>
      )}

      {/* INVOICE / PDF PREVIEW MODAL */}
      {invoiceModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCE5DF] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#1E562A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="text-base font-bold">Customer Estimate / PDF Invoice Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#DCE5DF]">
                <div>
                  <div className="text-xl font-extrabold text-[#1E562A]">
                    {settings.invoiceTitle}
                  </div>
                  <div className="text-xs text-[#5A6B63]">{settings.invoiceSubtitle}</div>
                </div>
                <div className="text-right text-xs text-[#4A5D54] space-y-0.5 font-mono">
                  <div>
                    Date:{' '}
                    {new Date().toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div>Selected Tier: {tierLabel(tier)}</div>
                  {settings.distributorName && (
                    <div>Prepared By: {settings.distributorName}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F7F5] p-4 rounded-xl text-xs sm:text-sm">
                <div>
                  <span className="text-[#5A6B63] block text-xs">Customer Name</span>
                  <strong className="text-[#14211B] font-bold">{customerName || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#5A6B63] block text-xs">Phone Number</span>
                  <strong className="text-[#14211B] font-mono">{customerPhone || '—'}</strong>
                </div>
              </div>

              {cartEntries.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#687771]">
                  No products in cart. Add products before printing.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#DCE5DF] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F4F7F5] border-b border-[#DCE5DF] text-[#4A5D54] font-bold">
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">VP</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2EE]">
                      {cartEntries.map((item) => (
                        <tr key={item.index}>
                          <td className="py-2.5 px-3 font-mono text-[#5A6B63]">
                            {item.product.code || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#14211B]">
                            {item.product.name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold tabular-nums">
                            {item.qty}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {item.lineVp.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                            {formatMoney(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-2">
                <div className="text-[11px] text-[#687771] max-w-sm leading-relaxed">
                  {settings.footerLine1}
                </div>
                <div className="w-full sm:w-64 bg-[#F4F7F5] p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#5A6B63]">Total Quantity:</span>
                    <strong className="font-mono tabular-nums">{totals.totalQty}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6B63]">Total Volume Points:</span>
                    <strong className="font-mono tabular-nums text-[#1E562A]">
                      {totals.totalVp.toFixed(2)} VP
                    </strong>
                  </div>
                  {totals.totalSavings > 0 && (
                    <div className="flex justify-between text-[#15803D]">
                      <span>Savings vs MRP:</span>
                      <strong className="font-mono tabular-nums">
                        -{formatMoney(totals.totalSavings)}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-[#14211B] pt-2 border-t border-[#DCE5DF]">
                    <span>Grand Total:</span>
                    <span className="font-mono tabular-nums text-[#1E562A]">
                      {formatMoney(totals.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-[#F4F7F5] border-t border-[#DCE5DF] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#4A5D54] hover:text-[#14211B] cursor-pointer"
              >
                Close
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-[#1E562A] bg-white border border-[#1E562A] hover:bg-[#EDF7F0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Quote</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdfFile}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E562A] hover:bg-[#164220] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF File (.pdf)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINT-ONLY LAYOUT */}
      <div className="hidden print-only p-6 text-black bg-white">
        <div className="flex items-start justify-between border-b-2 border-[#1E562A] pb-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#1E562A]">{settings.invoiceTitle}</h1>
            <p className="text-xs text-gray-600">{settings.invoiceSubtitle}</p>
          </div>
          <div className="text-right text-xs font-mono">
            <div>
              Date:{' '}
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div>
              Selected Price: <strong>{tierLabel(tier)}</strong>
            </div>
          </div>
        </div>

        <div className="mb-4 py-2 px-3 bg-gray-100 rounded flex justify-between text-xs">
          <div>
            <strong>Customer Name:</strong> {customerName || '—'}
          </div>
          <div>
            <strong>Phone Number:</strong> {customerPhone || '—'}
          </div>
        </div>

        <table className="w-full text-left border-collapse text-xs mb-6">
          <thead>
            <tr className="border-b border-gray-400 font-bold">
              <th className="py-2 px-2">Stock No</th>
              <th className="py-2 px-2">Product Name</th>
              <th className="py-2 px-2 text-right">Unit Price ({tierLabel(tier)})</th>
              <th className="py-2 px-2 text-center">Qty</th>
              <th className="py-2 px-2 text-right">Volume Points</th>
              <th className="py-2 px-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {cartEntries.map((item) => (
              <tr key={item.index} className="border-b border-gray-200">
                <td className="py-2 px-2 font-mono">{item.product.code || '—'}</td>
                <td className="py-2 px-2 font-semibold">{item.product.name}</td>
                <td className="py-2 px-2 text-right font-mono">{formatMoney(item.unitPrice)}</td>
                <td className="py-2 px-2 text-center font-mono font-bold">{item.qty}</td>
                <td className="py-2 px-2 text-right font-mono">{item.lineVp.toFixed(2)} VP</td>
                <td className="py-2 px-2 text-right font-mono font-bold">
                  {formatMoney(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-64 border border-gray-300 rounded p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total Items:</span>
            <strong className="font-mono">{totals.itemCount}</strong>
          </div>
          <div className="flex justify-between">
            <span>Total Quantity:</span>
            <strong className="font-mono">{totals.totalQty}</strong>
          </div>
          <div className="flex justify-between">
            <span>Total Volume Points:</span>
            <strong className="font-mono">{totals.totalVp.toFixed(2)} VP</strong>
          </div>
          <div className="flex justify-between text-base font-extrabold border-t border-gray-300 pt-2 mt-2">
            <span>Grand Total:</span>
            <span className="font-mono">{formatMoney(totals.totalPrice)}</span>
          </div>
        </div>

        <div className="mt-8 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-500">
          {settings.footerLine1}
          <br />
          {settings.footerLine2}
        </div>
      </div>
    </div>
  );
}
