// Standalone Herbalife Price & VP Calculator + Master Admin Panel + Firebase Firestore Sync + Direct PDF Generator
// Mobile-first responsive design for GitHub Pages ("Deploy from a branch") & Netlify — 0ms synchronous render!

(function () {
  if (window.__STANDALONE_APP_INITIALIZED__) return;
  window.__STANDALONE_APP_INITIALIZED__ = true;

  const firebaseConfig = {
    apiKey: 'AIzaSyCP2Qo8HcBW44sGL-GMDm6A_2Z9rQKNNEY',
    authDomain: 'harbalife-calculator.firebaseapp.com',
    projectId: 'harbalife-calculator',
    storageBucket: 'harbalife-calculator.firebasestorage.app',
    messagingSenderId: '808694623864',
    appId: '1:808694623864:web:4e2cc01e5bc52162e2078d',
    measurementId: 'G-XZKD7FKG2C',
  };

  const DEFAULT_PRODUCTS = [
    { code: '', name: 'Formula 1 - Nutritional Shake Mix -  500 gms', vp: 21.75, mrp: 2179, retail: 2075, earnBase: 1776, p25: 1713, p35: 1526, p42: 1396, p50: 1246, active: true },
    { code: '', name: 'Formula 1  - 750 gms', vp: 32.65, mrp: 3227, retail: 3073, earnBase: 2628, p25: 2537, p35: 2261, p42: 2068, p50: 1847, active: true },
    { code: '1233', name: 'Personalized Protein Powder - 200 gms', vp: 11.5, mrp: 1295, retail: 1233, earnBase: 1054, p25: 1018, p35: 907, p42: 830, p50: 741, active: true },
    { code: '1569', name: 'Personalized Protein Powder - 400 gms', vp: 22.5, mrp: 2485, retail: 2366, earnBase: 2023, p25: 1953, p35: 1741, p42: 1592, p50: 1422, active: true },
    { code: '183K', name: 'ShakeMate - 500 gms', vp: 6.45, mrp: 653, retail: 621, earnBase: 306, p25: 572, p35: 540, p42: 517, p50: 491, active: true },
    { code: '0064', name: 'Ocular Defense', vp: 19.25, mrp: 1927, retail: 1835, earnBase: 1570, p25: 1515, p35: 1350, p42: 1234, p50: 1103, active: true },
    { code: '175K', name: 'Male Factor +', vp: 34.75, mrp: 3410, retail: 3247, earnBase: 2776, p25: 2681, p35: 2389, p42: 2185, p50: 1952, active: true },
    { code: '127K', name: "Woman's Choice", vp: 12.45, mrp: 1245, retail: 1185, earnBase: 1013, p25: 978, p35: 872, p42: 798, p50: 712, active: true },
    { code: '109K', name: 'vritilife Brain Health - 60 tablets', vp: 15.1, mrp: 1464, retail: 1394, earnBase: 1192, p25: 1151, p35: 1026, p42: 938, p50: 838, active: true },
    { code: '115K', name: 'vritilife Immune Health - 60 tablets', vp: 15.8, mrp: 1528, retail: 1455, earnBase: 1245, p25: 1201, p35: 1070, p42: 979, p50: 874, active: true },
    { code: '275K', name: 'vritilife® Facial Cleanser (100 ml)', vp: 10.4, mrp: 1165, retail: 987, earnBase: 844, p25: 916, p35: 816, p42: 746, p50: 667, active: true },
    { code: '315K', name: 'vritilife® Facial Toner (100 ml)', vp: 11.8, mrp: 1322, retail: 1120, earnBase: 958, p25: 1039, p35: 926, p42: 847, p50: 756, active: true },
    { code: '276K', name: 'vritilife® Facial Serum (30 ml)', vp: 27.05, mrp: 3022, retail: 2561, earnBase: 2190, p25: 2376, p35: 2118, p42: 1937, p50: 1730, active: true },
    { code: '277K', name: 'vritilife® Moisturizer (100 ml)', vp: 13.15, mrp: 1473, retail: 1248, earnBase: 1067, p25: 1158, p35: 1032, p42: 944, p50: 843, active: true },
    { code: '046K', name: 'HN-Skin Booster - Orange - 10 gms * 30 Sachets', vp: 38.65, mrp: 3910, retail: 3723, earnBase: 2749, p25: 3188, p35: 2899, p42: 2697, p50: 2466, active: true },
    { code: '316K', name: 'HN-Skin Booster - Canister', vp: 38.65, mrp: 3910, retail: 3723, earnBase: 2849, p25: 3161, p35: 2862, p42: 2653, p50: 2413, active: true },
    { code: '', name: 'Afresh Energy Drink Mix - Kashmiri Kahwa AND OTHERS- 40 gms', vp: 7.8, mrp: 812, retail: 773, earnBase: 662, p25: 638, p35: 568, p42: 520, p50: 464, active: true },
    { code: '080K', name: 'Afresh Energy Drink Mix - Tulsi (Basil) - 50 gms', vp: 7.8, mrp: 812, retail: 773, earnBase: 630, p25: 646, p35: 580, p42: 534, p50: 481, active: true },
    { code: '507K', name: 'Liftoff Watermelon (30 Sachets)', vp: 38.05, mrp: 4119, retail: 3922, earnBase: 3354, p25: 3238, p35: 2886, p42: 2639, p50: 2357, active: true },
    { code: '505K', name: 'Liftoff Watermelon (10 Sachets)', vp: 12.95, mrp: 1401, retail: 1334, earnBase: 1140, p25: 1101, p35: 982, p42: 898, p50: 802, active: true },
    { code: '1458', name: 'H24 Hydrate - 5gms *20 Sachets', vp: 14.05, mrp: 1636, retail: 1558, earnBase: 1134, p25: 1338, p35: 1219, p42: 1136, p50: 1041, active: true },
    { code: '031K', name: 'H24 Rebuild Strength - 50gms *10 Sachets', vp: 24.7, mrp: 2616, retail: 2491, earnBase: 2035, p25: 2081, p35: 1868, p42: 1718, p50: 1547, active: true },
    { code: '', name: 'Dinoshake™  - 200 gms', vp: 9.6, mrp: 1115, retail: 1061, earnBase: 908, p25: 876, p35: 780, p42: 714, p50: 637, active: true },
    { code: '1278', name: 'Activated Fiber - 90 Tablets', vp: 15.75, mrp: 1636, retail: 1558, earnBase: 1333, p25: 1286, p35: 1146, p42: 1048, p50: 936, active: true },
    { code: '2865', name: 'Active Fibre Complex - Unflavoured - 200 gms', vp: 22.95, mrp: 2559, retail: 2437, earnBase: 2084, p25: 2012, p35: 1793, p42: 1640, p50: 1465, active: true },
    { code: '1293', name: 'Aloe Plus - 60 Capsules', vp: 9.4, mrp: 1059, retail: 1008, earnBase: 863, p25: 832, p35: 741, p42: 678, p50: 605, active: true },
    { code: '0006', name: 'Herbal Aloe Concentrate - Unflavored (Original) - 500 ml', vp: 24.95, mrp: 2696, retail: 2567, earnBase: 2195, p25: 2119, p35: 1889, p42: 1727, p50: 1543, active: true },
    { code: '025K', name: 'Simply Probiotic - 1 gms *30 Sachets', vp: 21.95, mrp: 2209, retail: 2103, earnBase: 1799, p25: 1736, p35: 1547, p42: 1415, p50: 1264, active: true },
    { code: '186K', name: 'vritilife Triphala - 60 Tablets', vp: 11.25, mrp: 1089, retail: 1037, earnBase: 887, p25: 856, p35: 763, p42: 698, p50: 623, active: true },
    { code: '0020', name: 'Herbalife Calcium Tablets - 60 Tablets', vp: 10.25, mrp: 1203, retail: 1145, earnBase: 979, p25: 945, p35: 842, p42: 771, p50: 688, active: true },
    { code: '0555', name: 'Joint Support - 90 Tablets', vp: 20.9, mrp: 2455, retail: 2338, earnBase: 2000, p25: 1930, p35: 1720, p42: 1573, p50: 1405, active: true },
    { code: '2637', name: 'Herbalife Niteworks - 300 gms', vp: 75.0, mrp: 7128, retail: 6788, earnBase: 5804, p25: 5604, p35: 4994, p42: 4568, p50: 4060, active: true },
    { code: '0065', name: 'Herbalifeline - 60 Softgels', vp: 25.75, mrp: 2667, retail: 2540, earnBase: 2172, p25: 2097, p35: 1869, p42: 1709, p50: 1527, active: true },
    { code: '051K', name: 'Beta Heart - Vanilla Flavour - 15 gms *15 Sachets', vp: 19.55, mrp: 2242, retail: 2115, earnBase: 1576, p25: 1828, p35: 1663, p42: 1547, p50: 1414, active: true },
    { code: '1232', name: 'Multivitamin Mineral and Herbal Tablets Plus - 90 Tablets', vp: 19.95, mrp: 2004, retail: 1908, earnBase: 1632, p25: 1575, p35: 1404, p42: 1284, p50: 1147, active: true },
    { code: '3123', name: 'Cell Activator - New - 60 Tablets', vp: 21.95, mrp: 2215, retail: 2109, earnBase: 1629, p25: 1804, p35: 1741, p42: 1555, p50: 1419, active: true },
    { code: '0111', name: 'Cell-U-Loss Advanced - 90 Tablets', vp: 15.75, mrp: 1705, retail: 1623, earnBase: 1388, p25: 1340, p35: 1194, p42: 1092, p50: 975, active: true },
    { code: '0077', name: 'Herbal Control - 90 Tablets', vp: 32.95, mrp: 3433, retail: 3269, earnBase: 2796, p25: 2699, p35: 2405, p42: 2199, p50: 1965, active: true },
    { code: '426K', name: 'Sleep Enhance', vp: 16.3, mrp: 1697, retail: 1616, earnBase: 1387, p25: 1334, p35: 1189, p42: 1087, p50: 971, active: true },
  ];

  const DEFAULT_SETTINGS = {
    brandTitle: 'HERBALIFE CALCULATOR',
    pageHeading: 'Price & Volume Point Calculator',
    pageSubtitle: 'Instant multi-tier price calculation (MRP, Retail, 25%, 35%, 42%, 50%) · Volume Points (VP) · PDF Quote Generator',
    currencySymbol: '₹',
    defaultTier: 'p35',
    tierLabels: {
      mrp: 'MRP',
      retail: 'Retail Price',
      earnBase: 'Earn Base',
      p25: '25%',
      p35: '35%',
      p42: '42%',
      p50: '50%',
    },
    whatsappEnabled: true,
    whatsappNumber: '919433523525',
    whatsappMessage: 'Hello, I need help',
    whatsappButtonLabel: 'Help',
    footerLine1: 'পণ্যের মূল্য ও ভলিউম পয়েন্টের তথ্য প্রদত্ত Herbalife Price List থেকে নেওয়া হয়েছে। লেনদেনের আগে বর্তমান অফিসিয়াল Price List-এর সঙ্গে তথ্য যাচাই করুন।',
    footerLine2: 'ওয়েবসাইটটি তৈরি করেছেন: TANMOY DARI। এই ওয়েবসাইটটি পণ্যের মূল্য ও ভলিউম পয়েন্ট সহজে হিসাব করার জন্য তৈরি করা হয়েছে।',
    adminPin: '1234',
  };

  function safeParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  const savedProducts = safeParse('hl_admin_products_v1', null);
  const savedSettings = safeParse('hl_admin_settings_v1', null);
  const savedCartEntries = safeParse('hl_cart_v1', []);

  const state = {
    tab: 'calculator', // 'calculator' | 'catalog' | 'admin' (Tier Matrix removed)
    adminSubTab: 'products', // 'products' | 'settings' | 'backup'
    adminUnlocked: false,
    adminSearch: '',
    catalogSearch: '',
    invoiceModalOpen: false,
    products: Array.isArray(savedProducts) && savedProducts.length > 0 ? savedProducts : DEFAULT_PRODUCTS.map((p) => ({ ...p })),
    settings: {
      ...DEFAULT_SETTINGS,
      ...(savedSettings || {}),
      tierLabels: { ...DEFAULT_SETTINGS.tierLabels, ...((savedSettings && savedSettings.tierLabels) || {}) },
    },
    tier: localStorage.getItem('tier') || 'p35',
    cart: new Map(Array.isArray(savedCartEntries) ? savedCartEntries : []),
    customerName: localStorage.getItem('hl_customer_name') || '',
    customerPhone: localStorage.getItem('hl_customer_phone') || '',
    search: '',
    firebaseConnected: false,
    toast: null,
  };

  try {
    state.adminUnlocked = sessionStorage.getItem('hl_admin_unlocked') === 'true';
  } catch {}

  let firestoreApi = null;

  function showToast(msg) {
    state.toast = msg;
    renderApp();
    setTimeout(() => {
      if (state.toast === msg) {
        state.toast = null;
        renderApp();
      }
    }, 2800);
  }

  function formatMoney(n) {
    return (state.settings.currencySymbol || '₹') + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function saveLocalState() {
    try {
      localStorage.setItem('hl_admin_products_v1', JSON.stringify(state.products));
      localStorage.setItem('hl_admin_settings_v1', JSON.stringify(state.settings));
      localStorage.setItem('hl_cart_v1', JSON.stringify(Array.from(state.cart.entries())));
      localStorage.setItem('hl_customer_name', state.customerName);
      localStorage.setItem('hl_customer_phone', state.customerPhone);
      localStorage.setItem('tier', state.tier);
    } catch {}
  }

  // Direct PDF 1.4 binary generator — saves real .pdf file on mobile & desktop!
  function toAscii(str) {
    return String(str || '')
      .replace(/₹/g, 'Rs. ')
      .replace(/[™®©]/g, '')
      .replace(/[–—]/g, '-')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
  }

  function pdfEscape(str) {
    return toAscii(str)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function fmtRs(n) {
    return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function downloadDirectPdf(cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, tierLabels) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const brandTitle = toAscii(state.settings.brandTitle || 'HERBALIFE CALCULATOR') || 'HERBALIFE CALCULATOR';
    const subtitle = 'Customer Price & Volume Point Estimate';
    const custName = toAscii(state.customerName) || 'Walk-in Customer';
    const custPhone = toAscii(state.customerPhone) || '-';
    const tierName = toAscii(tierLabels[state.tier] || state.tier) || '35%';
    const savingsPercent = totalMrp > 0 ? ((totalSavings / totalMrp) * 100).toFixed(1) : '0.0';

    const itemsPerPage = 18;
    const pages = [];
    if (cartItems.length === 0) {
      pages.push([]);
    } else {
      for (let i = 0; i < cartItems.length; i += itemsPerPage) {
        pages.push(cartItems.slice(i, i + itemsPerPage));
      }
    }

    const pageStreams = [];
    pages.forEach((pageItems, pageIdx) => {
      const ops = [];
      let y = pageHeight - margin;

      const headerH = 58;
      ops.push('0.118 0.337 0.165 rg');
      ops.push(`${margin} ${y - headerH} ${contentWidth} ${headerH} re f`);
      ops.push('1 1 1 rg');
      ops.push(`BT /F2 16 Tf ${margin + 14} ${y - 24} Td (${pdfEscape(brandTitle)}) Tj ET`);
      ops.push(`BT /F1 9.5 Tf ${margin + 14} ${y - 42} Td (${pdfEscape(subtitle)}) Tj ET`);
      ops.push(`BT /F2 9.5 Tf ${pageWidth - margin - 145} ${y - 24} Td (${pdfEscape('Date: ' + dateStr)}) Tj ET`);
      ops.push(`BT /F2 9.5 Tf ${pageWidth - margin - 145} ${y - 40} Td (${pdfEscape('Price Tier: ' + tierName)}) Tj ET`);

      y -= headerH + 12;

      const custBoxH = 38;
      ops.push('0.957 0.969 0.961 rg');
      ops.push(`${margin} ${y - custBoxH} ${contentWidth} ${custBoxH} re f`);
      ops.push('0.863 0.898 0.875 RG 0.8 w');
      ops.push(`${margin} ${y - custBoxH} ${contentWidth} ${custBoxH} re S`);
      ops.push('0.078 0.129 0.106 rg');
      ops.push(`BT /F2 10 Tf ${margin + 12} ${y - 16} Td (Customer Name: ${pdfEscape(custName)}) Tj ET`);
      ops.push(`BT /F1 9.5 Tf ${margin + 12} ${y - 30} Td (Phone Number: ${pdfEscape(custPhone)}) Tj ET`);
      ops.push(`BT /F2 9.5 Tf ${pageWidth - margin - 165} ${y - 23} Td (Selected Price: ${pdfEscape(tierName)}) Tj ET`);

      y -= custBoxH + 14;

      const thH = 24;
      ops.push('0.118 0.337 0.165 rg');
      ops.push(`${margin} ${y - thH} ${contentWidth} ${thH} re f`);

      const colNo = margin + 8;
      const colCode = margin + 30;
      const colName = margin + 82;
      const colVp = margin + 305;
      const colUnit = margin + 355;
      const colQty = margin + 422;
      const colTotVp = margin + 452;
      const colTotal = margin + 498;

      ops.push('1 1 1 rg');
      ops.push(`BT /F2 8.5 Tf ${colNo} ${y - 15} Td (#) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colCode} ${y - 15} Td (Code) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colName} ${y - 15} Td (Product Name) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colVp} ${y - 15} Td (Unit VP) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colUnit} ${y - 15} Td (Unit Price) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colQty} ${y - 15} Td (Qty) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colTotVp} ${y - 15} Td (Tot VP) Tj ET`);
      ops.push(`BT /F2 8.5 Tf ${colTotal} ${y - 15} Td (Total) Tj ET`);

      y -= thH;

      const rowH = 21;
      if (pageItems.length === 0) {
        ops.push('0.4 0.45 0.42 rg');
        ops.push(`BT /F1 10 Tf ${margin + 180} ${y - 25} Td (No products selected in cart.) Tj ET`);
        y -= 40;
      } else {
        pageItems.forEach((item, idx) => {
          const globalIdx = pageIdx * itemsPerPage + idx + 1;
          if (idx % 2 === 1) {
            ops.push('0.965 0.980 0.969 rg');
            ops.push(`${margin} ${y - rowH} ${contentWidth} ${rowH} re f`);
          }
          ops.push('0.89 0.92 0.90 RG 0.5 w');
          ops.push(`${margin} ${y - rowH} m ${margin + contentWidth} ${y - rowH} l S`);

          const pName = toAscii(item.p.name).slice(0, 40);
          const pCode = toAscii(item.p.code || '-');
          const unitVp = Number(item.p.vp || 0);

          ops.push('0.078 0.129 0.106 rg');
          ops.push(`BT /F1 8.5 Tf ${colNo} ${y - 14} Td (${globalIdx}) Tj ET`);
          ops.push(`BT /F1 8.5 Tf ${colCode} ${y - 14} Td (${pdfEscape(pCode)}) Tj ET`);
          ops.push(`BT /F2 8.5 Tf ${colName} ${y - 14} Td (${pdfEscape(pName)}) Tj ET`);
          ops.push(`BT /F1 8.5 Tf ${colVp} ${y - 14} Td (${unitVp.toFixed(2)}) Tj ET`);
          ops.push(`BT /F1 8.5 Tf ${colUnit} ${y - 14} Td (${pdfEscape(fmtRs(item.unitPrice))}) Tj ET`);
          ops.push(`BT /F2 8.5 Tf ${colQty + 4} ${y - 14} Td (${item.qty}) Tj ET`);
          ops.push(`BT /F1 8.5 Tf ${colTotVp} ${y - 14} Td (${item.lineVp.toFixed(2)}) Tj ET`);
          ops.push(`BT /F2 8.5 Tf ${colTotal - 4} ${y - 14} Td (${pdfEscape(fmtRs(item.lineTotal))}) Tj ET`);

          y -= rowH;
        });
      }

      if (pageIdx === pages.length - 1) {
        y -= 14;
        const boxW = 235;
        const boxX = pageWidth - margin - boxW;
        const boxH = 112;

        ops.push('0.957 0.969 0.961 rg');
        ops.push(`${boxX} ${y - boxH} ${boxW} ${boxH} re f`);
        ops.push('0.77 0.83 0.79 RG 0.8 w');
        ops.push(`${boxX} ${y - boxH} ${boxW} ${boxH} re S`);

        ops.push('0.078 0.129 0.106 rg');
        ops.push(`BT /F1 9 Tf ${boxX + 12} ${y - 18} Td (Total Items: ${cartItems.length}   |   Total Qty: ${totalQty}) Tj ET`);
        ops.push(`BT /F2 9.5 Tf ${boxX + 12} ${y - 35} Td (Total Volume Points: ${totalVp.toFixed(2)} VP) Tj ET`);
        ops.push(`BT /F1 9 Tf ${boxX + 12} ${y - 52} Td (Total MRP Value: ${pdfEscape(fmtRs(totalMrp))}) Tj ET`);

        if (totalSavings > 0) {
          ops.push('0.082 0.502 0.239 rg');
          ops.push(`BT /F2 9 Tf ${boxX + 12} ${y - 68} Td (Savings vs MRP: -${pdfEscape(fmtRs(totalSavings))} (${savingsPercent}%)) Tj ET`);
        }

        ops.push('0.118 0.337 0.165 rg');
        ops.push(`${boxX} ${y - boxH} ${boxW} 32 re f`);
        ops.push('1 1 1 rg');
        ops.push(`BT /F2 11.5 Tf ${boxX + 12} ${y - boxH + 11} Td (GRAND TOTAL: ${pdfEscape(fmtRs(totalPrice))}) Tj ET`);
      }

      const footY = margin + 18;
      ops.push('0.85 0.88 0.86 RG 0.6 w');
      ops.push(`${margin} ${footY + 14} m ${pageWidth - margin} ${footY + 14} l S`);
      ops.push('0.35 0.42 0.38 rg');
      ops.push(`BT /F1 8 Tf ${margin} ${footY} Td (Herbalife Price & Volume Point Estimate  |  Verify with official price list before transaction.) Tj ET`);
      ops.push(`BT /F2 8 Tf ${margin} ${footY - 12} Td (Website created by: TANMOY DARI  |  Page ${pageIdx + 1} of ${pages.length}) Tj ET`);

      pageStreams.push(ops.join('\n'));
    });

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    const firstPageObjNum = 5;
    const kidsRefs = pageStreams.map((_, i) => `${firstPageObjNum + i * 2} 0 R`).join(' ');
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs}] /Count ${pageStreams.length} >>\nendobj`);
    objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj');
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj');

    pageStreams.forEach((stream, i) => {
      const pageObjNum = firstPageObjNum + i * 2;
      const contentObjNum = pageObjNum + 1;
      objects.push(
        `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj`
      );
      objects.push(`${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj + '\n';
    });

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.customerName.trim() || 'Customer').replace(/[^a-z0-9_-]/gi, '_');
    a.href = url;
    a.download = `Herbalife_Quote_${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('PDF ফাইল ডাউনলোড হয়েছে (.pdf)!');
  }

  async function syncToFirebase(msg) {
    saveLocalState();
    renderApp();
    if (firestoreApi && firestoreApi.db) {
      try {
        await firestoreApi.setDoc(
          firestoreApi.doc(firestoreApi.db, 'herbalife_store', 'main'),
          {
            products: state.products,
            settings: state.settings,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        state.firebaseConnected = true;
        showToast(msg || 'Firebase Live Database-এ সেভ হয়েছে!');
        return;
      } catch (e) {
        console.warn('Firestore save warning:', e);
        showToast((msg || 'Saved locally') + ' (Firebase Rules check করুন)');
        return;
      }
    }
    showToast(msg || 'Saved locally');
  }

  async function initFirebaseSync() {
    try {
      const appMod = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const fsMod = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      const app = appMod.initializeApp(firebaseConfig);
      const db = fsMod.getFirestore(app);
      firestoreApi = { db, doc: fsMod.doc, setDoc: fsMod.setDoc, onSnapshot: fsMod.onSnapshot };

      fsMod.onSnapshot(
        fsMod.doc(db, 'herbalife_store', 'main'),
        (snap) => {
          state.firebaseConnected = true;
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.products) && data.products.length > 0) {
              state.products = data.products;
            }
            if (data.settings) {
              state.settings = {
                ...DEFAULT_SETTINGS,
                ...data.settings,
                tierLabels: { ...DEFAULT_SETTINGS.tierLabels, ...(data.settings.tierLabels || {}) },
              };
            }
            saveLocalState();
            renderApp();
          } else {
            fsMod
              .setDoc(fsMod.doc(db, 'herbalife_store', 'main'), {
                products: state.products,
                settings: state.settings,
                updatedAt: new Date().toISOString(),
              })
              .catch(() => {});
          }
        },
        (err) => {
          console.warn('Firestore listener notice:', err);
        }
      );
    } catch (e) {
      console.warn('Firebase background sync skipped:', e);
    }
  }

  function getFilteredSuggestions() {
    const q = state.search.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    return state.products
      .map((p, index) => ({ p, index }))
      .filter(({ p }) => p.active !== false && tokens.every((t) => ((p.code || '') + ' ' + (p.name || '')).toLowerCase().includes(t)))
      .slice(0, 35);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function autoComputeProductTiers(p) {
    const mrp = Number(p.mrp) || 0;
    p.retail = Math.round(mrp * 0.9523);
    p.earnBase = Math.round(mrp * 0.815);
    p.p25 = Math.round(p.retail - p.earnBase * 0.204);
    p.p35 = Math.round(p.retail - p.earnBase * 0.309);
    p.p42 = Math.round(p.retail - p.earnBase * 0.382);
    p.p50 = Math.round(p.retail - p.earnBase * 0.4665);
  }

  function renderApp() {
    if (window.__APP_MOUNTED__) return;
    const root = document.getElementById('root');
    if (!root) return;

    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    const selectionStart = activeEl && 'selectionStart' in activeEl ? activeEl.selectionStart : null;

    const activeProducts = state.products.map((p, index) => ({ p, index })).filter(({ p }) => p.active !== false);
    const tierLabels = state.settings.tierLabels || DEFAULT_SETTINGS.tierLabels;
    const tiers = ['mrp', 'retail', 'p25', 'p35', 'p42', 'p50'];

    let totalPrice = 0;
    let totalMrp = 0;
    let totalQty = 0;
    let totalVp = 0;
    const cartItems = [];

    state.cart.forEach((qty, idx) => {
      const p = state.products[Number(idx)];
      if (!p || qty <= 0) return;
      const unitPrice = Number(p[state.tier] ?? 0);
      const lineTotal = unitPrice * qty;
      const lineVp = Number(p.vp || 0) * qty;
      totalPrice += lineTotal;
      totalMrp += Number(p.mrp || 0) * qty;
      totalQty += qty;
      totalVp += lineVp;
      cartItems.push({ index: Number(idx), p, qty, unitPrice, lineTotal, lineVp });
    });

    const totalSavings = Math.max(0, totalMrp - totalPrice);
    const suggestions = getFilteredSuggestions();
    const waHelpUrl = `https://wa.me/${(state.settings.whatsappNumber || '919433523525').replace(/\D/g, '')}?text=${encodeURIComponent(state.settings.whatsappMessage || 'Hello, I need help')}`;

    root.innerHTML = `
      <div class="min-h-screen flex flex-col bg-[#F4F7F5] text-[#14211B]">
        <!-- Top Header (Mobile-responsive, Tier Matrix removed) -->
        <header class="no-print sticky top-0 z-30 bg-[#1E562A] text-white border-b border-[#164220] shadow-sm">
          <div class="max-w-[1200px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
            <a href="#calculator" data-nav="calculator" class="text-sm sm:text-xl font-extrabold tracking-tight text-white truncate max-w-[180px] sm:max-w-none">
              ${escapeHtml(state.settings.brandTitle)}
            </a>
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
              <button data-nav="calculator" class="py-1 border-b-2 cursor-pointer ${state.tab === 'calculator' ? 'border-white text-white font-bold' : 'border-transparent text-white/80 hover:text-white'}">Calculator</button>
              <button data-nav="catalog" class="py-1 border-b-2 cursor-pointer ${state.tab === 'catalog' ? 'border-white text-white font-bold' : 'border-transparent text-white/80 hover:text-white'}">Price List (${activeProducts.length})</button>
              <button data-nav="admin" class="py-1 border-b-2 cursor-pointer ${state.tab === 'admin' ? 'border-white text-white font-bold' : 'border-transparent text-white/80 hover:text-white'}">Admin Panel ${state.adminUnlocked ? '●' : ''}</button>
            </nav>
            <div class="flex items-center gap-2 shrink-0">
              ${state.adminUnlocked ? `<button id="btnHeaderLogout" class="px-2.5 py-1.5 text-xs font-bold bg-[#FEF2F2] text-[#B91C1C] rounded-lg cursor-pointer">Logout Admin</button>` : ''}
              <button id="btnPrintQuote" class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#1E562A] bg-white rounded-lg hover:bg-[#EDF7F0] cursor-pointer">Save PDF</button>
            </div>
          </div>
        </header>

        <!-- Mobile Navigation Bar (3 equal-width buttons, no Tier Matrix) -->
        <div class="no-print md:hidden bg-white border-b border-[#DCE5DF] px-3 py-2 grid grid-cols-3 gap-1.5">
          <button data-nav="calculator" class="py-2 px-2 text-xs font-bold rounded-lg text-center truncate ${state.tab === 'calculator' ? 'bg-[#1E562A] text-white' : 'bg-[#F4F7F5] text-[#4A5D54]'}">Calculator ${cartItems.length > 0 ? `(${cartItems.length})` : ''}</button>
          <button data-nav="catalog" class="py-2 px-2 text-xs font-bold rounded-lg text-center truncate ${state.tab === 'catalog' ? 'bg-[#1E562A] text-white' : 'bg-[#F4F7F5] text-[#4A5D54]'}">Price List (${activeProducts.length})</button>
          <button data-nav="admin" class="py-2 px-2 text-xs font-bold rounded-lg text-center truncate ${state.tab === 'admin' ? 'bg-[#1E562A] text-white' : 'bg-[#F4F7F5] text-[#4A5D54]'}">Admin Panel</button>
        </div>

        ${state.toast ? `<div class="no-print fixed bottom-20 right-4 left-4 sm:left-auto sm:right-5 z-50 bg-[#14211B] text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-center">${escapeHtml(state.toast)}</div>` : ''}

        <main class="no-print flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h1 class="text-base sm:text-xl font-bold text-[#14211B]">${escapeHtml(state.settings.pageHeading)}</h1>
              <p class="text-xs text-[#5A6B63]">${escapeHtml(state.settings.pageSubtitle)}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button data-nav="${state.tab === 'admin' ? 'calculator' : 'admin'}" class="px-3 py-2 text-xs font-bold rounded-lg border border-[#1E562A] ${state.tab === 'admin' ? 'bg-[#1E562A] text-white' : 'bg-white text-[#1E562A]'} cursor-pointer">
                ${state.tab === 'admin' ? '← Back to Calculator' : 'Admin Panel'}
              </button>
              ${state.tab !== 'admin' ? `<button id="btnClearCart" class="px-3 py-2 text-xs font-bold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg cursor-pointer">Clear All</button>` : ''}
            </div>
          </div>

          ${state.tab === 'admin' ? renderAdminView() : renderCustomerViews(activeProducts, tierLabels, tiers, cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, suggestions)}
        </main>

        <footer class="no-print mt-auto py-6 px-4 text-center text-[#5A6B63] text-xs leading-relaxed border-t border-[#DCE5DF] bg-white">
          <div class="max-w-[900px] mx-auto space-y-1">
            <p>${escapeHtml(state.settings.footerLine1)}</p>
            <p class="font-semibold text-[#2F3E37]">${escapeHtml(state.settings.footerLine2)}</p>
          </div>
        </footer>

        ${state.settings.whatsappEnabled ? `
          <a href="${waHelpUrl}" target="_blank" rel="noopener noreferrer" class="no-print fixed left-4 bottom-4 z-40 bg-[#25D366] text-white px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-lg">
            💬 ${escapeHtml(state.settings.whatsappButtonLabel || 'Help')}
          </a>
        ` : ''}

        <!-- PDF Invoice Preview Modal -->
        ${state.invoiceModalOpen ? `
          <div class="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div class="bg-white border border-[#DCE5DF] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div class="px-4 sm:px-6 py-4 bg-[#1E562A] text-white flex items-center justify-between">
                <h3 class="text-sm sm:text-base font-bold">Customer Estimate / PDF Download</h3>
                <button id="btnCloseModalTop" class="w-8 h-8 rounded-lg hover:bg-white/15 font-bold cursor-pointer">✕</button>
              </div>
              <div class="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                <div class="flex flex-wrap justify-between gap-2 pb-3 border-b border-[#DCE5DF]">
                  <div>
                    <div class="text-base sm:text-lg font-extrabold text-[#1E562A]">${escapeHtml(state.settings.brandTitle)}</div>
                    <div class="text-[#5A6B63]">Customer Price & Volume Point Estimate</div>
                  </div>
                  <div class="text-right font-mono">
                    <div>Tier: <strong>${escapeHtml(tierLabels[state.tier])}</strong></div>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F4F7F5] p-3 rounded-xl">
                  <div><span class="text-[#5A6B63] block">Customer Name:</span><strong>${escapeHtml(state.customerName || '—')}</strong></div>
                  <div><span class="text-[#5A6B63] block">Phone Number:</span><strong class="font-mono">${escapeHtml(state.customerPhone || '—')}</strong></div>
                </div>
                <div class="overflow-x-auto border border-[#DCE5DF] rounded-xl">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-[#F4F7F5] border-b border-[#DCE5DF] font-bold">
                        <th class="p-2">Product</th><th class="p-2 text-right">Unit</th><th class="p-2 text-center">Qty</th><th class="p-2 text-right">VP</th><th class="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#EDF2EE]">
                      ${cartItems.map((item) => `
                        <tr>
                          <td class="p-2 font-semibold">${escapeHtml(item.p.name)}</td>
                          <td class="p-2 text-right font-mono">${formatMoney(item.unitPrice)}</td>
                          <td class="p-2 text-center font-mono font-bold">${item.qty}</td>
                          <td class="p-2 text-right font-mono">${item.lineVp.toFixed(2)}</td>
                          <td class="p-2 text-right font-mono font-bold">${formatMoney(item.lineTotal)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <div class="bg-[#EDF7F0] p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 font-bold text-sm">
                  <span>Total Qty: ${totalQty} | Total VP: ${totalVp.toFixed(2)} VP</span>
                  <span class="text-[#1E562A] text-base font-mono">Grand Total: ${formatMoney(totalPrice)}</span>
                </div>
              </div>
              <div class="px-4 sm:px-6 py-3.5 bg-[#F4F7F5] border-t border-[#DCE5DF] flex flex-wrap items-center justify-between gap-2">
                <button id="btnCloseModalBottom" class="px-3 py-2 text-xs font-bold text-[#4A5D54] cursor-pointer">Close</button>
                <div class="flex flex-wrap items-center gap-2">
                  <button id="btnBrowserPrint" class="px-3.5 py-2 text-xs font-bold text-[#1E562A] bg-white border border-[#1E562A] rounded-lg cursor-pointer">Print</button>
                  <button id="btnConfirmDownloadPdf" class="px-4 py-2.5 text-xs font-bold text-white bg-[#1E562A] hover:bg-[#164220] rounded-lg cursor-pointer">Download PDF File (.pdf)</button>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Print-Only Invoice View -->
        <div class="hidden print-only p-6 text-black bg-white">
          <h1 class="text-xl font-bold">${escapeHtml(state.settings.brandTitle)}</h1>
          <p class="text-xs mb-3">Customer: <strong>${escapeHtml(state.customerName || '—')}</strong> | Phone: <strong>${escapeHtml(state.customerPhone || '—')}</strong> | Tier: <strong>${escapeHtml(tierLabels[state.tier])}</strong></p>
          <table class="w-full text-left border-collapse text-xs mb-4">
            <thead>
              <tr class="border-b border-black"><th class="py-1">Code</th><th class="py-1">Product</th><th class="py-1 text-right">Unit</th><th class="py-1 text-center">Qty</th><th class="py-1 text-right">VP</th><th class="py-1 text-right">Total</th></tr>
            </thead>
            <tbody>
              ${cartItems.map((item) => `<tr class="border-b border-gray-300"><td class="py-1 font-mono">${escapeHtml(item.p.code || '—')}</td><td class="py-1">${escapeHtml(item.p.name)}</td><td class="py-1 text-right font-mono">${formatMoney(item.unitPrice)}</td><td class="py-1 text-center font-mono">${item.qty}</td><td class="py-1 text-right font-mono">${item.lineVp.toFixed(2)}</td><td class="py-1 text-right font-mono font-bold">${formatMoney(item.lineTotal)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="text-right font-bold text-sm">Total Quantity: ${totalQty} | Total VP: ${totalVp.toFixed(2)} VP | Grand Total: ${formatMoney(totalPrice)}</div>
        </div>
      </div>
    `;

    bindEvents(cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, tierLabels);

    if (activeId) {
      const restored = document.getElementById(activeId);
      if (restored) {
        restored.focus();
        if (selectionStart !== null && 'setSelectionRange' in restored) {
          try {
            restored.setSelectionRange(selectionStart, selectionStart);
          } catch {}
        }
      }
    }
  }

  function renderCustomerViews(activeProducts, tierLabels, tiers, cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, suggestions) {
    const qCat = state.catalogSearch.trim().toLowerCase();
    const filteredCatalog = activeProducts.filter(({ p }) => !qCat || ((p.code || '') + ' ' + (p.name || '')).toLowerCase().includes(qCat));

    return `
      <!-- Customer Info -->
      <section class="bg-white border border-[#DCE5DF] rounded-xl p-3.5 sm:p-5">
        <div class="text-xs font-bold text-[#4A5D54] mb-2">Customer Details</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <input id="inputCustomerName" type="text" value="${escapeHtml(state.customerName)}" placeholder="Customer Name *" class="w-full h-11 px-3.5 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A]" />
          <input id="inputCustomerPhone" type="tel" value="${escapeHtml(state.customerPhone)}" placeholder="Phone Number (Optional)" class="w-full h-11 px-3.5 text-sm border border-[#C5D3CB] rounded-lg outline-none focus:border-[#1E562A] font-mono" />
        </div>
      </section>

      <!-- Select Price Tier (3-col mobile grid, flex on desktop) -->
      <section class="bg-white border border-[#DCE5DF] rounded-xl p-3.5 sm:p-4">
        <div class="text-xs font-bold text-[#4A5D54] mb-2">Select Price Tier</div>
        <div class="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          ${tiers
            .map(
              (tKey) => `
            <button data-tier="${tKey}" class="px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold border text-center cursor-pointer ${state.tier === tKey ? 'bg-[#1E562A] text-white border-[#1E562A]' : 'bg-white text-[#2F3E37] border-[#C5D3CB]'}">
              ${escapeHtml(tierLabels[tKey] || tKey)}
            </button>
          `
            )
            .join('')}
        </div>
      </section>

      ${
        state.tab === 'calculator'
          ? `
        <!-- Search Card -->
        <section class="bg-white border border-[#DCE5DF] rounded-xl p-3.5 sm:p-5 relative z-20">
          <div class="flex flex-wrap items-center justify-between gap-1 mb-2">
            <label for="inputSearch" class="text-sm font-bold text-[#14211B]">Find a Product</label>
            <button data-nav="catalog" class="text-xs font-semibold text-[#1E562A] hover:underline cursor-pointer">Browse Full Price List (${activeProducts.length} items) →</button>
          </div>
          <div class="relative">
            <input id="inputSearch" type="text" autocomplete="off" value="${escapeHtml(state.search)}" placeholder="Type any letter or word — e.g. Formula 1, Protein, Aloe, Afresh..." class="w-full h-12 px-3.5 text-sm sm:text-base border-2 border-[#B5C6BD] rounded-xl outline-none focus:border-[#1E562A]" />
          </div>
          ${
            state.search.trim()
              ? `
            <div class="mt-2 bg-white border border-[#C5D3CB] rounded-xl shadow-lg max-h-80 overflow-y-auto divide-y divide-[#EDF2EE]">
              ${
                suggestions.length === 0
                  ? `<div class="p-6 text-center text-sm text-[#687771]">No matching product found</div>`
                  : suggestions
                      .map(
                        ({ p, index }) => `
                <div data-add-index="${index}" class="flex items-center justify-between gap-2 px-3.5 py-3 hover:bg-[#E9F5EC] cursor-pointer">
                  <div class="min-w-0 flex-1">
                    <div class="text-xs sm:text-sm font-bold text-[#14211B] truncate">${escapeHtml(p.name)}</div>
                    <div class="text-[11px] text-[#5A6B63] font-mono">Code: ${escapeHtml(p.code || '—')} · ${Number(p.vp).toFixed(2)} VP · ${escapeHtml(tierLabels[state.tier])}</div>
                  </div>
                  <div class="font-mono text-xs sm:text-sm font-extrabold text-[#1E562A] shrink-0">${formatMoney(p[state.tier])} +</div>
                </div>
              `
                      )
                      .join('')
              }
            </div>
          `
              : ''
          }
        </section>

        <!-- Selected Products & Summary -->
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div class="lg:col-span-8 bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
            <div class="px-4 sm:px-5 py-3.5 border-b border-[#EDF2EE] flex items-center justify-between">
              <h2 class="text-sm sm:text-base font-bold">Selected Products</h2>
              <span class="text-xs font-mono text-[#5A6B63]">${cartItems.length} items · ${totalQty} units</span>
            </div>
            ${
              cartItems.length === 0
                ? `<div class="py-10 px-4 text-center text-xs sm:text-sm text-[#687771]">No product selected.<br/>Type a letter or word above to find a product.</div>`
                : `
              <div class="divide-y divide-[#EDF2EE]">
                ${cartItems
                  .map(
                    (item) => `
                  <div class="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-bold text-[#14211B]">${escapeHtml(item.p.name)}</div>
                      <div class="text-xs text-[#5A6B63] font-mono">Stock No: ${escapeHtml(item.p.code || '—')} · Unit VP: ${Number(item.p.vp).toFixed(2)}</div>
                      <div class="text-xs text-[#2F3E37] mt-1 font-mono">${escapeHtml(tierLabels[state.tier])}: ${formatMoney(item.unitPrice)} × ${item.qty} = <strong>${formatMoney(item.lineTotal)}</strong> · ${item.lineVp.toFixed(2)} VP</div>
                    </div>
                    <div class="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EDF2EE]">
                      <button data-remove-index="${item.index}" class="text-xs font-semibold text-[#B91C1C] px-2 py-1 rounded bg-[#FEF2F2] cursor-pointer">Remove</button>
                      <div class="flex items-center gap-1.5">
                        <button data-qty-delta="-1" data-qty-index="${item.index}" class="w-8 h-8 border border-[#C5D3CB] rounded-lg font-bold cursor-pointer">−</button>
                        <input data-qty-input="${item.index}" type="number" min="0" value="${item.qty}" class="w-12 h-8 text-center font-mono text-sm font-bold border border-[#C5D3CB] rounded-lg" />
                        <button data-qty-delta="1" data-qty-index="${item.index}" class="w-8 h-8 border border-[#C5D3CB] rounded-lg font-bold cursor-pointer">+</button>
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
            }
          </div>

          <aside class="lg:col-span-4 bg-white border border-[#DCE5DF] rounded-xl p-4 sm:p-5 space-y-3">
            <h2 class="text-base font-bold border-b border-[#EDF2EE] pb-2.5">Total Summary</h2>
            <div class="text-3xl font-extrabold font-mono text-[#14211B]">${formatMoney(totalPrice)}</div>
            ${totalSavings > 0 ? `<div class="text-xs font-semibold text-[#15803D] font-mono">You save ${formatMoney(totalSavings)} off MRP ${formatMoney(totalMrp)}</div>` : ''}
            <div class="py-2 border-t border-b border-[#EDF2EE] space-y-2 text-xs sm:text-sm">
              <div class="flex justify-between"><span>Total Quantity</span><strong class="font-mono">${totalQty}</strong></div>
              <div class="flex justify-between"><span>Total Volume Points</span><strong class="font-mono text-[#1E562A]">${totalVp.toFixed(2)} VP</strong></div>
            </div>
            <div class="p-3 rounded-lg bg-[#EDF7F0] text-xs flex justify-between">
              <span>Selected Price Tier:</span><strong class="text-[#1E562A]">${escapeHtml(tierLabels[state.tier])}</strong>
            </div>
            <button id="btnDownloadPdfDirect" class="w-full py-3 px-4 bg-[#1E562A] hover:bg-[#164220] text-white text-xs sm:text-sm font-bold rounded-lg cursor-pointer">Download PDF File (.pdf)</button>
          </aside>
        </section>
      `
          : ''
      }

      ${
        state.tab === 'catalog'
          ? `
        <section class="bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
          <div class="p-3.5 sm:p-4 border-b border-[#EDF2EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h2 class="text-sm sm:text-base font-bold">Complete Price List (${filteredCatalog.length} items)</h2>
              <p class="text-xs text-[#5A6B63]">Active Tier: <strong>${escapeHtml(tierLabels[state.tier])}</strong></p>
            </div>
            <input id="inputCatalogSearch" type="text" value="${escapeHtml(state.catalogSearch)}" placeholder="Search price list..." class="w-full sm:w-64 h-10 px-3 text-xs bg-[#F4F7F5] border border-[#C5D3CB] rounded-lg" />
          </div>

          <!-- Mobile-Friendly Product Cards (Shown on mobile screens) -->
          <div class="sm:hidden divide-y divide-[#EDF2EE]">
            ${filteredCatalog
              .map(({ p, index }) => {
                const inCartQty = state.cart.get(index) || 0;
                return `
              <div class="p-3.5 flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-[#14211B]">${escapeHtml(p.name)}</div>
                  <div class="text-[11px] text-[#5A6B63] font-mono mt-0.5">Code: ${escapeHtml(p.code || '—')} · ${Number(p.vp).toFixed(2)} VP · MRP: ${formatMoney(p.mrp)}</div>
                  <div class="text-xs font-extrabold text-[#1E562A] font-mono mt-1">${escapeHtml(tierLabels[state.tier])}: ${formatMoney(p[state.tier])}</div>
                </div>
                <button data-add-index="${index}" class="px-3 py-2 bg-[#1E562A] text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer">
                  ${inCartQty > 0 ? `+ Add (${inCartQty})` : '+ Add'}
                </button>
              </div>
            `;
              })
              .join('')}
          </div>

          <!-- Desktop Table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F4F7F5] border-b border-[#DCE5DF] font-bold text-[#4A5D54]">
                  <th class="p-3">Code</th><th class="p-3">Product Name</th><th class="p-3 text-right">VP</th><th class="p-3 text-right">MRP</th><th class="p-3 text-right bg-[#EDF7F0] text-[#1E562A]">${escapeHtml(tierLabels[state.tier])}</th><th class="p-3 text-center">Add</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EDF2EE] font-mono">
                ${filteredCatalog
                  .map(({ p, index }) => {
                    const inCartQty = state.cart.get(index) || 0;
                    return `
                  <tr class="hover:bg-[#F9FCFA]">
                    <td class="p-3">${escapeHtml(p.code || '—')}</td>
                    <td class="p-3 font-sans font-bold">${escapeHtml(p.name)}</td>
                    <td class="p-3 text-right text-[#1E562A] font-bold">${Number(p.vp).toFixed(2)}</td>
                    <td class="p-3 text-right">${formatMoney(p.mrp)}</td>
                    <td class="p-3 text-right bg-[#EDF7F0]/60 font-bold text-[#1E562A]">${formatMoney(p[state.tier])}</td>
                    <td class="p-3 text-center font-sans">
                      <button data-add-index="${index}" class="px-3 py-1.5 bg-[#1E562A] text-white rounded-lg text-xs font-bold cursor-pointer">
                        ${inCartQty > 0 ? `+ Add (${inCartQty})` : '+ Add'}
                      </button>
                    </td>
                  </tr>
                `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>
      `
          : ''
      }
    `;
  }

  function renderAdminView() {
    if (!state.adminUnlocked) {
      return `
        <section class="max-w-md mx-auto my-6 bg-white border border-[#DCE5DF] rounded-2xl p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-extrabold text-[#14211B]">Admin Panel Login</h2>
            <span class="px-2.5 py-0.5 text-[11px] font-bold rounded bg-[#FEF2F2] text-[#B91C1C]">Locked</span>
          </div>
          <p class="text-xs text-[#5A6B63]">প্রোডাক্ট, দাম (MRP, 25%, 35%, 42%, 50%), VP এবং ওয়েবসাইট সেটিংস পরিবর্তন করতে Admin PIN দিয়ে Login করুন।</p>
          <input id="inputAdminPin" type="password" placeholder="Enter Admin PIN (Default: 1234)" class="w-full h-11 px-3.5 text-sm font-mono border border-[#C5D3CB] rounded-xl" />
          <button id="btnUnlockAdmin" class="w-full py-3 bg-[#1E562A] text-white text-sm font-bold rounded-xl cursor-pointer">Login to Admin Panel</button>
        </section>
      `;
    }

    const q = state.adminSearch.trim().toLowerCase();
    const filteredAdminProducts = state.products
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => !q || ((p.code || '') + ' ' + (p.name || '')).toLowerCase().includes(q));

    return `
      <section class="bg-white border border-[#DCE5DF] rounded-xl p-3.5 sm:p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDF2EE] pb-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base font-extrabold text-[#14211B]">Master Admin Control Panel</h2>
              <span class="px-2 py-0.5 text-[11px] font-bold rounded bg-[#EDF7F0] text-[#1E562A] border border-[#B5DEC1]">
                Logged In · Firebase ${state.firebaseConnected ? 'Live' : 'Ready'}
              </span>
            </div>
            <p class="text-xs text-[#5A6B63] mt-0.5">যেকোনো প্রোডাক্ট বা সেটিংস পরিবর্তন করে "Save All to Firebase" চাপুন। কাজ শেষ হলে "Logout Admin" বাটনে ক্লিক করুন।</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button id="btnAddNewProduct" class="px-3 py-2 text-xs font-bold bg-[#EDF7F0] text-[#1E562A] border border-[#1E562A] rounded-lg cursor-pointer">+ Add Product</button>
            <button id="btnSaveAllFirebase" class="px-3.5 py-2 text-xs font-bold bg-[#1E562A] text-white rounded-lg cursor-pointer">Save All to Firebase</button>
            <button id="btnLockAdmin" class="px-3.5 py-2 text-xs font-bold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg cursor-pointer">Logout Admin</button>
          </div>
        </div>

        <!-- Admin Sub-navigation -->
        <div class="grid grid-cols-3 gap-1.5 border-b border-[#EDF2EE] pb-3">
          <button data-admin-tab="products" class="py-2 px-2 text-xs font-bold rounded-lg text-center truncate cursor-pointer ${state.adminSubTab === 'products' ? 'bg-[#1E562A] text-white' : 'bg-[#F4F7F5] text-[#2F3E37]'}">Products (${state.products.length})</button>
          <button data-admin-tab="settings" class="py-2 px-2 text-xs font-bold rounded-lg text-center truncate cursor-pointer ${state.adminSubTab === 'settings' ? 'bg-[#1E562A] text-white' : 'bg-[#F4F7F5] text-[#2F3E37]'}">Site Settings</button>
          <button data-admin-tab="backup" class="py-2 px-2 text-xs font-bold rounded-lg text-center truncate cursor-pointer ${state.adminSubTab === 'backup' ? 'bg-[#1E562A] text-white' : 'bg-[#F4F7F5] text-[#2F3E37]'}">Backup / Export</button>
        </div>

        ${
          state.adminSubTab === 'settings'
            ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#F4F7F5] p-3.5 sm:p-4 rounded-xl">
            <div>
              <label class="block text-xs font-bold mb-1">Brand Title (Header)</label>
              <input id="setBrandTitle" type="text" value="${escapeHtml(state.settings.brandTitle)}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Page Heading</label>
              <input id="setPageHeading" type="text" value="${escapeHtml(state.settings.pageHeading)}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold mb-1">Page Subtitle</label>
              <input id="setPageSubtitle" type="text" value="${escapeHtml(state.settings.pageSubtitle)}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">WhatsApp Help Number</label>
              <input id="setWhatsappNumber" type="text" value="${escapeHtml(state.settings.whatsappNumber)}" class="w-full h-10 px-3 text-xs font-mono bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">WhatsApp Pre-filled Message</label>
              <input id="setWhatsappMessage" type="text" value="${escapeHtml(state.settings.whatsappMessage)}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">WhatsApp Button Label</label>
              <input id="setWhatsappButtonLabel" type="text" value="${escapeHtml(state.settings.whatsappButtonLabel || 'Help')}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Admin PIN</label>
              <input id="setAdminPin" type="text" value="${escapeHtml(state.settings.adminPin || '1234')}" class="w-full h-10 px-3 text-xs font-mono bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold mb-1">Footer Disclaimer (Line 1)</label>
              <input id="setFooterLine1" type="text" value="${escapeHtml(state.settings.footerLine1)}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold mb-1">Footer Creator Credit (Line 2)</label>
              <input id="setFooterLine2" type="text" value="${escapeHtml(state.settings.footerLine2)}" class="w-full h-10 px-3 text-xs bg-white border border-[#C5D3CB] rounded-lg" />
            </div>
          </div>
        `
            : ''
        }

        ${
          state.adminSubTab === 'backup'
            ? `
          <div class="bg-[#F4F7F5] p-4 rounded-xl space-y-3">
            <h3 class="text-sm font-bold">Export, Backup & Restore</h3>
            <div class="flex flex-wrap gap-2.5">
              <button id="btnExportDataJs" class="px-4 py-2.5 text-xs font-bold bg-[#1E562A] text-white rounded-lg cursor-pointer">Download data.js</button>
              <button id="btnExportJson" class="px-4 py-2.5 text-xs font-bold bg-white text-[#14211B] border border-[#C5D3CB] rounded-lg cursor-pointer">Download JSON Backup</button>
              <button id="btnResetDefaults" class="px-4 py-2.5 text-xs font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] rounded-lg cursor-pointer">Reset to Default 39 Products</button>
            </div>
          </div>
        `
            : ''
        }

        ${
          state.adminSubTab === 'products'
            ? `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <input id="inputAdminSearch" type="text" value="${escapeHtml(state.adminSearch)}" placeholder="Search products in Admin..." class="w-full sm:w-64 h-10 px-3 text-xs bg-[#F4F7F5] border border-[#C5D3CB] rounded-lg" />
            <span class="text-xs text-[#5A6B63]">Showing ${filteredAdminProducts.length} of ${state.products.length} products</span>
          </div>

          <!-- Mobile Admin Product Cards (Easy editing on any mobile phone!) -->
          <div class="sm:hidden space-y-3">
            ${filteredAdminProducts
              .map(
                ({ p, idx }) => `
              <div class="p-3 bg-[#F4F7F5] border border-[#DCE5DF] rounded-xl space-y-2 text-xs">
                <div class="flex items-center gap-2">
                  <input data-prod-idx="${idx}" data-prod-field="code" value="${escapeHtml(p.code || '')}" placeholder="Code" class="w-20 h-9 px-2 font-mono bg-white border border-[#C5D3CB] rounded" />
                  <input data-prod-idx="${idx}" data-prod-field="name" value="${escapeHtml(p.name)}" placeholder="Product Name" class="flex-1 h-9 px-2 font-bold bg-white border border-[#C5D3CB] rounded" />
                </div>
                <div class="grid grid-cols-4 gap-1.5">
                  <div><label class="text-[10px] text-[#5A6B63]">VP</label><input data-prod-idx="${idx}" data-prod-field="vp" type="number" step="0.05" value="${p.vp}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                  <div><label class="text-[10px] text-[#5A6B63]">MRP</label><input data-prod-idx="${idx}" data-prod-field="mrp" type="number" value="${p.mrp}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                  <div><label class="text-[10px] text-[#5A6B63]">Retail</label><input data-prod-idx="${idx}" data-prod-field="retail" type="number" value="${p.retail}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                  <div><label class="text-[10px] text-[#5A6B63]">EarnBase</label><input data-prod-idx="${idx}" data-prod-field="earnBase" type="number" value="${p.earnBase}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                  <div><label class="text-[10px] text-[#5A6B63]">25%</label><input data-prod-idx="${idx}" data-prod-field="p25" type="number" value="${p.p25}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                  <div><label class="text-[10px] text-[#1E562A] font-bold">35%</label><input data-prod-idx="${idx}" data-prod-field="p35" type="number" value="${p.p35}" class="w-full h-8 px-1.5 font-mono font-bold bg-[#EDF7F0] border border-[#1E562A] rounded" /></div>
                  <div><label class="text-[10px] text-[#5A6B63]">42%</label><input data-prod-idx="${idx}" data-prod-field="p42" type="number" value="${p.p42}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                  <div><label class="text-[10px] text-[#5A6B63]">50%</label><input data-prod-idx="${idx}" data-prod-field="p50" type="number" value="${p.p50}" class="w-full h-8 px-1.5 font-mono bg-white border border-[#C5D3CB] rounded" /></div>
                </div>
                <div class="flex items-center justify-between pt-1">
                  <button data-auto-prod="${idx}" class="px-2.5 py-1 bg-[#EDF7F0] text-[#1E562A] font-bold rounded border border-[#B5DEC1]">Auto-Fill Tiers from MRP</button>
                  <button data-del-prod="${idx}" class="px-2.5 py-1 bg-[#FEF2F2] text-[#B91C1C] font-bold rounded border border-[#FECACA]">Delete</button>
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <!-- Desktop Admin Spreadsheet -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F4F7F5] border-b border-[#DCE5DF] font-bold">
                  <th class="p-2">Code</th><th class="p-2 min-w-[200px]">Product Name</th><th class="p-2">VP</th><th class="p-2">MRP</th><th class="p-2">Retail</th><th class="p-2">EarnBase</th><th class="p-2">25%</th><th class="p-2">35%</th><th class="p-2">42%</th><th class="p-2">50%</th><th class="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EDF2EE]">
                ${filteredAdminProducts
                  .map(
                    ({ p, idx }) => `
                  <tr>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="code" value="${escapeHtml(p.code || '')}" class="w-16 px-2 py-1 font-mono border border-[#C5D3CB] rounded" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="name" value="${escapeHtml(p.name)}" class="w-full px-2 py-1 font-semibold border border-[#C5D3CB] rounded" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="vp" type="number" step="0.05" value="${p.vp}" class="w-16 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="mrp" type="number" value="${p.mrp}" class="w-18 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="retail" type="number" value="${p.retail}" class="w-18 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="earnBase" type="number" value="${p.earnBase}" class="w-18 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="p25" type="number" value="${p.p25}" class="w-18 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="p35" type="number" value="${p.p35}" class="w-18 px-2 py-1 font-mono font-bold bg-[#EDF7F0] border border-[#1E562A] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="p42" type="number" value="${p.p42}" class="w-18 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5"><input data-prod-idx="${idx}" data-prod-field="p50" type="number" value="${p.p50}" class="w-18 px-2 py-1 font-mono border border-[#C5D3CB] rounded text-right" /></td>
                    <td class="p-1.5 text-center whitespace-nowrap">
                      <button data-auto-prod="${idx}" title="Auto-fill tiers from MRP" class="text-[#1E562A] font-bold px-1.5 py-1 hover:underline cursor-pointer">Auto</button>
                      <button data-del-prod="${idx}" title="Delete product" class="text-[#B91C1C] font-bold px-1.5 py-1 cursor-pointer">×</button>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
            : ''
        }
      </section>
    `;
  }

  function collectSettingsFromDom() {
    const bt = document.getElementById('setBrandTitle');
    const ph = document.getElementById('setPageHeading');
    const ps = document.getElementById('setPageSubtitle');
    const wn = document.getElementById('setWhatsappNumber');
    const wm = document.getElementById('setWhatsappMessage');
    const wl = document.getElementById('setWhatsappButtonLabel');
    const ap = document.getElementById('setAdminPin');
    const fl1 = document.getElementById('setFooterLine1');
    const fl2 = document.getElementById('setFooterLine2');
    if (bt) state.settings.brandTitle = bt.value;
    if (ph) state.settings.pageHeading = ph.value;
    if (ps) state.settings.pageSubtitle = ps.value;
    if (wn) state.settings.whatsappNumber = wn.value;
    if (wm) state.settings.whatsappMessage = wm.value;
    if (wl) state.settings.whatsappButtonLabel = wl.value;
    if (ap) state.settings.adminPin = ap.value;
    if (fl1) state.settings.footerLine1 = fl1.value;
    if (fl2) state.settings.footerLine2 = fl2.value;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function bindEvents(cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, tierLabels) {
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        collectSettingsFromDom();
        state.tab = btn.getAttribute('data-nav');
        renderApp();
      };
    });

    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.onclick = () => {
        collectSettingsFromDom();
        state.adminSubTab = btn.getAttribute('data-admin-tab');
        renderApp();
      };
    });

    document.querySelectorAll('[data-tier]').forEach((btn) => {
      btn.onclick = () => {
        state.tier = btn.getAttribute('data-tier');
        saveLocalState();
        renderApp();
      };
    });

    const nameInput = document.getElementById('inputCustomerName');
    if (nameInput) {
      nameInput.oninput = (e) => {
        state.customerName = e.target.value;
        saveLocalState();
      };
    }

    const phoneInput = document.getElementById('inputCustomerPhone');
    if (phoneInput) {
      phoneInput.oninput = (e) => {
        state.customerPhone = e.target.value;
        saveLocalState();
      };
    }

    const searchInput = document.getElementById('inputSearch');
    if (searchInput) {
      searchInput.oninput = (e) => {
        state.search = e.target.value;
        renderApp();
      };
    }

    const catSearchInput = document.getElementById('inputCatalogSearch');
    if (catSearchInput) {
      catSearchInput.oninput = (e) => {
        state.catalogSearch = e.target.value;
        renderApp();
      };
    }

    const adminSearchInput = document.getElementById('inputAdminSearch');
    if (adminSearchInput) {
      adminSearchInput.oninput = (e) => {
        state.adminSearch = e.target.value;
        renderApp();
      };
    }

    document.querySelectorAll('[data-add-index]').forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-add-index'));
        state.cart.set(idx, (state.cart.get(idx) || 0) + 1);
        state.search = '';
        saveLocalState();
        renderApp();
      };
    });

    document.querySelectorAll('[data-remove-index]').forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-remove-index'));
        state.cart.delete(idx);
        saveLocalState();
        renderApp();
      };
    });

    document.querySelectorAll('[data-qty-delta]').forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-qty-index'));
        const delta = Number(el.getAttribute('data-qty-delta'));
        const next = (state.cart.get(idx) || 0) + delta;
        if (next <= 0) state.cart.delete(idx);
        else state.cart.set(idx, next);
        saveLocalState();
        renderApp();
      };
    });

    document.querySelectorAll('[data-qty-input]').forEach((el) => {
      el.onchange = (e) => {
        const idx = Number(el.getAttribute('data-qty-input'));
        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
        if (val === 0) state.cart.delete(idx);
        else state.cart.set(idx, val);
        saveLocalState();
        renderApp();
      };
    });

    const clearBtn = document.getElementById('btnClearCart');
    if (clearBtn) {
      clearBtn.onclick = () => {
        state.cart.clear();
        state.customerName = '';
        state.customerPhone = '';
        state.search = '';
        saveLocalState();
        renderApp();
      };
    }

    const openPdfFlow = () => {
      if (!state.customerName.trim()) {
        if (state.tab === 'admin') state.tab = 'calculator';
        showToast('PDF ডাউনলোড করার আগে Customer Name লিখুন');
        setTimeout(() => {
          const el = document.getElementById('inputCustomerName');
          if (el) el.focus();
        }, 50);
        return;
      }
      state.invoiceModalOpen = true;
      renderApp();
    };

    const p1 = document.getElementById('btnPrintQuote');
    if (p1) p1.onclick = openPdfFlow;

    const pDirect = document.getElementById('btnDownloadPdfDirect');
    if (pDirect) {
      pDirect.onclick = () => {
        if (!state.customerName.trim()) {
          openPdfFlow();
          return;
        }
        downloadDirectPdf(cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, tierLabels);
      };
    }

    const closeTop = document.getElementById('btnCloseModalTop');
    if (closeTop) {
      closeTop.onclick = () => {
        state.invoiceModalOpen = false;
        renderApp();
      };
    }
    const closeBottom = document.getElementById('btnCloseModalBottom');
    if (closeBottom) {
      closeBottom.onclick = () => {
        state.invoiceModalOpen = false;
        renderApp();
      };
    }
    const btnBrowserPrint = document.getElementById('btnBrowserPrint');
    if (btnBrowserPrint) {
      btnBrowserPrint.onclick = () => {
        window.print();
      };
    }
    const btnConfirmDownloadPdf = document.getElementById('btnConfirmDownloadPdf');
    if (btnConfirmDownloadPdf) {
      btnConfirmDownloadPdf.onclick = () => {
        downloadDirectPdf(cartItems, totalPrice, totalMrp, totalQty, totalVp, totalSavings, tierLabels);
      };
    }

    const unlockBtn = document.getElementById('btnUnlockAdmin');
    if (unlockBtn) {
      unlockBtn.onclick = () => {
        const pinEl = document.getElementById('inputAdminPin');
        const entered = pinEl ? pinEl.value.trim() : '';
        if (entered === (state.settings.adminPin || '1234')) {
          state.adminUnlocked = true;
          try {
            sessionStorage.setItem('hl_admin_unlocked', 'true');
          } catch {}
          showToast('Admin Panel Logged In!');
          renderApp();
        } else {
          showToast('ভুল PIN! Default PIN: 1234');
        }
      };
    }

    const handleLogout = () => {
      state.adminUnlocked = false;
      try {
        sessionStorage.removeItem('hl_admin_unlocked');
      } catch {}
      showToast('Admin Panel Logged Out');
      renderApp();
    };

    const lockBtn = document.getElementById('btnLockAdmin');
    if (lockBtn) lockBtn.onclick = handleLogout;

    const headerLogoutBtn = document.getElementById('btnHeaderLogout');
    if (headerLogoutBtn) headerLogoutBtn.onclick = handleLogout;

    document.querySelectorAll('[data-prod-idx]').forEach((el) => {
      el.onchange = (e) => {
        const idx = Number(el.getAttribute('data-prod-idx'));
        const field = el.getAttribute('data-prod-field');
        if (field === 'code' || field === 'name') {
          state.products[idx][field] = e.target.value;
        } else {
          state.products[idx][field] = Number(e.target.value) || 0;
        }
        saveLocalState();
      };
    });

    document.querySelectorAll('[data-auto-prod]').forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-auto-prod'));
        autoComputeProductTiers(state.products[idx]);
        saveLocalState();
        renderApp();
        showToast('Discount tiers auto-calculated from MRP');
      };
    });

    document.querySelectorAll('[data-del-prod]').forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-del-prod'));
        state.products.splice(idx, 1);
        syncToFirebase('Product deleted & synced');
      };
    });

    const addProdBtn = document.getElementById('btnAddNewProduct');
    if (addProdBtn) {
      addProdBtn.onclick = () => {
        collectSettingsFromDom();
        state.adminSubTab = 'products';
        state.products.unshift({
          code: 'NEW',
          name: 'New Herbalife Product',
          vp: 10.0,
          mrp: 1000,
          retail: 952,
          earnBase: 815,
          p25: 786,
          p35: 700,
          p42: 641,
          p50: 572,
          active: true,
        });
        saveLocalState();
        renderApp();
        showToast('নতুন প্রোডাক্ট যোগ হয়েছে — নাম ও দাম লিখে Save All চাপুন');
      };
    }

    const saveAllBtn = document.getElementById('btnSaveAllFirebase');
    if (saveAllBtn) {
      saveAllBtn.onclick = () => {
        collectSettingsFromDom();
        syncToFirebase('সব পরিবর্তন Firebase-এ লাইভ সেভ হয়েছে!');
      };
    }

    const exportDataJsBtn = document.getElementById('btnExportDataJs');
    if (exportDataJsBtn) {
      exportDataJsBtn.onclick = () => {
        const content = 'const products = ' + JSON.stringify(state.products, null, 2) + ';\n';
        downloadFile('data.js', content, 'application/javascript');
      };
    }

    const exportJsonBtn = document.getElementById('btnExportJson');
    if (exportJsonBtn) {
      exportJsonBtn.onclick = () => {
        const content = JSON.stringify({ products: state.products, settings: state.settings }, null, 2);
        downloadFile('herbalife-backup.json', content, 'application/json');
      };
    }

    const resetBtn = document.getElementById('btnResetDefaults');
    if (resetBtn) {
      resetBtn.onclick = () => {
        state.products = DEFAULT_PRODUCTS.map((p) => ({ ...p }));
        state.settings = { ...DEFAULT_SETTINGS, tierLabels: { ...DEFAULT_SETTINGS.tierLabels } };
        syncToFirebase('Default 39 products restored & synced');
      };
    }
  }

  // Render immediately at 0ms so the screen is never blank!
  renderApp();

  // Connect to Firebase Firestore asynchronously in the background
  initFirebaseSync();
})();
