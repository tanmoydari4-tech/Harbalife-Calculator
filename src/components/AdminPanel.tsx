import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Lock,
  Unlock,
  Check,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Wand2,
  Percent,
  Settings,
  Package,
  MessageCircle,
  FileText,
  ShieldCheck,
  Table
} from 'lucide-react';
import {
  ProductItem,
  SiteSettings,
  PriceTierKey,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  inferCategory,
} from '../data/defaultConfig';

interface AdminPanelProps {
  products: ProductItem[];
  settings: SiteSettings;
  onSaveAll: (newProducts: ProductItem[], newSettings: SiteSettings, message?: string) => Promise<void>;
  onResetDefaults: (target: 'products' | 'settings' | 'all') => Promise<void>;
  formatMoney: (n: number) => string;
}

const ALL_TIER_KEYS: PriceTierKey[] = ['mrp', 'retail', 'earnBase', 'p25', 'p35', 'p42', 'p50'];

const EMPTY_PRODUCT: ProductItem = {
  id: '',
  code: '',
  name: '',
  category: 'Targeted Nutrition',
  vp: 10,
  mrp: 1000,
  retail: 950,
  earnBase: 800,
  p25: 800,
  p35: 720,
  p42: 664,
  p50: 600,
  active: true,
};

export default function AdminPanel({
  products,
  settings,
  onSaveAll,
  onResetDefaults,
  formatMoney,
}: AdminPanelProps) {
  // Admin authentication state (stored in sessionStorage so admin doesn't re-enter PIN on every tab switch)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('hl_admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Admin sub-navigation
  const [subTab, setSubTab] = useState<'products' | 'site' | 'invoice' | 'footer' | 'backup'>('products');

  // Local editable state for settings
  const [draftSettings, setDraftSettings] = useState<SiteSettings>(settings);
  const [quickTagsInput, setQuickTagsInput] = useState<string>(settings.quickFilterTags.join(', '));

  // Product management states
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('All');
  const [spreadsheetMode, setSpreadsheetMode] = useState<boolean>(false);
  const [draftProducts, setDraftProducts] = useState<ProductItem[]>(products);

  // Add / Edit single product modal state
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // -1 means new product
  const [productForm, setProductForm] = useState<ProductItem>(EMPTY_PRODUCT);

  // Bulk price adjustment state
  const [bulkPercent, setBulkPercent] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<string>('All');
  const [showBulkConfirm, setShowBulkConfirm] = useState<boolean>(false);

  // Inline confirmation states (no window.confirm)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [resetConfirmTarget, setResetConfirmTarget] = useState<'products' | 'settings' | 'all' | null>(null);

  // Import JSON / data.js state
  const [importText, setImportText] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [newPin, setNewPin] = useState<string>(settings.adminPin || '1234');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Keep draft states synced when props update externally
  React.useEffect(() => {
    setDraftProducts(products);
  }, [products]);

  React.useEffect(() => {
    setDraftSettings(settings);
    setQuickTagsInput(settings.quickFilterTags.join(', '));
    setNewPin(settings.adminPin || '1234');
  }, [settings]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = settings.adminPin || '1234';
    if (pinInput.trim() === expectedPin) {
      setIsUnlocked(true);
      sessionStorage.setItem('hl_admin_unlocked', 'true');
      setPinError('');
      setPinInput('');
    } else {
      setPinError('ভুল পিন! সঠিক Admin PIN দিন (Default PIN: 1234)');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('hl_admin_unlocked');
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>([
      'All',
      'Core Shakes & Protein',
      'Energy & Sports (H24)',
      'Digestive & Aloe',
      'Skin & Outer Nutrition',
      'Targeted Nutrition',
    ]);
    draftProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [draftProducts]);

  // Filtered products in admin table
  const filteredAdminProducts = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/) : [];
    return draftProducts
      .map((p, index) => ({ p, index }))
      .filter(({ p }) => {
        const cat = p.category || inferCategory(p.name);
        if (adminCategoryFilter !== 'All' && cat !== adminCategoryFilter) return false;
        if (tokens.length === 0) return true;
        const text = `${p.code || ''} ${p.name || ''} ${cat}`.toLowerCase();
        return tokens.every((t) => text.includes(t));
      });
  }, [draftProducts, adminSearch, adminCategoryFilter]);

  // Open modal to add new product
  const openAddProductModal = () => {
    setProductForm({
      ...EMPTY_PRODUCT,
      id: `prod_${Date.now()}`,
    });
    setEditingIndex(-1);
  };

  // Open modal to edit existing product
  const openEditProductModal = (index: number) => {
    const target = draftProducts[index];
    if (!target) return;
    setProductForm({
      ...target,
      category: target.category || inferCategory(target.name),
      active: target.active !== false,
    });
    setEditingIndex(index);
  };

  // Auto-calculate discount tiers from MRP & Earn Base
  const handleAutoCalculateTiers = () => {
    const mrp = Number(productForm.mrp) || 0;
    const earnBase = Number(productForm.earnBase) || Math.round(mrp * 0.815);
    const taxOrDiff = Math.max(0, mrp - earnBase);
    // Herbalife standard tier structure approximations based on MRP & Earn Base
    const retail = Math.round(mrp * 0.952);
    const p25 = Math.round(earnBase * 0.75 + taxOrDiff * 0.91);
    const p35 = Math.round(earnBase * 0.65 + taxOrDiff * 0.86);
    const p42 = Math.round(earnBase * 0.58 + taxOrDiff * 0.82);
    const p50 = Math.round(earnBase * 0.5 + taxOrDiff * 0.78);

    setProductForm((prev) => ({
      ...prev,
      earnBase,
      retail,
      p25,
      p35,
      p42,
      p50,
    }));
  };

  // Save single product from modal
  const handleSaveProductModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const cleaned: ProductItem = {
      id: productForm.id || `prod_${Date.now()}`,
      code: (productForm.code || '').trim(),
      name: productForm.name.trim(),
      category: (productForm.category || inferCategory(productForm.name)).trim(),
      vp: Number(productForm.vp) || 0,
      mrp: Number(productForm.mrp) || 0,
      retail: Number(productForm.retail) || 0,
      earnBase: Number(productForm.earnBase) || 0,
      p25: Number(productForm.p25) || 0,
      p35: Number(productForm.p35) || 0,
      p42: Number(productForm.p42) || 0,
      p50: Number(productForm.p50) || 0,
      active: productForm.active !== false,
    };

    const nextProducts = [...draftProducts];
    if (editingIndex === -1) {
      nextProducts.unshift(cleaned);
    } else if (editingIndex !== null && editingIndex >= 0) {
      nextProducts[editingIndex] = cleaned;
    }

    setDraftProducts(nextProducts);
    setEditingIndex(null);
    setIsSaving(true);
    await onSaveAll(
      nextProducts,
      draftSettings,
      editingIndex === -1 ? `Added "${cleaned.name}"` : `Updated "${cleaned.name}"`
    );
    setIsSaving(false);
  };

  // Duplicate product
  const handleDuplicateProduct = async (index: number) => {
    const source = draftProducts[index];
    if (!source) return;
    const copy: ProductItem = {
      ...source,
      id: `prod_${Date.now()}`,
      name: `${source.name} (Copy)`,
    };
    const nextProducts = [...draftProducts];
    nextProducts.splice(index + 1, 0, copy);
    setDraftProducts(nextProducts);
    await onSaveAll(nextProducts, draftSettings, `Duplicated "${source.name}"`);
  };

  // Toggle product visibility
  const handleToggleProductActive = async (index: number) => {
    const nextProducts = [...draftProducts];
    const current = nextProducts[index];
    if (!current) return;
    nextProducts[index] = { ...current, active: current.active === false ? true : false };
    setDraftProducts(nextProducts);
    await onSaveAll(
      nextProducts,
      draftSettings,
      nextProducts[index].active ? `Enabled "${current.name}"` : `Hidden "${current.name}"`
    );
  };

  // Move product up/down
  const handleMoveProduct = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftProducts.length) return;
    const nextProducts = [...draftProducts];
    const temp = nextProducts[index];
    nextProducts[index] = nextProducts[targetIndex];
    nextProducts[targetIndex] = temp;
    setDraftProducts(nextProducts);
    await onSaveAll(nextProducts, draftSettings, 'Product order updated');
  };

  // Delete product
  const handleConfirmDeleteProduct = async (index: number) => {
    const target = draftProducts[index];
    const nextProducts = draftProducts.filter((_, i) => i !== index);
    setDraftProducts(nextProducts);
    setDeleteConfirmIndex(null);
    await onSaveAll(nextProducts, draftSettings, `Deleted "${target?.name || 'Product'}"`);
  };

  // Update inline spreadsheet cell
  const updateSpreadsheetCell = (index: number, field: keyof ProductItem, rawValue: string | boolean) => {
    setDraftProducts((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (
        field === 'vp' ||
        field === 'mrp' ||
        field === 'retail' ||
        field === 'earnBase' ||
        field === 'p25' ||
        field === 'p35' ||
        field === 'p42' ||
        field === 'p50'
      ) {
        item[field] = Number(rawValue) || 0;
      } else if (field === 'active') {
        item.active = Boolean(rawValue);
      } else if (field === 'code' || field === 'name' || field === 'category') {
        item[field] = String(rawValue);
      }
      next[index] = item;
      return next;
    });
  };

  const handleSaveSpreadsheetChanges = async () => {
    setIsSaving(true);
    await onSaveAll(draftProducts, draftSettings, 'All spreadsheet product edits saved');
    setIsSaving(false);
  };

  // Bulk percentage adjustment across products
  const handleApplyBulkAdjustment = async () => {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct) || pct === 0) return;
    const multiplier = 1 + pct / 100;

    const nextProducts = draftProducts.map((p) => {
      const cat = p.category || inferCategory(p.name);
      if (bulkCategory !== 'All' && cat !== bulkCategory) return p;
      return {
        ...p,
        mrp: Math.round(p.mrp * multiplier),
        retail: Math.round(p.retail * multiplier),
        earnBase: Math.round(p.earnBase * multiplier),
        p25: Math.round(p.p25 * multiplier),
        p35: Math.round(p.p35 * multiplier),
        p42: Math.round(p.p42 * multiplier),
        p50: Math.round(p.p50 * multiplier),
      };
    });

    setDraftProducts(nextProducts);
    setShowBulkConfirm(false);
    setBulkPercent('');
    await onSaveAll(
      nextProducts,
      draftSettings,
      `Applied ${pct > 0 ? '+' : ''}${pct}% price update to ${bulkCategory} products`
    );
  };

  // Save Site / Invoice / Footer Settings
  const handleSaveSettingsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = quickTagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedSettings: SiteSettings = {
      ...draftSettings,
      quickFilterTags: parsedTags.length > 0 ? parsedTags : DEFAULT_SETTINGS.quickFilterTags,
      adminPin: newPin.trim() || '1234',
    };

    setDraftSettings(updatedSettings);
    setIsSaving(true);
    await onSaveAll(draftProducts, updatedSettings, 'Website settings saved successfully');
    setIsSaving(false);
  };

  // Export data.js (100% compatible with easy-anytime.netlify.app/data.js)
  const handleDownloadDataJs = () => {
    const cleanArray = draftProducts
      .filter((p) => p.active !== false)
      .map((p) => ({
        code: p.code || '',
        name: p.name,
        vp: Number(p.vp),
        mrp: Number(p.mrp),
        retail: Number(p.retail),
        earnBase: Number(p.earnBase),
        p25: Number(p.p25),
        p35: Number(p.p35),
        p42: Number(p.p42),
        p50: Number(p.p50),
      }));

    const jsContent = `const PRODUCTS = ${JSON.stringify(cleanArray, null, 2)};\n`;
    const blob = new Blob([jsContent], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export CSV for Excel
  const handleDownloadCsv = () => {
    const headers = ['Code', 'Product Name', 'Category', 'VP', 'MRP', 'Retail', 'EarnBase', '25%', '35%', '42%', '50%', 'Active'];
    const rows = draftProducts.map((p) => [
      `"${(p.code || '').replace(/"/g, '""')}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || inferCategory(p.name)).replace(/"/g, '""')}"`,
      p.vp,
      p.mrp,
      p.retail,
      p.earnBase,
      p.p25,
      p.p35,
      p.p42,
      p.p50,
      p.active !== false ? 'Yes' : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Herbalife_Price_List.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Full JSON Backup
  const handleDownloadJsonBackup = () => {
    const payload = {
      products: draftProducts,
      settings: draftSettings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Herbalife_Calculator_Full_Backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON or data.js
  const handleImportData = async () => {
    setImportError('');
    const raw = importText.trim();
    if (!raw) {
      setImportError('Please paste JSON or data.js content first.');
      return;
    }

    try {
      // Support pasting `const PRODUCTS = [...]` directly from data.js
      const cleaned = raw
        .replace(/^const\s+PRODUCTS\s*=\s*/i, '')
        .replace(/;\s*$/, '');
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        const importedProducts: ProductItem[] = parsed.map((p, idx) => ({
          id: p.id || `prod_${Date.now()}_${idx}`,
          code: String(p.code ?? ''),
          name: String(p.name ?? 'Unnamed Product'),
          category: p.category || inferCategory(String(p.name ?? '')),
          vp: Number(p.vp ?? 0),
          mrp: Number(p.mrp ?? 0),
          retail: Number(p.retail ?? 0),
          earnBase: Number(p.earnBase ?? 0),
          p25: Number(p.p25 ?? 0),
          p35: Number(p.p35 ?? 0),
          p42: Number(p.p42 ?? 0),
          p50: Number(p.p50 ?? 0),
          active: p.active !== false,
        }));
        setDraftProducts(importedProducts);
        setImportText('');
        await onSaveAll(importedProducts, draftSettings, `Imported ${importedProducts.length} products`);
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.products)) {
        const nextProducts = parsed.products;
        const nextSettings = parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : draftSettings;
        setDraftProducts(nextProducts);
        setDraftSettings(nextSettings);
        setImportText('');
        await onSaveAll(nextProducts, nextSettings, 'Full backup restored successfully');
      } else {
        setImportError('Invalid format. Paste either a PRODUCTS array or a Full Backup JSON object.');
      }
    } catch {
      setImportError('Could not parse JSON / data.js. Please check syntax.');
    }
  };

  // Lock Screen if Admin is not unlocked yet
  if (!isUnlocked) {
    return (
      <section className="max-w-md mx-auto my-8 bg-white border border-[#DCE5DF] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-[#EDF7F0] text-[#1E562A] flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-[#14211B]">Admin Panel Login</h2>
        <p className="text-xs text-[#5A6B63] mt-1">
          অ্যাডমিন প্যানেল থেকে প্রোডাক্ট, দাম (MRP, 25%, 35%, 42%, 50%), VP, WhatsApp নম্বর ও ওয়েবসাইটের সব তথ্য আপডেট করতে Admin PIN দিন।
        </p>

        <form onSubmit={handleUnlock} className="mt-5 space-y-4">
          <div>
            <label htmlFor="adminPinInput" className="block text-xs font-bold text-[#4A5D54] mb-1.5">
              Enter Admin PIN / Password
            </label>
            <input
              id="adminPinInput"
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="Enter PIN (Default: 1234)"
              className="w-full h-11 px-3.5 text-sm font-mono bg-white border border-[#C5D3CB] rounded-xl outline-none focus:border-[#1E562A] focus:ring-3 focus:ring-[#1E562A]/15"
            />
            {pinError && <p className="text-xs font-semibold text-[#DC2626] mt-1.5">{pinError}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#1E562A] hover:bg-[#164220] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Login to Admin Panel</span>
          </button>

          <div className="p-3 rounded-lg bg-[#F4F7F5] text-[11px] text-[#5A6B63] text-center">
            Default Admin PIN: <strong className="font-mono text-[#14211B]">1234</strong> (লগইন করার পর আপনি নতুন PIN সেট করতে পারবেন)
          </div>
        </form>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin Top Header & Sub-Navigation */}
      <section className="bg-white border border-[#DCE5DF] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDF2EE]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#14211B]">
                Master Admin Control Panel
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#EDF7F0] text-[#15803D] border border-[#B5DEC1]">
                Logged In
              </span>
            </div>
            <p className="text-xs text-[#5A6B63] mt-0.5">
              এখান থেকে আপনি সব প্রোডাক্ট, দাম, VP, নতুন প্রোডাক্ট যোগ করা, হেডার, ফুটার এবং WhatsApp সেটিংস সাথে সাথে আপডেট করতে পারবেন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadDataJs}
              className="px-3 py-2 text-xs font-bold text-[#1E562A] bg-[#EDF7F0] hover:bg-[#D8EFE0] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export data.js</span>
            </button>
            <button
              type="button"
              onClick={handleLock}
              className="px-3.5 py-2 text-xs font-bold text-[#B91C1C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('products')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'products'
                ? 'bg-[#1E562A] text-white'
                : 'bg-[#F4F7F5] text-[#2F3E37] hover:bg-[#E4ECE7]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. Products & Prices ({draftProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('site')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'site'
                ? 'bg-[#1E562A] text-white'
                : 'bg-[#F4F7F5] text-[#2F3E37] hover:bg-[#E4ECE7]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>2. Site, Tiers & Search</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('invoice')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'invoice'
                ? 'bg-[#1E562A] text-white'
                : 'bg-[#F4F7F5] text-[#2F3E37] hover:bg-[#E4ECE7]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>3. Customer, PDF & WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('footer')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'footer'
                ? 'bg-[#1E562A] text-white'
                : 'bg-[#F4F7F5] text-[#2F3E37] hover:bg-[#E4ECE7]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Footer & Credits</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('backup')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'backup'
                ? 'bg-[#1E562A] text-white'
                : 'bg-[#F4F7F5] text-[#2F3E37] hover:bg-[#E4ECE7]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Backup, Import & PIN</span>
          </button>
        </div>
      </section>

      {/* SUB-TAB 1: PRODUCTS & PRICES MANAGER */}
      {subTab === 'products' && (
        <section className="bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-[#EDF2EE] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#14211B]">
                  Manage All Products, Volume Points & Tier Prices
                </h3>
                <p className="text-xs text-[#5A6B63]">
                  নতুন প্রোডাক্ট যোগ করুন, যেকোনো প্রোডাক্টের দাম/VP পরিবর্তন করুন, অথবা এক ক্লিকে সব প্রোডাক্টের দাম আপডেট করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSpreadsheetMode((v) => !v)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    spreadsheetMode
                      ? 'bg-[#14211B] text-white border-[#14211B]'
                      : 'bg-white text-[#2F3E37] border-[#C5D3CB] hover:bg-[#F4F7F5]'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{spreadsheetMode ? 'Exit Spreadsheet Mode' : 'Fast Spreadsheet Edit Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="px-4 py-2 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Search, Filter & Bulk Price Updater Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-[#5A6B63] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search by stock code or product name..."
                  className="w-full h-10 pl-10 pr-8 text-xs sm:text-sm bg-[#F4F7F5] border border-[#C5D3CB] rounded-lg outline-none focus:bg-white focus:border-[#1E562A]"
                />
                {adminSearch && (
                  <button
                    type="button"
                    onClick={() => setAdminSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6B63] hover:text-[#14211B] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="lg:col-span-3">
                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-semibold bg-[#F4F7F5] border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk % Price Adjuster */}
              <div className="lg:col-span-4 flex items-center gap-1.5 bg-[#F4F7F5] p-1.5 rounded-lg border border-[#DCE5DF]">
                <Percent className="w-4 h-4 text-[#1E562A] ml-1.5 shrink-0" />
                <input
                  type="number"
                  step="0.5"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(e.target.value)}
                  placeholder="Bulk % (e.g. 5 or -3)"
                  className="w-full h-7 px-2 text-xs font-mono bg-white border border-[#C5D3CB] rounded outline-none focus:border-[#1E562A]"
                />
                {!showBulkConfirm ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkPercent && !isNaN(parseFloat(bulkPercent))) {
                        setBulkCategory(adminCategoryFilter);
                        setShowBulkConfirm(true);
                      }
                    }}
                    className="px-2.5 h-7 text-xs font-bold bg-[#1E562A] text-white rounded hover:bg-[#164220] whitespace-nowrap cursor-pointer"
                  >
                    Apply %
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleApplyBulkAdjustment}
                      className="px-2 h-7 text-[11px] font-bold bg-[#15803D] text-white rounded cursor-pointer whitespace-nowrap"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkConfirm(false)}
                      className="px-1.5 h-7 text-[11px] text-[#5A6B63] cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {spreadsheetMode && (
              <div className="p-3 bg-[#EDF7F0] border border-[#B5DEC1] rounded-lg flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1E562A]">
                  Spreadsheet Mode Active: নিচের টেবিলে যেকোনো ঘর পরিবর্তন করার পর ডানপাশের "Save All Table Changes" বাটনে ক্লিক করুন।
                </span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveSpreadsheetChanges}
                  className="px-4 py-1.5 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save All Table Changes'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F7F5] border-b border-[#DCE5DF] text-[11px] font-bold text-[#4A5D54]">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3 min-w-[220px]">Product Name & Category</th>
                  <th className="py-3 px-2 text-right">VP</th>
                  <th className="py-3 px-2 text-right">MRP</th>
                  <th className="py-3 px-2 text-right">Retail</th>
                  <th className="py-3 px-2 text-right">Earn Base</th>
                  <th className="py-3 px-2 text-right">25%</th>
                  <th className="py-3 px-2 text-right bg-[#EDF7F0] text-[#1E562A]">35%</th>
                  <th className="py-3 px-2 text-right">42%</th>
                  <th className="py-3 px-2 text-right">50%</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2EE] text-xs">
                {filteredAdminProducts.map(({ p, index }) => {
                  const isHidden = p.active === false;
                  if (spreadsheetMode) {
                    return (
                      <tr key={p.id || index} className={isHidden ? 'opacity-50 bg-gray-50' : 'hover:bg-[#F9FCFA]'}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={p.code || ''}
                            onChange={(e) => updateSpreadsheetCell(index, 'code', e.target.value)}
                            className="w-16 px-2 py-1 font-mono text-xs border border-[#C5D3CB] rounded bg-white"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateSpreadsheetCell(index, 'name', e.target.value)}
                            className="w-full px-2 py-1 font-semibold text-xs border border-[#C5D3CB] rounded bg-white"
                          />
                        </td>
                        {(['vp', 'mrp', 'retail', 'earnBase', 'p25', 'p35', 'p42', 'p50'] as const).map((field) => (
                          <td key={field} className="p-1.5">
                            <input
                              type="number"
                              step={field === 'vp' ? '0.05' : '1'}
                              value={p[field]}
                              onChange={(e) => updateSpreadsheetCell(index, field, e.target.value)}
                              className="w-20 px-2 py-1 text-right font-mono text-xs border border-[#C5D3CB] rounded bg-white tabular-nums"
                            />
                          </td>
                        ))}
                        <td className="p-1.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(index)}
                            className="px-2 py-1 text-xs font-bold text-[#1E562A] hover:underline cursor-pointer"
                          >
                            Full Edit
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={p.id || index}
                      className={`transition-colors ${
                        isHidden ? 'bg-gray-50 text-gray-400' : 'hover:bg-[#F9FCFA]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#5A6B63]">
                        {p.code || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#14211B] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isHidden && (
                            <span className="text-[10px] font-normal text-[#B91C1C]">(Hidden)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#687771]">
                          {p.category || inferCategory(p.name)}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold text-[#1E562A]">
                        {Number(p.vp).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">{formatMoney(p.mrp)}</td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">{formatMoney(p.retail)}</td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#5A6B63]">
                        {formatMoney(p.earnBase)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">{formatMoney(p.p25)}</td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold bg-[#EDF7F0]/50 text-[#1E562A]">
                        {formatMoney(p.p35)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">{formatMoney(p.p42)}</td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold">
                        {formatMoney(p.p50)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {deleteConfirmIndex === index ? (
                          <div className="inline-flex items-center gap-1 bg-[#FEF2F2] px-2 py-1 rounded border border-[#FECACA]">
                            <button
                              type="button"
                              onClick={() => handleConfirmDeleteProduct(index)}
                              className="px-2 py-0.5 text-[11px] font-bold bg-[#DC2626] text-white rounded cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmIndex(null)}
                              className="px-1.5 py-0.5 text-[11px] text-[#4A5D54] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(index)}
                              title="Edit product"
                              className="px-2.5 py-1 text-xs font-bold bg-[#EDF7F0] hover:bg-[#1E562A] text-[#1E562A] hover:text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(index)}
                              title={isHidden ? 'Show in calculator' : 'Hide from calculator'}
                              className="p-1.5 text-[#5A6B63] hover:text-[#14211B] hover:bg-[#F4F7F5] rounded cursor-pointer"
                            >
                              {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(index)}
                              title="Duplicate product"
                              className="p-1.5 text-[#5A6B63] hover:text-[#14211B] hover:bg-[#F4F7F5] rounded cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(index, -1)}
                              disabled={index === 0}
                              title="Move Up"
                              className="p-1 text-[#5A6B63] hover:text-[#14211B] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(index, 1)}
                              disabled={index === draftProducts.length - 1}
                              title="Move Down"
                              className="p-1 text-[#5A6B63] hover:text-[#14211B] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmIndex(index)}
                              title="Delete product"
                              className="p-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Footer of Products Table with Reset Option */}
          <div className="p-4 bg-[#F4F7F5] border-t border-[#DCE5DF] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#5A6B63]">
              Total Products in Database: <strong>{draftProducts.length}</strong> (Active:{' '}
              {draftProducts.filter((p) => p.active !== false).length})
            </span>

            {resetConfirmTarget === 'products' ? (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] px-3 py-1.5 rounded-lg">
                <span className="text-xs font-semibold text-[#991B1B]">
                  Reset all products to default 39 Herbalife items?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await onResetDefaults('products');
                    setResetConfirmTarget(null);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#DC2626] text-white rounded cursor-pointer"
                >
                  Yes, Reset Products
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmTarget(null)}
                  className="px-2 py-1 text-xs text-[#4A5D54] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResetConfirmTarget('products')}
                className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Default 39 Products</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* SUB-TAB 2: SITE, TIERS & SEARCH SETTINGS */}
      {subTab === 'site' && (
        <form onSubmit={handleSaveSettingsForm} className="bg-white border border-[#DCE5DF] rounded-xl p-5 space-y-6">
          <div className="border-b border-[#EDF2EE] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#14211B]">
                Website Branding, Price Tiers & Search Settings
              </h3>
              <p className="text-xs text-[#5A6B63]">
                ওয়েবসাইটের নাম, থিম কালার, ডিফল্ট প্রাইস টিয়ার (25%, 35%, 42%, 50%) এবং সার্চ অপশন কাস্টমাইজ করুন।
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Top Bar Brand Title
              </label>
              <input
                type="text"
                value={draftSettings.brandTitle}
                onChange={(e) => setDraftSettings({ ...draftSettings, brandTitle: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Main Page Heading
              </label>
              <input
                type="text"
                value={draftSettings.pageHeading}
                onChange={(e) => setDraftSettings({ ...draftSettings, pageHeading: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Page Subtitle / Description
              </label>
              <input
                type="text"
                value={draftSettings.pageSubtitle}
                onChange={(e) => setDraftSettings({ ...draftSettings, pageSubtitle: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={draftSettings.currencySymbol}
                onChange={(e) => setDraftSettings({ ...draftSettings, currencySymbol: e.target.value })}
                className="w-full h-10 px-3 text-sm font-mono border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Default Selected Price Tier
              </label>
              <select
                value={draftSettings.defaultTier}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, defaultTier: e.target.value as PriceTierKey })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A] cursor-pointer"
              >
                {ALL_TIER_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {draftSettings.tierLabels[k] || k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Tier Labels & Visibility */}
          <div className="pt-3 border-t border-[#EDF2EE]">
            <h4 className="text-xs font-bold text-[#14211B] mb-2">
              Customize Price Tier Names & Visibility
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {ALL_TIER_KEYS.map((tKey) => (
                <div key={tKey} className="p-3 rounded-lg border border-[#DCE5DF] bg-[#F4F7F5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#5A6B63]">
                      Key: {tKey}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14211B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftSettings.enabledTiers[tKey] !== false}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            enabledTiers: {
                              ...draftSettings.enabledTiers,
                              [tKey]: e.target.checked,
                            },
                          })
                        }
                        className="rounded accent-[#1E562A]"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={draftSettings.tierLabels[tKey] || ''}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        tierLabels: {
                          ...draftSettings.tierLabels,
                          [tKey]: e.target.value,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-bold bg-white border border-[#C5D3CB] rounded outline-none focus:border-[#1E562A]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Search Box & Quick Filter Tags */}
          <div className="pt-3 border-t border-[#EDF2EE] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Product Search Input Placeholder
              </label>
              <input
                type="text"
                value={draftSettings.searchPlaceholder}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, searchPlaceholder: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Quick Filter Buttons (Comma separated)
              </label>
              <input
                type="text"
                value={quickTagsInput}
                onChange={(e) => setQuickTagsInput(e.target.value)}
                placeholder="Formula 1, Protein, Afresh, Aloe, Skin, Calcium"
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Search Help Instruction Text
              </label>
              <input
                type="text"
                value={draftSettings.searchHelpText}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, searchHelpText: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDF2EE] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Site & Tier Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: CUSTOMER, PDF INVOICE & WHATSAPP SETTINGS */}
      {subTab === 'invoice' && (
        <form onSubmit={handleSaveSettingsForm} className="bg-white border border-[#DCE5DF] rounded-xl p-5 space-y-6">
          <div className="border-b border-[#EDF2EE] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#14211B]">
                Customer Form, PDF Invoice & WhatsApp Help Settings
              </h3>
              <p className="text-xs text-[#5A6B63]">
                কাস্টমার ফর্ম, WhatsApp হেল্প নম্বর এবং প্রিন্টেড ইনভয়েসের তথ্য পরিবর্তন করুন।
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                WhatsApp Help Phone Number (with Country Code, e.g. 919433523525)
              </label>
              <input
                type="text"
                value={draftSettings.whatsappNumber}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, whatsappNumber: e.target.value })
                }
                className="w-full h-10 px-3 text-sm font-mono border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                WhatsApp Help Button Text
              </label>
              <input
                type="text"
                value={draftSettings.whatsappButtonLabel}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, whatsappButtonLabel: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                WhatsApp Pre-filled Help Message
              </label>
              <input
                type="text"
                value={draftSettings.whatsappMessage}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, whatsappMessage: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#14211B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.whatsappEnabled}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, whatsappEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#1E562A]"
                />
                <span>Show Floating WhatsApp Help Button on Screen</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#14211B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.requireCustomerNameForPdf}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      requireCustomerNameForPdf: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded accent-[#1E562A]"
                />
                <span>Require Customer Name before Saving PDF</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Customer Name Required Error Message
              </label>
              <input
                type="text"
                value={draftSettings.customerNameErrorMsg}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, customerNameErrorMsg: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                PDF Invoice Brand Header
              </label>
              <input
                type="text"
                value={draftSettings.invoiceTitle}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, invoiceTitle: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                PDF Invoice Subtitle
              </label>
              <input
                type="text"
                value={draftSettings.invoiceSubtitle}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, invoiceSubtitle: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Distributor / Creator Name (Shown on Invoice)
              </label>
              <input
                type="text"
                value={draftSettings.distributorName}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, distributorName: e.target.value })
                }
                className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Distributor Phone / Contact Info
              </label>
              <input
                type="text"
                value={draftSettings.distributorContact}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, distributorContact: e.target.value })
                }
                className="w-full h-10 px-3 text-sm font-mono border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDF2EE] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save WhatsApp & Invoice Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 4: FOOTER & BENGALI DISCLAIMER TEXTS */}
      {subTab === 'footer' && (
        <form onSubmit={handleSaveSettingsForm} className="bg-white border border-[#DCE5DF] rounded-xl p-5 space-y-5">
          <div className="border-b border-[#EDF2EE] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#14211B]">
                Footer & Disclaimer Text Settings
              </h3>
              <p className="text-xs text-[#5A6B63]">
                ওয়েবসাইটের নিচের বাংলা ডিসক্লেইমার এবং তৈরি করার ক্রেডিট টেক্সট পরিবর্তন করুন।
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Footer Text'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Footer Line 1 (Price List Disclaimer)
              </label>
              <textarea
                rows={2}
                value={draftSettings.footerLine1}
                onChange={(e) => setDraftSettings({ ...draftSettings, footerLine1: e.target.value })}
                className="w-full p-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                Footer Line 2 (Creator Credit)
              </label>
              <textarea
                rows={2}
                value={draftSettings.footerLine2}
                onChange={(e) => setDraftSettings({ ...draftSettings, footerLine2: e.target.value })}
                className="w-full p-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDF2EE] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Footer Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 5: BACKUP, IMPORT/EXPORT & ADMIN PIN */}
      {subTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Admin PIN & Export Tools */}
          <div className="bg-white border border-[#DCE5DF] rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#14211B]">Admin Security & Export</h3>
              <p className="text-xs text-[#5A6B63]">
                আপনার Admin PIN পরিবর্তন করুন অথবা প্রোডাক্ট লিস্ট ডাউনলোড করুন।
              </p>
            </div>

            <form onSubmit={handleSaveSettingsForm} className="p-4 bg-[#F4F7F5] rounded-xl space-y-3">
              <label className="block text-xs font-bold text-[#4A5D54]">
                Change Admin Login PIN / Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="flex-1 h-10 px-3 text-sm font-mono bg-white border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
                />
                <button
                  type="submit"
                  className="px-4 h-10 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Update PIN
                </button>
              </div>
            </form>

            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold text-[#4A5D54]">Export & Download Files</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDataJs}
                  className="p-3 text-xs font-bold text-[#1E562A] bg-[#EDF7F0] hover:bg-[#D8EFE0] rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download data.js</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="p-3 text-xs font-bold text-[#14211B] bg-[#F4F7F5] hover:bg-[#E4ECE7] border border-[#C5D3CB] rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJsonBackup}
                  className="p-3 text-xs font-bold text-[#14211B] bg-[#F4F7F5] hover:bg-[#E4ECE7] border border-[#C5D3CB] rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Full JSON Backup</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EDF2EE]">
              {resetConfirmTarget === 'all' ? (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#991B1B]">
                    Reset everything (products + settings) to factory default?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await onResetDefaults('all');
                        setResetConfirmTarget(null);
                      }}
                      className="px-3 py-1 text-xs font-bold bg-[#DC2626] text-white rounded cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetConfirmTarget(null)}
                      className="px-2 py-1 text-xs text-[#4A5D54] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirmTarget('all')}
                  className="text-xs font-bold text-[#B91C1C] hover:underline cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Factory Reset All Products & Settings</span>
                </button>
              )}
            </div>
          </div>

          {/* Import JSON or data.js */}
          <div className="bg-white border border-[#DCE5DF] rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#14211B]">
                Bulk Import Products (`data.js` or JSON)
              </h3>
              <p className="text-xs text-[#5A6B63]">
                আপনার কাছে যদি নতুন `data.js` বা ব্যাকআপ JSON থাকে, তবে নিচে পেস্ট করে Import বাটনে ক্লিক করুন।
              </p>
            </div>

            <textarea
              rows={7}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError('');
              }}
              placeholder='Paste "const PRODUCTS = [...]" or Full Backup JSON here...'
              className="w-full p-3 text-xs font-mono bg-[#F4F7F5] border border-[#C5D3CB] rounded-xl outline-none focus:bg-white focus:border-[#1E562A]"
            />

            {importError && <p className="text-xs font-semibold text-[#DC2626]">{importError}</p>}

            <button
              type="button"
              onClick={handleImportData}
              className="w-full py-2.5 px-4 bg-[#1E562A] hover:bg-[#164220] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import & Save Data Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCE5DF] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#1E562A] text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingIndex === -1 ? 'Add New Herbalife Product' : `Edit Product: ${productForm.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductModal} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                    Stock Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                    placeholder="e.g. 1233 or 0006"
                    className="w-full h-10 px-3 text-sm font-mono border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Formula 1 - Nutritional Shake Mix - 500 gms"
                    className="w-full h-10 px-3 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A5D54] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    list="category-options"
                    value={productForm.category || ''}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="Select or type category"
                    className="w-full h-10 px-3 text-xs font-semibold border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
                  />
                  <datalist id="category-options">
                    {categories
                      .filter((c) => c !== 'All')
                      .map((c) => (
                        <option key={c} value={c} />
                      ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E562A] mb-1">
                    Volume Points (VP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.vp}
                    onChange={(e) => setProductForm({ ...productForm, vp: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 px-3 text-sm font-mono font-bold border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-[#14211B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.active !== false}
                      onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#1E562A]"
                    />
                    <span>Visible in Calculator</span>
                  </label>
                </div>
              </div>

              {/* Price Tiers Box */}
              <div className="p-4 bg-[#F4F7F5] border border-[#DCE5DF] rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#14211B]">
                    Product Price Tiers ({draftSettings.currencySymbol})
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoCalculateTiers}
                    className="px-3 py-1 text-xs font-bold text-[#1E562A] bg-[#EDF7F0] hover:bg-[#D8EFE0] border border-[#B5DEC1] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Fill Tiers from MRP & Earn Base</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A5D54] mb-1">
                      MRP ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.mrp}
                      onChange={(e) =>
                        setProductForm({ ...productForm, mrp: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono font-bold bg-white border border-[#C5D3CB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A5D54] mb-1">
                      Retail Price ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.retail}
                      onChange={(e) =>
                        setProductForm({ ...productForm, retail: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono bg-white border border-[#C5D3CB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A5D54] mb-1">
                      Earn Base ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.earnBase}
                      onChange={(e) =>
                        setProductForm({ ...productForm, earnBase: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono bg-white border border-[#C5D3CB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A5D54] mb-1">
                      25% Price ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.p25}
                      onChange={(e) =>
                        setProductForm({ ...productForm, p25: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono bg-white border border-[#C5D3CB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1E562A] mb-1">
                      35% Price ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.p35}
                      onChange={(e) =>
                        setProductForm({ ...productForm, p35: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono font-bold bg-[#EDF7F0] border border-[#1E562A] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A5D54] mb-1">
                      42% Price ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.p42}
                      onChange={(e) =>
                        setProductForm({ ...productForm, p42: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono bg-white border border-[#C5D3CB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A5D54] mb-1">
                      50% Price ({draftSettings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.p50}
                      onChange={(e) =>
                        setProductForm({ ...productForm, p50: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 px-2.5 text-sm font-mono font-bold bg-white border border-[#C5D3CB] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 text-xs font-bold text-[#4A5D54] hover:text-[#14211B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-bold bg-[#1E562A] hover:bg-[#164220] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingIndex === -1 ? 'Add Product' : 'Save Product Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
