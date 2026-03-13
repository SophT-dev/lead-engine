/**
 * export.js — Generate CSV and sales snapshot HTML after user approves the list.
 *
 * ONLY called after explicit user approval. Never auto-export.
 *
 * Usage:
 *   node scripts/export.js --campaign <name> --scores path/to/scores.json
 *
 * Outputs:
 *   output/<campaign>/leads-export.csv       ← import into Clay/Trykitt
 *   output/<campaign>/sales-snapshot.html    ← send to client
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Convert scored leads to CSV for Clay/Trykitt import.
 * Columns match Clay's standard import format.
 */
function toCSV(leads) {
  const headers = [
    'first_name', 'last_name', 'job_title', 'seniority', 'department',
    'linkedin_url', 'company_name', 'company_website', 'company_industry',
    'company_headcount', 'company_location', 'icp_score', 'score_reasoning',
  ];

  const rows = leads.map((item) => {
    const l = item.lead;
    return [
      l.first_name || '',
      l.last_name || '',
      l.job_title || '',
      l.seniority || '',
      l.department || '',
      l.linkedin_url || '',
      l.company_name || '',
      l.company_website || '',
      l.company_industry || '',
      l.company_headcount || '',
      l.company_location || '',
      item.score ?? '',
      (item.reasoning || '').replace(/,/g, ';'),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate a clean HTML sales snapshot to send to clients.
 */
function toSalesHTML(campaign, icp, leads, screenshot) {
  const avgScore = leads.length
    ? (leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length).toFixed(1)
    : 'N/A';

  const leadRows = leads
    .slice(0, 10)
    .map(
      (item) => `
      <tr>
        <td>${item.lead.first_name} ${item.lead.last_name}</td>
        <td>${item.lead.job_title || '—'}</td>
        <td>${item.lead.company_name || '—'}</td>
        <td>${item.lead.company_industry || '—'}</td>
        <td>${item.lead.company_headcount || '—'}</td>
        <td class="score">${item.score ?? '—'}/10</td>
      </tr>`
    )
    .join('');

  const screenshotHTML = screenshot
    ? `<div class="screenshot"><img src="${screenshot}" alt="Prospeo Results" /></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>ICP Lead List — ${campaign.client_name}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 28px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat { background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-value { font-size: 28px; font-weight: 700; color: #b91c1c; }
  .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
  .icp-summary { background: #fff7f7; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 28px; }
  .icp-summary h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #b91c1c; margin: 0 0 12px; }
  .icp-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { background: #fee2e2; border-radius: 4px; padding: 4px 10px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px; }
  th { background: #1a1a1a; color: #fff; padding: 10px 12px; text-align: left; }
  td { padding: 9px 12px; border-bottom: 1px solid #e5e5e5; }
  tr:hover td { background: #fef2f2; }
  .score { font-weight: 700; color: #b91c1c; }
  .screenshot { margin-top: 20px; }
  .screenshot img { width: 100%; border-radius: 8px; border: 1px solid #e5e5e5; }
  .footer { font-size: 12px; color: #999; margin-top: 32px; text-align: center; }
</style>
</head>
<body>
  <h1>Lead List — ${campaign.client_name}</h1>
  <div class="subtitle">Built ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Powered by Lead Engine</div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${campaign.total_leads?.toLocaleString() || leads.length}</div><div class="stat-label">Total Leads Found</div></div>
    <div class="stat"><div class="stat-value">${avgScore}</div><div class="stat-label">ICP Match Score</div></div>
    <div class="stat"><div class="stat-value">${icp?.job_titles?.length || '—'}</div><div class="stat-label">Target Titles</div></div>
    <div class="stat"><div class="stat-value">${icp?.industries?.length || '—'}</div><div class="stat-label">Target Industries</div></div>
  </div>

  <div class="icp-summary">
    <h2>Ideal Customer Profile</h2>
    <div class="icp-tags">
      ${(icp?.job_titles || []).slice(0, 6).map((t) => `<span class="tag">${t.title || t}</span>`).join('')}
      ${(icp?.industries || []).slice(0, 4).map((i) => `<span class="tag">${i.name || i}</span>`).join('')}
      ${icp?.company_size ? `<span class="tag">${icp.company_size.min_employees}–${icp.company_size.max_employees} employees</span>` : ''}
      ${(icp?.locations || []).map((l) => `<span class="tag">${l}</span>`).join('')}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Name</th><th>Title</th><th>Company</th><th>Industry</th><th>Size</th><th>Score</th></tr>
    </thead>
    <tbody>${leadRows}</tbody>
  </table>

  ${screenshotHTML}

  <div class="footer">This list was built and verified by Lead Engine · ${new Date().toISOString().split('T')[0]}</div>
</body>
</html>`;
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (process.argv[1].endsWith('export.js')) {
  const args = process.argv.slice(2);
  const campaignFlag = args.indexOf('--campaign');
  const scoresFlag = args.indexOf('--scores');

  if (campaignFlag === -1 || scoresFlag === -1) {
    console.error('Usage: node scripts/export.js --campaign <name> --scores <scores.json>');
    process.exit(1);
  }

  const campaignName = args[campaignFlag + 1];
  const outDir = resolve(`output/${campaignName}`);
  mkdirSync(outDir, { recursive: true });

  const scoresData = JSON.parse(readFileSync(resolve(args[scoresFlag + 1]), 'utf8'));
  const { campaign = {}, icp = {}, scored_leads = [], screenshot_path = null } = scoresData;

  // Write CSV
  const csvPath = `${outDir}/leads-export.csv`;
  writeFileSync(csvPath, toCSV(scored_leads));
  console.error(`[export] CSV saved → ${csvPath}`);

  // Write sales HTML
  const screenshotData = screenshot_path
    ? `data:image/png;base64,${readFileSync(resolve(screenshot_path)).toString('base64')}`
    : null;

  const htmlPath = `${outDir}/sales-snapshot.html`;
  writeFileSync(htmlPath, toSalesHTML(campaign, icp, scored_leads, screenshotData));
  console.error(`[export] Sales snapshot saved → ${htmlPath}`);

  console.log(JSON.stringify({ csv: csvPath, html: htmlPath }, null, 2));
}
