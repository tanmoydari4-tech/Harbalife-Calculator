import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  AppStatePayload,
  ProductItem,
  SiteSettings,
} from './src/data/defaultConfig.ts';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalStore(): AppStatePayload {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_PRODUCTS,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Error reading local store:', err);
  }
  const initial: AppStatePayload = {
    products: DEFAULT_PRODUCTS,
    settings: DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
  };
  writeLocalStore(initial);
  return initial;
}

function writeLocalStore(payload: AppStatePayload) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local store:', err);
  }
}

// Optional Supabase REST sync if SUPABASE_URL & SUPABASE_ANON_KEY are configured in environment
async function fetchFromSupabase(): Promise<AppStatePayload | null> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/herbalife_app_state?id=eq.main&select=payload`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.payload) {
      return rows[0].payload as AppStatePayload;
    }
  } catch {
    // Fallback silently to local store
  }
  return null;
}

async function pushToSupabase(payload: AppStatePayload): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) return false;

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/herbalife_app_state`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: 'main',
        payload,
        updated_at: payload.updatedAt,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // API: Get full application state (products + site settings)
  app.get('/api/app-data', async (_req, res) => {
    try {
      const cloudState = await fetchFromSupabase();
      if (cloudState && Array.isArray(cloudState.products)) {
        writeLocalStore(cloudState);
        return res.json(cloudState);
      }
      const localState = readLocalStore();
      return res.json(localState);
    } catch (error) {
      console.error('Failed to get app-data:', error);
      return res.json(readLocalStore());
    }
  });

  // API: Save updated products and/or settings from Admin Panel
  app.post('/api/app-data', async (req, res) => {
    try {
      const current = readLocalStore();
      const incomingProducts: ProductItem[] = Array.isArray(req.body.products)
        ? req.body.products
        : current.products;
      const incomingSettings: SiteSettings = req.body.settings
        ? { ...DEFAULT_SETTINGS, ...current.settings, ...req.body.settings }
        : current.settings;

      const updated: AppStatePayload = {
        products: incomingProducts,
        settings: incomingSettings,
        updatedAt: new Date().toISOString(),
      };

      writeLocalStore(updated);
      await pushToSupabase(updated);

      return res.json(updated);
    } catch (error) {
      console.error('Failed to save app-data:', error);
      return res.status(500).json({ error: 'Failed to save configuration' });
    }
  });

  // API: Reset to factory defaults
  app.post('/api/reset-defaults', async (req, res) => {
    try {
      const target = req.body?.target || 'all'; // 'products' | 'settings' | 'all'
      const current = readLocalStore();
      const updated: AppStatePayload = {
        products: target === 'settings' ? current.products : DEFAULT_PRODUCTS,
        settings: target === 'products' ? current.settings : DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      };
      writeLocalStore(updated);
      await pushToSupabase(updated);
      return res.json(updated);
    } catch (error) {
      console.error('Failed to reset defaults:', error);
      return res.status(500).json({ error: 'Failed to reset defaults' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
