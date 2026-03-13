/**
 * verify.js — Score top 25 leads against the ICP by fetching their company websites.
 *
 * Claude uses this after getting leads from Prospeo.
 * This script fetches each company's website and returns structured data
 * for Claude to score. The actual scoring is done by Claude (not this script).
 *
 * Usage:
 *   node scripts/verify.js --leads path/to/prospeo-page1.json --icp path/to/icp.json --campaign <name>
 *
 * Outputs: output/<campaign>/company-profiles.json (raw data for Claude to score)
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch a company website and extract key signals.
 * @param {string} url - Company website URL
 * @returns {object} { url, title, description, bodyText, techSignals }
 */
export async function fetchCompanyProfile(url) {
  if (!url || !url.startsWith('http')) {
    url = `https://${url}`;
  }

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 3,
    });

    const $ = cheerio.load(response.data);

    // Remove noise
    $('script, style, nav, footer, header').remove();

    const title = $('title').text().trim();
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Get main body text (first 2000 chars)
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);

    // Tech stack signals from page source
    const html = response.data.toLowerCase();
    const techSignals = detectTechSignals(html);

    return { url, title, description, bodyText, techSignals, error: null };
  } catch (err) {
    return { url, title: null, description: null, bodyText: null, techSignals: [], error: err.message };
  }
}

/**
 * Look for common tech/business signals in page HTML.
 */
function detectTechSignals(html) {
  const signals = {
    crm: ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
    analytics: ['google-analytics', 'mixpanel', 'segment', 'amplitude'],
    ads: ['adwords', 'facebook-pixel', 'linkedin insight'],
    chat: ['intercom', 'drift', 'zendesk', 'freshdesk'],
    ecommerce: ['shopify', 'woocommerce', 'magento'],
    saas: ['stripe', 'recurly', 'chargebee'],
    hiring: ['greenhouse', 'lever', 'workday', 'ashbyhq'],
  };

  const found = [];
  for (const [category, keywords] of Object.entries(signals)) {
    for (const kw of keywords) {
      if (html.includes(kw)) {
        found.push({ category, keyword: kw });
        break;
      }
    }
  }
  return found;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (process.argv[1].endsWith('verify.js')) {
  const args = process.argv.slice(2);
  const leadsFlag = args.indexOf('--leads');
  const icpFlag = args.indexOf('--icp');
  const campaignFlag = args.indexOf('--campaign');

  if (leadsFlag === -1) {
    console.error('Usage: node scripts/verify.js --leads <file> --icp <file> --campaign <name>');
    process.exit(1);
  }

  const leadsData = JSON.parse(readFileSync(resolve(args[leadsFlag + 1]), 'utf8'));
  const icp = icpFlag !== -1 ? JSON.parse(readFileSync(resolve(args[icpFlag + 1]), 'utf8')) : null;
  const campaignName = campaignFlag !== -1 ? args[campaignFlag + 1] : 'default';

  const leads = leadsData.results || leadsData;
  const top25 = leads.slice(0, 25);

  console.error(`[verify] Fetching profiles for ${top25.length} leads...`);

  const profiles = [];
  for (let i = 0; i < top25.length; i++) {
    const lead = top25[i];
    const companyUrl = lead.company?.website || lead.company?.websites?.[0] || null;
    const domain = companyUrl || (lead.company?.name ? null : null);

    console.error(`[verify] ${i + 1}/${top25.length} — ${lead.company?.name || 'unknown'} (${domain || 'no URL'})`);

    const profile = domain ? await fetchCompanyProfile(domain) : { url: null, error: 'no website' };

    profiles.push({
      lead: {
        first_name: lead.person?.first_name,
        last_name: lead.person?.last_name,
        job_title: lead.person?.job_title,
        seniority: lead.person?.seniority,
        department: lead.person?.department,
        linkedin_url: lead.person?.linkedin_url,
        company_name: lead.company?.name,
        company_website: companyUrl,
        company_headcount: lead.company?.headcount,
        company_industry: lead.company?.industry,
        company_location: lead.company?.location,
      },
      company_profile: profile,
    });

    if (i < top25.length - 1) await sleep(300);
  }

  const outDir = resolve(`output/${campaignName}`);
  mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/company-profiles.json`;
  writeFileSync(outPath, JSON.stringify({ icp, profiles }, null, 2));
  console.error(`[verify] Saved profiles to ${outPath}`);

  console.log(JSON.stringify({ icp, profiles }, null, 2));
}
