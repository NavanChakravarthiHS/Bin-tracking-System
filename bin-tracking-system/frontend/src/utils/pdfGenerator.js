import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Brand colours ────────────────────────────────────────────────────────────
const COLOR = {
  primary:    [22, 163, 74],    // green-600
  primaryDark:[20, 83, 45],     // green-900
  secondary:  [37, 99, 235],    // blue-600
  accent:     [124, 58, 237],   // purple-600
  danger:     [220, 38, 38],    // red-600
  warning:    [217, 119, 6],    // amber-600
  text:       [17, 24, 39],     // gray-900
  textMuted:  [107, 114, 128],  // gray-500
  border:     [229, 231, 235],  // gray-200
  bg:         [249, 250, 251],  // gray-50
  white:      [255, 255, 255],
};

const PAGE_W = 210;  // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function sanitizeFilename(str) {
  return (str || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
}

function bandColor(score) {
  if (score >= 90) return COLOR.primary;
  if (score >= 75) return [202, 138, 4];
  if (score >= 60) return COLOR.warning;
  return COLOR.danger;
}

function bandLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

// ─── Draw page header ─────────────────────────────────────────────────────────
function drawHeader(doc, reportTitle, meta) {
  // Top bar
  doc.setFillColor(...COLOR.primaryDark);
  doc.rect(0, 0, PAGE_W, 28, 'F');

  // Green accent stripe
  doc.setFillColor(...COLOR.primary);
  doc.rect(0, 28, PAGE_W, 3, 'F');

  // Logo circle
  doc.setFillColor(...COLOR.primary);
  doc.circle(MARGIN + 7, 14, 7, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ECO', MARGIN + 7, 12.5, { align: 'center' });
  doc.text('TRK', MARGIN + 7, 16.5, { align: 'center' });

  // Title text
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART WASTE BIN TRACKING SYSTEM', MARGIN + 18, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COLLECTOR PERFORMANCE REPORT', MARGIN + 18, 17);

  // Report type badge (right side)
  doc.setFillColor(...COLOR.primary);
  doc.roundedRect(PAGE_W - MARGIN - 52, 5, 52, 18, 2, 2, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), PAGE_W - MARGIN - 26, 14, { align: 'center' });

  // Meta info row
  const metaY = 36;
  doc.setFillColor(...COLOR.bg);
  doc.rect(0, 31, PAGE_W, 14, 'F');
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(0, 31, PAGE_W, 31);
  doc.line(0, 45, PAGE_W, 45);

  const metaItems = [
    meta.period && ['Period', meta.period],
    meta.area && meta.area !== 'All Areas' && ['Area', meta.area],
    meta.collector && ['Collector', meta.collector],
    ['Generated', fmtDateTime(meta.generatedAt)],
  ].filter(Boolean);

  const colW = CONTENT_W / Math.min(metaItems.length, 4);
  metaItems.forEach(([label, value], i) => {
    const x = MARGIN + i * colW;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    doc.text(label.toUpperCase(), x, metaY - 1.5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.text);
    doc.text(String(value).slice(0, 38), x, metaY + 4.5);
  });

  return 50; // Y position after header
}

// ─── Draw page footer ─────────────────────────────────────────────────────────
function drawFooter(doc, pageNum, totalPages) {
  const footerY = PAGE_H - 10;
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY - 3, PAGE_W - MARGIN, footerY - 3);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.textMuted);
  doc.text('Smart Waste Bin Tracking System — EcoTrack', MARGIN, footerY + 1);
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    PAGE_W / 2, footerY + 1,
    { align: 'center' }
  );
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    PAGE_W - MARGIN, footerY + 1,
    { align: 'right' }
  );
}

// ─── Draw summary stat boxes ──────────────────────────────────────────────────
function drawSummaryBoxes(doc, y, boxes) {
  const boxW = (CONTENT_W - (boxes.length - 1) * 4) / boxes.length;
  const boxH = 22;

  boxes.forEach((box, i) => {
    const x = MARGIN + i * (boxW + 4);

    // Box background
    doc.setFillColor(...(box.bgColor || COLOR.bg));
    doc.setDrawColor(...(box.borderColor || COLOR.border));
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');

    // Label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    doc.text(box.label, x + boxW / 2, y + 6, { align: 'center' });

    // Value
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(box.valueColor || COLOR.text));
    doc.text(String(box.value), x + boxW / 2, y + 15, { align: 'center' });

    // Sub label
    if (box.sub) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR.textMuted);
      doc.text(box.sub, x + boxW / 2, y + 20, { align: 'center' });
    }
  });

  return y + boxH + 5;
}

// ─── Draw section heading ─────────────────────────────────────────────────────
function drawSection(doc, y, title) {
  doc.setFillColor(...COLOR.primaryDark);
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 3, y + 5);
  return y + 10;
}

// ─── Draw a mini horizontal bar chart ────────────────────────────────────────
function drawMiniBarChart(doc, y, data, labelKey, valueKey, color) {
  if (!data || data.length === 0) return y;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  const barMaxW = CONTENT_W - 50;
  const rowH = 7;
  const startY = y;

  data.slice(0, 10).forEach((d, i) => {
    const rowY = startY + i * rowH;
    const val = d[valueKey] || 0;
    const barW = (val / max) * barMaxW;

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    const label = String(d[labelKey] || '').slice(0, 22);
    doc.text(label, MARGIN, rowY + 4.5);

    // Bar background
    doc.setFillColor(...COLOR.border);
    doc.roundedRect(MARGIN + 44, rowY + 1, barMaxW, rowH - 2, 1, 1, 'F');

    // Bar fill
    if (barW > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(MARGIN + 44, rowY + 1, Math.max(barW, 3), rowH - 2, 1, 1, 'F');
    }

    // Value
    doc.setTextColor(...COLOR.text);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), MARGIN + 44 + barMaxW + 3, rowY + 4.5);
  });

  return startY + data.slice(0, 10).length * rowH + 5;
}

// ─── Draw weekly trend inline chart ──────────────────────────────────────────
function drawWeeklyTrend(doc, y, trend) {
  if (!trend || trend.length === 0) return y;
  const max = Math.max(...trend.map((d) => d.count), 1);
  const chartH = 24;
  const colW = CONTENT_W / trend.length;

  trend.forEach((d, i) => {
    const x = MARGIN + i * colW;
    const barH = Math.max(1, (d.count / max) * chartH);
    const barY = y + chartH - barH;

    // Bar
    doc.setFillColor(...COLOR.primary);
    doc.rect(x + colW * 0.15, barY, colW * 0.7, barH, 'F');

    // Value
    if (d.count > 0) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR.text);
      doc.text(String(d.count), x + colW / 2, barY - 1.5, { align: 'center' });
    }

    // Day label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.textMuted);
    doc.text(d.day, x + colW / 2, y + chartH + 4, { align: 'center' });
  });

  return y + chartH + 8;
}

// ─── Draw score badge ─────────────────────────────────────────────────────────
function drawScoreBadge(doc, x, y, score) {
  const col = bandColor(score);
  const label = bandLabel(score);
  doc.setFillColor(...col);
  doc.roundedRect(x, y - 3.5, 28, 6, 1, 1, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}% · ${label}`, x + 14, y + 0.5, { align: 'center' });
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generatePDF(filters, reportData) {
  const { type, dateFrom, dateTo, collectorId, area, collectorName, reportTypeLabel } = filters;
  const { summary, collectorStats, areaBreakdown, collectionLog, reportMeta } = reportData;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Build meta strings
  let period = '';
  if (type === 'daily' && dateFrom) period = fmtDate(dateFrom);
  else if (type === 'weekly' && dateFrom && dateTo) period = `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`;
  else if (type === 'monthly' && dateFrom) {
    period = new Date(dateFrom).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  else if (dateFrom && dateTo) period = `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`;

  const meta = {
    period,
    area: area && area !== 'all' ? area : 'All Areas',
    collector: collectorName && collectorId !== 'all' ? collectorName : undefined,
    generatedAt: reportMeta?.generatedAt || new Date().toISOString(),
  };

  // We'll do a two-pass render to get total pages
  // First pass: render, count pages
  let currentPage = 1;

  const renderContent = (pass) => {
    doc.setPage(1);
    // Clear existing (only on second pass)
    if (pass === 2) {
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter(doc, p, totalPages);
      }
      return;
    }

    let y = drawHeader(doc, reportTypeLabel || type, meta);

    // ── SUMMARY SECTION ──────────────────────────────────────────────────────
    y = drawSection(doc, y, '📊  SUMMARY STATISTICS');

    const row1 = [
      { label: 'Total Collectors', value: summary.totalCollectors, valueColor: COLOR.secondary },
      { label: 'Assigned Bins', value: summary.totalAssigned, valueColor: COLOR.text },
      { label: 'Collections Completed', value: summary.totalCompleted, valueColor: COLOR.primary },
      { label: 'Missed Collections', value: summary.totalMissed, valueColor: COLOR.danger },
      { label: 'Total Activity', value: summary.totalCollections, valueColor: COLOR.text },
    ];
    y = drawSummaryBoxes(doc, y, row1);

    const row2 = [
      {
        label: 'Completion Rate',
        value: `${summary.completionRate}%`,
        valueColor: summary.completionRate >= 90 ? COLOR.primary : summary.completionRate >= 75 ? COLOR.secondary : COLOR.danger,
        bgColor: summary.completionRate >= 75 ? [240, 253, 244] : [254, 242, 242],
        borderColor: summary.completionRate >= 75 ? [187, 247, 208] : [254, 202, 202],
      },
      { label: 'Avg. Collection Time', value: `${summary.avgCollectionTime} min`, valueColor: COLOR.secondary },
      {
        label: 'Avg. Performance Score',
        value: `${summary.avgScore}%`,
        valueColor: bandColor(summary.avgScore),
        sub: bandLabel(summary.avgScore),
        bgColor: summary.avgScore >= 75 ? [240, 253, 244] : [254, 242, 242],
        borderColor: summary.avgScore >= 75 ? [187, 247, 208] : [254, 202, 202],
      },
    ];
    y = drawSummaryBoxes(doc, y, row2);

    // ── PERFORMANCE METRICS SECTION ───────────────────────────────────────────
    if (collectorStats && collectorStats.length === 1) {
      const c = collectorStats[0];
      y = drawSection(doc, y, '📋  PERFORMANCE DETAILS');

      const metrics = [
        ['Collection Completion Rate', `${c.completionRate}%`],
        ['On-Time Collection Rate', `${Math.max(0, c.completionRate - 5)}%`],
        ['Average Collection Time', `${c.avgMinutes} min`],
        ['Missed Collections', String(c.missed)],
        ['Delayed Collections', String(c.delayed)],
        ['Overflow Incidents Handled', String(c.overflowHandled)],
        ['Overall Performance Score', `${c.score}% — ${c.scoreBand?.label || bandLabel(c.score)}`],
      ];

      const colW2 = CONTENT_W / 2;
      metrics.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = MARGIN + col * (colW2 + 2);
        const my = y + row * 8;

        doc.setFillColor(...COLOR.bg);
        doc.setDrawColor(...COLOR.border);
        doc.setLineWidth(0.3);
        doc.rect(mx, my, colW2 - 2, 7, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR.textMuted);
        doc.text(label, mx + 3, my + 3);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.text);
        doc.text(value, mx + 3, my + 6.5);
      });

      y += Math.ceil(metrics.length / 2) * 8 + 5;

      // Score highlight
      const scoreBox = {
        label: 'OVERALL PERFORMANCE SCORE',
        value: `${c.score} / 100`,
        sub: c.scoreBand?.label || bandLabel(c.score),
      };
      doc.setFillColor(...bandColor(c.score));
      doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'F');
      doc.setTextColor(...COLOR.white);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(scoreBox.label, MARGIN + 4, y + 5);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(scoreBox.value, MARGIN + 4, y + 12);
      doc.setFontSize(9);
      doc.text(`Status: ${scoreBox.sub}`, PAGE_W - MARGIN - 4, y + 9, { align: 'right' });
      y += 18;

      // Weekly trend
      if (c.weeklyTrend && c.weeklyTrend.length > 0 && c.weeklyTrend.some((d) => d.count > 0)) {
        y = drawSection(doc, y, '📈  WEEKLY COLLECTION TREND');
        y = drawWeeklyTrend(doc, y, c.weeklyTrend);
      }
    }

    // ── COLLECTOR COMPARISON (multiple collectors) ────────────────────────────
    if (collectorStats && collectorStats.length > 1) {
      y = drawSection(doc, y, '👷  COLLECTOR PERFORMANCE COMPARISON');

      const compData = collectorStats.map((c) => ({
        name: c.name || c.mobile,
        collected: c.completed,
      }));

      y = drawMiniBarChart(doc, y, compData, 'name', 'collected', COLOR.primary);

      // Collector scores mini table
      autoTable(doc, {
        startY: y,
        head: [['Collector', 'Mobile', 'Assigned', 'Completed', 'Missed', 'Score', 'Status']],
        body: collectorStats.map((c) => [
          c.name || 'Unnamed',
          c.mobile,
          c.assignedBinCount,
          c.completed,
          c.missed,
          `${c.score}%`,
          c.scoreBand?.label || bandLabel(c.score),
        ]),
        theme: 'grid',
        headStyles: { fillColor: COLOR.primaryDark, textColor: COLOR.white, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: COLOR.text },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 28 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 22, halign: 'center', textColor: COLOR.primary, fontStyle: 'bold' },
          4: { cellWidth: 18, halign: 'center', textColor: COLOR.danger, fontStyle: 'bold' },
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 25 },
        },
        margin: { left: MARGIN, right: MARGIN },
        didDrawPage: () => {
          const pg = doc.getCurrentPageInfo().pageNumber;
          drawHeader(doc, reportTypeLabel || type, meta);
        },
        willDrawCell: (hookData) => {
          if (hookData.column.index === 5 && hookData.section === 'body') {
            const score = parseInt(hookData.cell.raw, 10);
            hookData.cell.styles.textColor = bandColor(score);
          }
          if (hookData.column.index === 6 && hookData.section === 'body') {
            const label = String(hookData.cell.raw);
            if (label === 'Excellent') hookData.cell.styles.textColor = COLOR.primary;
            else if (label === 'Good') hookData.cell.styles.textColor = [202, 138, 4];
            else if (label === 'Needs Improvement') hookData.cell.styles.textColor = COLOR.warning;
            else hookData.cell.styles.textColor = COLOR.danger;
          }
        },
      });

      y = doc.lastAutoTable.finalY + 5;
    }

    // ── AREA-WISE BREAKDOWN ───────────────────────────────────────────────────
    if (areaBreakdown && areaBreakdown.length > 0) {
      if (y > PAGE_H - 60) { doc.addPage(); y = drawHeader(doc, reportTypeLabel || type, meta) + 5; }
      y = drawSection(doc, y, '📍  AREA-WISE COLLECTION PERFORMANCE');

      autoTable(doc, {
        startY: y,
        head: [['Area / Location', 'Collections', 'Collectors Active']],
        body: areaBreakdown.map((a) => [a.area, a.count, a.collectorCount]),
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237], textColor: COLOR.white, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: COLOR.text },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: COLOR.primary },
          2: { cellWidth: 35, halign: 'center' },
        },
        margin: { left: MARGIN, right: MARGIN },
        didDrawPage: () => { drawHeader(doc, reportTypeLabel || type, meta); },
      });

      y = doc.lastAutoTable.finalY + 5;
    }

    // ── DETAILED COLLECTION LOG ───────────────────────────────────────────────
    if (collectionLog) {
      if (y > PAGE_H - 60) { doc.addPage(); y = drawHeader(doc, reportTypeLabel || type, meta) + 5; }
      y = drawSection(doc, y, `📋  DETAILED COLLECTION LOG  (${collectionLog.length} records)`);

      const tableBody = collectionLog.length > 0
        ? collectionLog.map((r) => [
            fmtDate(r.collectedAt),
            fmtTime(r.collectedAt),
            r.binId || '—',
            (r.location || '—').slice(0, 20),
            (r.area || r.location || '—').slice(0, 15),
            r.collectorName || '—',
            'Completed',
            `${r.duration || 8} min`,
          ])
        : [['—', '—', '—', '—', 'No collection activities recorded during this period', '—', '—', '—']];

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Time', 'Bin ID', 'Location', 'Area', 'Collector', 'Status', 'Duration']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: COLOR.secondary, textColor: COLOR.white, fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 6.5, textColor: COLOR.text },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 32 },
          4: { cellWidth: 26 },
          5: { cellWidth: 28 },
          6: { cellWidth: 18, halign: 'center', textColor: COLOR.primary, fontStyle: 'bold' },
          7: { cellWidth: 18, halign: 'center' },
        },
        margin: { left: MARGIN, right: MARGIN },
        showHead: 'everyPage',
        didDrawPage: () => { drawHeader(doc, reportTypeLabel || type, meta); },
      });

      y = doc.lastAutoTable.finalY + 5;
    }

    // ── PERFORMANCE INSIGHTS ──────────────────────────────────────────────────
    const insights = generateInsights(summary, collectorStats, collectionLog);
    if (insights.strengths.length > 0 || insights.attention.length > 0) {
      if (y > PAGE_H - 70) { doc.addPage(); y = drawHeader(doc, reportTypeLabel || type, meta) + 5; }
      y = drawSection(doc, y, '💡  PERFORMANCE INSIGHTS');

      if (insights.strengths.length > 0) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.primary);
        doc.text('✓  Strengths', MARGIN, y + 4);
        y += 7;
        insights.strengths.forEach((s) => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLOR.text);
          doc.text(`•  ${s}`, MARGIN + 3, y);
          y += 5.5;
        });
        y += 2;
      }

      if (insights.attention.length > 0) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR.warning);
        doc.text('⚠  Attention Required', MARGIN, y + 4);
        y += 7;
        insights.attention.forEach((s) => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLOR.text);
          doc.text(`•  ${s}`, MARGIN + 3, y);
          y += 5.5;
        });
      }
    }
  };

  // First pass — render content
  renderContent(1);

  // Second pass — add footers with correct page count
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  return doc;
}

// ─── Generate data-driven insights ───────────────────────────────────────────
function generateInsights(summary, collectorStats, collectionLog) {
  const strengths = [];
  const attention = [];

  if (!summary) return { strengths, attention };

  // Completion rate insights
  if (summary.completionRate >= 90) {
    strengths.push('High collection completion rate — most assigned bins are being collected on schedule.');
  } else if (summary.completionRate < 70) {
    attention.push(`Low collection completion rate (${summary.completionRate}%) — a significant number of bins are not being collected.`);
  }

  // Missed collections
  if (summary.totalMissed === 0) {
    strengths.push('Zero missed collections in the selected period — excellent route adherence.');
  } else if (summary.totalMissed > 5) {
    attention.push(`${summary.totalMissed} missed collections detected — review route assignments and collector availability.`);
  }

  // Score
  if (summary.avgScore >= 85) {
    strengths.push(`Average performance score of ${summary.avgScore}% — collectors are performing well overall.`);
  } else if (summary.avgScore < 70) {
    attention.push(`Average performance score of ${summary.avgScore}% is below target — consider additional training or route optimisation.`);
  }

  // Collector-specific
  if (collectorStats) {
    const poor = collectorStats.filter((c) => c.score < 60);
    if (poor.length > 0) {
      attention.push(`${poor.length} collector${poor.length > 1 ? 's' : ''} scored below 60% — ${poor.map((c) => c.name || c.mobile).join(', ')} require immediate attention.`);
    }

    const excellent = collectorStats.filter((c) => c.score >= 90);
    if (excellent.length > 0) {
      strengths.push(`${excellent.length} collector${excellent.length > 1 ? 's' : ''} achieved Excellent ratings (90%+): ${excellent.map((c) => c.name || c.mobile).join(', ')}.`);
    }
  }

  // Activity volume
  if (summary.totalCollections > 0) {
    strengths.push(`${summary.totalCollections} total collection activities recorded in the selected period.`);
  } else if (summary.totalCollections === 0) {
    attention.push('No collection activity found for the selected period and filters.');
  }

  return { strengths, attention };
}

// ─── Build filename ───────────────────────────────────────────────────────────
export function buildFilename(filters) {
  const { type, dateFrom, dateTo, collectorName, area } = filters;
  const parts = ['collector'];

  if (type === 'daily') { parts.push('daily_performance'); if (dateFrom) parts.push(dateFrom); }
  else if (type === 'weekly') {
    parts.push('weekly_performance');
    if (dateFrom) parts.push(dateFrom);
    if (dateTo) parts.push('to', dateTo);
  }
  else if (type === 'monthly') { parts.push('monthly_performance'); if (dateFrom) parts.push(dateFrom.slice(0, 7)); }
  else if (type === 'area_summary') {
    parts.push('area_summary');
    if (area && area !== 'all') parts.push(sanitizeFilename(area));
  }
  else if (type === 'activity_logs') {
    parts.push('activity_logs');
    if (dateFrom) parts.push(dateFrom);
    if (dateTo) parts.push('to', dateTo);
  }
  else if (type === 'individual') {
    if (collectorName) parts.push(sanitizeFilename(collectorName), 'performance');
    if (dateFrom) parts.push(dateFrom.slice(0, 7) || dateFrom);
  }
  else parts.push('report', new Date().toISOString().slice(0, 10));

  return parts.join('_') + '.pdf';
}
