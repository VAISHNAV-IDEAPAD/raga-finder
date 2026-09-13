import fs from 'fs';
import path from 'path';
import { AdminRule, MistakeReport } from '@/types/raga';
import seedRules from '@/data/seed_admin_rules.json';

const DATA_DIR = path.join(process.cwd(), 'data');
const RULES_FILE = path.join(DATA_DIR, 'admin_rules.json');
const REPORTS_FILE = path.join(DATA_DIR, 'mistake_reports.json');

// In-memory cache for fast access and fallback on serverless
let inMemoryRules: AdminRule[] = [...(seedRules as AdminRule[])];
let inMemoryReports: MistakeReport[] = [];
let initialized = false;

function ensureDataFiles() {
  if (initialized) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(RULES_FILE)) {
      fs.writeFileSync(RULES_FILE, JSON.stringify(seedRules, null, 2), 'utf-8');
    } else {
      const fileData = fs.readFileSync(RULES_FILE, 'utf-8');
      inMemoryRules = JSON.parse(fileData);
    }

    if (!fs.existsSync(REPORTS_FILE)) {
      fs.writeFileSync(REPORTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    } else {
      const fileData = fs.readFileSync(REPORTS_FILE, 'utf-8');
      inMemoryReports = JSON.parse(fileData);
    }
  } catch (err) {
    console.warn('Storage warning: could not access filesystem (might be serverless read-only), using in-memory store:', err);
  }
  initialized = true;
}

export async function getAdminRules(): Promise<AdminRule[]> {
  ensureDataFiles();
  try {
    if (fs.existsSync(RULES_FILE)) {
      const data = fs.readFileSync(RULES_FILE, 'utf-8');
      inMemoryRules = JSON.parse(data);
    }
  } catch {
    // Return in-memory fallback
  }
  return inMemoryRules;
}

export async function saveAdminRule(rule: AdminRule): Promise<AdminRule> {
  ensureDataFiles();
  const existingIdx = inMemoryRules.findIndex(r => r.id === rule.id);
  if (existingIdx >= 0) {
    inMemoryRules[existingIdx] = rule;
  } else {
    inMemoryRules.unshift(rule);
  }

  try {
    fs.writeFileSync(RULES_FILE, JSON.stringify(inMemoryRules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write admin_rules.json to disk:', err);
  }

  return rule;
}

export async function deleteAdminRule(id: string): Promise<boolean> {
  ensureDataFiles();
  inMemoryRules = inMemoryRules.filter(r => r.id !== id);
  try {
    fs.writeFileSync(RULES_FILE, JSON.stringify(inMemoryRules, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Could not delete admin rule from disk:', err);
    return true;
  }
}

export async function getMistakeReports(): Promise<MistakeReport[]> {
  ensureDataFiles();
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, 'utf-8');
      inMemoryReports = JSON.parse(data);
    }
  } catch {
    // Return in-memory fallback
  }
  return inMemoryReports;
}

export async function addMistakeReport(report: MistakeReport): Promise<MistakeReport> {
  ensureDataFiles();
  inMemoryReports.unshift(report);
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(inMemoryReports, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write mistake_reports.json to disk:', err);
  }
  return report;
}

export async function updateMistakeReportStatus(id: string, status: 'resolved' | 'dismissed', ruleId?: string): Promise<boolean> {
  ensureDataFiles();
  const item = inMemoryReports.find(r => r.id === id);
  if (!item) return false;
  item.status = status;
  if (ruleId) item.resolvedAsRuleId = ruleId;

  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(inMemoryReports, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not update mistake report on disk:', err);
  }
  return true;
}

export async function importRules(newRules: AdminRule[]): Promise<number> {
  ensureDataFiles();
  inMemoryRules = newRules;
  try {
    fs.writeFileSync(RULES_FILE, JSON.stringify(inMemoryRules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save imported rules to disk:', err);
  }
  return inMemoryRules.length;
}
