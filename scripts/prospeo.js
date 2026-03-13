/**
 * prospeo.js — Prospeo API wrapper
 *
 * Usage (Claude calls this directly):
 *   node scripts/prospeo.js --filters path/to/filters.json [--page 1] [--all]
 *
 * Outputs JSON to stdout.
 * Saves full results to output/[campaign]/prospeo-raw.json
 */

import 'dotenv/config';
import axios from 'axios';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const API_BASE = 'https://api.prospeo.io';
const API_KEY = process.env.PROSPEO_API_KEY;

if (!API_KEY) {
  console.error('ERROR: PROSPEO_API_KEY not set in .env');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-KEY': API_KEY,
};

/**
 * Search for leads using Prospeo's Search Person API.
 * @param {object} filters - Full Prospeo filter object
 * @param {number} page - Page number (1-indexed, 25 results per page)
 * @returns {object} { results, pagination, total_count }
 */
export async function searchLeads(filters, page = 1) {
  const response = await axios.post(
    `${API_BASE}/search-person`,
    { filters, page },
    { headers }
  );

  if (response.data.error) {
    throw new Error(`Prospeo error: ${response.data.error_code}`);
  }

  return {
    results: response.data.results,
    pagination: response.data.pagination,
    total_count: response.data.pagination?.total_count ?? 0,
  };
}

/**
 * Get top N leads across multiple pages.
 * @param {object} filters
 * @param {number} limit - How many leads to fetch (default 100)
 * @returns {Array} leads
 */
export async function fetchLeads(filters, limit = 100) {
  const leads = [];
  let page = 1;
  const perPage = 25;
  const maxPages = Math.ceil(limit / perPage);

  while (page <= maxPages) {
    const { results, pagination } = await searchLeads(filters, page);
    leads.push(...results);

    if (page >= pagination.total_page) break;
    page++;

    // Respect rate limits
    if (page <= maxPages) await sleep(500);
  }

  return leads.slice(0, limit);
}

/**
 * Get account info (credits remaining etc.)
 */
export async function getAccountInfo() {
  const response = await axios.post(`${API_BASE}/account`, {}, { headers });
  return response.data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (process.argv[1].endsWith('prospeo.js')) {
  const args = process.argv.slice(2);
  const filtersFlag = args.indexOf('--filters');
  const pageFlag = args.indexOf('--page');
  const campaignFlag = args.indexOf('--campaign');
  const infoFlag = args.includes('--info');

  if (infoFlag) {
    const info = await getAccountInfo();
    console.log(JSON.stringify(info, null, 2));
    process.exit(0);
  }

  if (filtersFlag === -1) {
    console.error('Usage: node scripts/prospeo.js --filters <filters.json> [--campaign <name>] [--page <n>]');
    process.exit(1);
  }

  const filtersPath = resolve(args[filtersFlag + 1]);
  const filters = JSON.parse(readFileSync(filtersPath, 'utf8'));
  const page = pageFlag !== -1 ? parseInt(args[pageFlag + 1]) : 1;
  const campaignName = campaignFlag !== -1 ? args[campaignFlag + 1] : 'default';

  console.error(`[prospeo] Searching leads (page ${page})...`);
  const { results, pagination, total_count } = await searchLeads(filters, page);

  console.error(`[prospeo] Found ${total_count} total leads, page ${pagination.current_page}/${pagination.total_page}`);

  // Save to output folder
  const outDir = resolve(`output/${campaignName}`);
  mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/prospeo-page${page}.json`;
  writeFileSync(outPath, JSON.stringify({ pagination, results }, null, 2));
  console.error(`[prospeo] Saved to ${outPath}`);

  // Output results to stdout for Claude to read
  console.log(JSON.stringify({ total_count, pagination, results }, null, 2));
}
