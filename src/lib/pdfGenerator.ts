import { ProductItem, SiteSettings, PriceTierKey } from '../data/defaultConfig';

export interface PdfCartEntry {
  index: number;
  product: ProductItem;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  unitMrp: number;
  lineMrp: number;
  unitVp: number;
  lineVp: number;
}

export interface PdfQuoteData {
  customerName: string;
  customerPhone: string;
  tier: PriceTierKey;
  tierLabel: string;
  cartEntries: PdfCartEntry[];
  totalPrice: number;
  totalMrp: number;
  totalQty: number;
  totalVp: number;
  totalSavings: number;
  savingsPercent: string;
  settings: SiteSettings;
}

function toAscii(str: string): string {
  return String(str || '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[™®©]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function pdfEscape(str: string): string {
  return toAscii(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function fmtRs(n: number): string {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function downloadQuotePdf(data: PdfQuoteData): void {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const brandTitle = toAscii(data.settings.invoiceTitle || data.settings.brandTitle || 'HERBALIFE CALCULATOR') || 'HERBALIFE CALCULATOR';
  const subtitle = toAscii(data.settings.invoiceSubtitle || 'Customer Price & Volume Point Estimate') || 'Customer Price & Volume Point Estimate';
  const custName = toAscii(data.customerName) || 'Walk-in Customer';
  const custPhone = toAscii(data.customerPhone) || '-';
  const tierName = toAscii(data.tierLabel) || '35%';

  // Paginate items (max 18 items per page)
  const itemsPerPage = 18;
  const pages: PdfCartEntry[][] = [];
  if (data.cartEntries.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < data.cartEntries.length; i += itemsPerPage) {
      pages.push(data.cartEntries.slice(i, i + itemsPerPage));
    }
  }

  const pageStreams: string[] = [];

  pages.forEach((pageItems, pageIdx) => {
    const ops: string[] = [];
    let y = pageHeight - margin;

    // 1. Header Banner (#1E562A)
    const headerH = 58;
    ops.push('0.118 0.337 0.165 rg');
    ops.push(`${margin} ${y - headerH} ${contentWidth} ${headerH} re f`);

    // Brand Title (White Bold 16pt)
    ops.push('1 1 1 rg');
    ops.push(`BT /F2 16 Tf ${margin + 14} ${y - 24} Td (${pdfEscape(brandTitle)}) Tj ET`);
    ops.push(`BT /F1 9.5 Tf ${margin + 14} ${y - 42} Td (${pdfEscape(subtitle)}) Tj ET`);

    // Right side Date & Tier in Header
    const dateText = `Date: ${dateStr}`;
    const tierText = `Price Tier: ${tierName}`;
    ops.push(`BT /F2 9.5 Tf ${pageWidth - margin - 145} ${y - 24} Td (${pdfEscape(dateText)}) Tj ET`);
    ops.push(`BT /F2 9.5 Tf ${pageWidth - margin - 145} ${y - 40} Td (${pdfEscape(tierText)}) Tj ET`);

    y -= headerH + 12;

    // 2. Customer Info Box (#F4F7F5)
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

    // 3. Table Header (#1E562A)
    const thH = 24;
    ops.push('0.118 0.337 0.165 rg');
    ops.push(`${margin} ${y - thH} ${contentWidth} ${thH} re f`);

    // Column X positions
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

    // 4. Table Rows
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
        // Row bottom border
        ops.push('0.89 0.92 0.90 RG 0.5 w');
        ops.push(`${margin} ${y - rowH} m ${margin + contentWidth} ${y - rowH} l S`);

        const pName = toAscii(item.product.name).slice(0, 40);
        const pCode = toAscii(item.product.code || '-');

        ops.push('0.078 0.129 0.106 rg');
        ops.push(`BT /F1 8.5 Tf ${colNo} ${y - 14} Td (${globalIdx}) Tj ET`);
        ops.push(`BT /F1 8.5 Tf ${colCode} ${y - 14} Td (${pdfEscape(pCode)}) Tj ET`);
        ops.push(`BT /F2 8.5 Tf ${colName} ${y - 14} Td (${pdfEscape(pName)}) Tj ET`);
        ops.push(`BT /F1 8.5 Tf ${colVp} ${y - 14} Td (${item.unitVp.toFixed(2)}) Tj ET`);
        ops.push(`BT /F1 8.5 Tf ${colUnit} ${y - 14} Td (${pdfEscape(fmtRs(item.unitPrice))}) Tj ET`);
        ops.push(`BT /F2 8.5 Tf ${colQty + 4} ${y - 14} Td (${item.qty}) Tj ET`);
        ops.push(`BT /F1 8.5 Tf ${colTotVp} ${y - 14} Td (${item.lineVp.toFixed(2)}) Tj ET`);
        ops.push(`BT /F2 8.5 Tf ${colTotal - 4} ${y - 14} Td (${pdfEscape(fmtRs(item.lineTotal))}) Tj ET`);

        y -= rowH;
      });
    }

    // 5. Totals Summary Box (on last page)
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
      ops.push(`BT /F1 9 Tf ${boxX + 12} ${y - 18} Td (Total Items: ${data.cartEntries.length}   |   Total Qty: ${data.totalQty}) Tj ET`);
      ops.push(`BT /F2 9.5 Tf ${boxX + 12} ${y - 35} Td (Total Volume Points: ${data.totalVp.toFixed(2)} VP) Tj ET`);
      ops.push(`BT /F1 9 Tf ${boxX + 12} ${y - 52} Td (Total MRP Value: ${pdfEscape(fmtRs(data.totalMrp))}) Tj ET`);

      if (data.totalSavings > 0) {
        ops.push('0.082 0.502 0.239 rg');
        ops.push(`BT /F2 9 Tf ${boxX + 12} ${y - 68} Td (Savings vs MRP: -${pdfEscape(fmtRs(data.totalSavings))} (${data.savingsPercent}%)) Tj ET`);
      }

      // Grand Total Green Bar inside Summary Box
      ops.push('0.118 0.337 0.165 rg');
      ops.push(`${boxX} ${y - boxH} ${boxW} 32 re f`);
      ops.push('1 1 1 rg');
      ops.push(`BT /F2 11.5 Tf ${boxX + 12} ${y - boxH + 11} Td (GRAND TOTAL: ${pdfEscape(fmtRs(data.totalPrice))}) Tj ET`);
    }

    // 6. Footer at bottom of page
    const footY = margin + 18;
    ops.push('0.85 0.88 0.86 RG 0.6 w');
    ops.push(`${margin} ${footY + 14} m ${pageWidth - margin} ${footY + 14} l S`);
    ops.push('0.35 0.42 0.38 rg');
    ops.push(`BT /F1 8 Tf ${margin} ${footY} Td (Herbalife Price & Volume Point Estimate  |  Verify with official price list before transaction.) Tj ET`);
    ops.push(`BT /F2 8 Tf ${margin} ${footY - 12} Td (Website created by: TANMOY DARI  |  Page ${pageIdx + 1} of ${pages.length}) Tj ET`);

    pageStreams.push(ops.join('\n'));
  });

  // Assemble valid PDF 1.4 document
  const objects: string[] = [];
  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  // Obj 2: Pages (kids filled below)
  const firstPageObjNum = 5;
  const kidsRefs = pageStreams.map((_, i) => `${firstPageObjNum + i * 2} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs}] /Count ${pageStreams.length} >>\nendobj`);
  // Obj 3: Font F1 (Helvetica)
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj');
  // Obj 4: Font F2 (Helvetica-Bold)
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj');

  pageStreams.forEach((stream, i) => {
    const pageObjNum = firstPageObjNum + i * 2;
    const contentObjNum = pageObjNum + 1;
    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
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
  const safeName = (data.customerName.trim() || 'Customer').replace(/[^a-z0-9_-]/gi, '_');
  a.href = url;
  a.download = `Herbalife_Quote_${safeName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
