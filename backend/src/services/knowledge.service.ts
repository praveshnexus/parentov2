/**
 * Parento knowledge base.
 *
 * Loads the curated datasets in src/data/knowledge and provides:
 *  - keyword retrieval over the parenting FAQ
 *  - WHO weight/height comparison for a child's latest measurement
 *  - IAP vaccine schedule and CDC milestone lookups by age
 *  - urgent-symptom detection
 *  - a fully offline answer generator, used when no Anthropic API key is
 *    configured or the API is unreachable
 *  - a compact reference block that is added to the Claude system prompt
 */
import faqData from '../data/knowledge/parenting-faq.json';
import vaccineData from '../data/knowledge/vaccination-schedule.json';
import milestoneData from '../data/knowledge/milestones.json';
import whoGrowth from '../data/knowledge/who-growth-standards.json';

// ── Types ──────────────────────────────────────────────────────
export interface FaqEntry {
  id: string;
  topic: string;
  keywords: string[];
  answer: string;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  urgent?: boolean;
}

export interface ChildSnapshot {
  name: string;
  dateOfBirth: Date;
  ageMonths: number;
  gender: string; // MALE | FEMALE | OTHER
  allergies: string[];
  growth: {
    weight: number | null;
    height: number | null;
    headCirc: number | null;
    bmi: number | null;
    recordedAt: Date;
  }[]; // newest first
  vaccines: { name: string; scheduledDate: Date; administeredAt: Date | null }[];
  milestones: { title: string; category: string; ageMonth: number; achieved: boolean }[];
}

export type GrowthIndicator = 'weight' | 'lengthHeight' | 'headCircumference' | 'bmi';

export interface GrowthAssessment {
  indicator: GrowthIndicator;
  value: number;
  ageDays: number;
  zScore: number;
  percentile: number;
  median: number;
  p3: number;
  p97: number;
  status: 'below' | 'within' | 'above';
}

type ScheduleEntry = { ageLabel: string; ageWeeks: number | null; vaccines: string[]; notes?: string; catchUpOnly?: boolean };
type MilestoneBand = {
  ageMonth: number;
  screening?: string;
  tips: string[];
  physical: string[];
  social: string[];
  language: string[];
  cognitive: string[];
};

const FAQ: FaqEntry[] = faqData.entries as FaqEntry[];
const SCHEDULE: ScheduleEntry[] = vaccineData.schedule as ScheduleEntry[];
const MILESTONE_BANDS: MilestoneBand[] = milestoneData.ages as MilestoneBand[];

// ── Small helpers ──────────────────────────────────────────────
function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9.\s'-]/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

function containsTerm(normalized: string, term: string): boolean {
  return normalized.includes(` ${term.toLowerCase()}`);
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole months between two dates (accounts for day of month). */
export function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(0, months);
}

export function formatAge(ageMonths: number): string {
  if (ageMonths < 1) return 'under 1 month';
  if (ageMonths < 24) return `${ageMonths} month${ageMonths === 1 ? '' : 's'}`;
  const y = Math.floor(ageMonths / 12);
  const m = ageMonths % 12;
  return `${y} year${y === 1 ? '' : 's'}${m ? ` ${m} month${m === 1 ? '' : 's'}` : ''}`;
}

// ── Urgent symptom detection ───────────────────────────────────
const URGENT_TERMS = [
  'not breathing', "can't breathe", 'cant breathe', 'cannot breathe', 'trouble breathing',
  'difficulty breathing', 'struggling to breathe', 'blue lips', 'turning blue', 'choking',
  'seizure', 'convulsion', 'fitting', 'unconscious', 'unresponsive', 'not waking', 'swallowed',
  'poison', 'button battery', 'severe bleeding', 'stiff neck', 'fell from', 'hit his head',
  'hit her head', 'hit head', 'lips swelling', 'swollen lips', 'face swelling', 'anaphylaxis',
];

export function detectUrgent(text: string): boolean {
  const t = normalize(text);
  return URGENT_TERMS.some((term) => t.includes(term));
}

export const URGENT_NOTICE =
  "🚨 **If your child is having trouble breathing, is unresponsive, has a seizure, or may have swallowed something harmful, call emergency services (112 in India) or go to the nearest hospital now.** Don't wait for an online answer.";

// ── FAQ retrieval ──────────────────────────────────────────────
export function searchFaq(query: string, ageMonths?: number, limit = 3): FaqEntry[] {
  const q = normalize(query);
  return FAQ.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (containsTerm(q, kw)) score += kw.includes(' ') ? 3 : 2;
    }
    for (const word of entry.topic.toLowerCase().split(/\s+/)) {
      if (word.length > 3 && containsTerm(q, word)) score += 1;
    }
    if (score > 0 && ageMonths !== undefined) {
      const tooYoung = entry.minAgeMonths !== undefined && ageMonths < entry.minAgeMonths;
      const tooOld = entry.maxAgeMonths !== undefined && ageMonths > entry.maxAgeMonths;
      if (tooYoung || tooOld) score = 0; // e.g. newborn-only advice for a toddler
    }
    if (score > 0 && entry.urgent) score += 0.5;
    return { entry, score };
  })
    .filter((s) => s.score >= 1.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

// ── WHO Child Growth Standards (0-1856 days) ───────────────────
// Official LMS parameters by day of age (see who-growth-standards.json).
type Lms = [number, number, number];
const WHO = whoGrowth.indicators as Record<GrowthIndicator, Record<'MALE' | 'FEMALE', Lms[]>>;
export const WHO_MAX_AGE_DAYS = WHO.weight.MALE.length - 1; // 1856

const DAY_MS = 24 * 60 * 60 * 1000;
export function ageInDays(dob: Date, at: Date): number {
  return Math.floor((Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) -
    Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate())) / DAY_MS);
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7). */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t *
    Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

function lmsValue([l, m, s]: Lms, z: number): number {
  return l === 0 ? m * Math.exp(s * z) : m * Math.pow(1 + l * s * z, 1 / l);
}

/** WHO z-score, including the restricted-tail adjustment WHO applies to weight and BMI beyond ±3 SD. */
function lmsZ(lms: Lms, x: number, restricted: boolean): number {
  const [l, m, s] = lms;
  let z = l === 0 ? Math.log(x / m) / s : (Math.pow(x / m, l) - 1) / (l * s);
  if (restricted && Math.abs(z) > 3) {
    const sd3 = lmsValue(lms, z > 0 ? 3 : -3);
    const sd2 = lmsValue(lms, z > 0 ? 2 : -2);
    const sd23 = Math.abs(sd3 - sd2);
    z = z > 0 ? 3 + (x - sd3) / sd23 : -3 + (x - sd3) / sd23;
  }
  return z;
}

export function assessGrowth(
  indicator: GrowthIndicator,
  gender: string,
  ageDays: number,
  value: number,
): GrowthAssessment | null {
  if (gender !== 'MALE' && gender !== 'FEMALE') return null;
  if (ageDays < 0 || ageDays > WHO_MAX_AGE_DAYS || !(value > 0)) return null;
  const lms = WHO[indicator][gender][ageDays];
  const z = lmsZ(lms, value, indicator === 'weight' || indicator === 'bmi');
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    indicator,
    value,
    ageDays,
    zScore: Math.round(z * 100) / 100,
    percentile: r1(normCdf(z) * 100),
    median: r1(lms[1]),
    p3: r1(lmsValue(lms, -1.880794)),  // z for 3rd percentile
    p97: r1(lmsValue(lms, 1.880794)),  // z for 97th percentile
    status: z < -2 ? 'below' : z > 2 ? 'above' : 'within',
  };
}

const INDICATOR_LABEL: Record<GrowthIndicator, [string, string]> = {
  weight: ['Weight-for-age', 'kg'],
  lengthHeight: ['Length/height-for-age', 'cm'],
  headCircumference: ['Head circumference-for-age', 'cm'],
  bmi: ['BMI-for-age', 'kg/m²'],
};

function ordinal(n: number): string {
  const r = Math.round(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = r % 100;
  return `${r}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function describeAssessment(a: GrowthAssessment): string {
  const [label, unit] = INDICATOR_LABEL[a.indicator];
  const pct = a.percentile < 1 ? '<1st' : a.percentile > 99 ? '>99th' : ordinal(a.percentile);
  const base = `${label}: ${a.value} ${unit} → **${pct} percentile** (z = ${a.zScore > 0 ? '+' : ''}${a.zScore}; WHO median ${a.median} ${unit}, 3rd-97th percentile ${a.p3}-${a.p97} ${unit})`;
  if (a.status === 'within') return `${base}. Within the normal range.`;
  return `${base}. **${a.status === 'below' ? 'Below -2 SD' : 'Above +2 SD'}** — worth discussing with your pediatrician.`;
}

/** WHO assessment of the latest growth record (age in days at the time it was measured). */
export function assessLatestGrowth(child: ChildSnapshot): GrowthAssessment[] {
  const latest = child.growth[0];
  if (!latest) return [];
  const days = ageInDays(child.dateOfBirth, latest.recordedAt);
  const bmi = latest.bmi ?? (latest.weight && latest.height ? latest.weight / Math.pow(latest.height / 100, 2) : null);
  const items: [GrowthIndicator, number | null][] = [
    ['weight', latest.weight],
    ['lengthHeight', latest.height],
    ['headCircumference', latest.headCirc],
    ['bmi', bmi ? Math.round(bmi * 10) / 10 : null],
  ];
  return items
    .map(([ind, v]) => (v ? assessGrowth(ind, child.gender, days, v) : null))
    .filter((a): a is GrowthAssessment => a !== null);
}

export function growthSummaryLines(child: ChildSnapshot): string[] {
  return assessLatestGrowth(child).map(describeAssessment);
}

// ── Vaccine schedule (IAP) ─────────────────────────────────────
export function scheduleAroundAge(ageMonths: number) {
  const ageWeeks = ageMonths * 4.345;
  const timed = SCHEDULE.filter(
    (s): s is ScheduleEntry & { ageWeeks: number } => s.ageWeeks !== null && !s.catchUpOnly,
  );
  return {
    next: timed.filter((s) => s.ageWeeks > ageWeeks).slice(0, 2),
    afterCare: vaccineData.afterCare,
  };
}

// ── Milestones (CDC) ───────────────────────────────────────────
export function milestoneBands(ageMonths: number): { current?: MilestoneBand; next?: MilestoneBand } {
  const current = [...MILESTONE_BANDS].reverse().find((b) => b.ageMonth <= ageMonths);
  const next = MILESTONE_BANDS.find((b) => b.ageMonth > ageMonths);
  return { current, next };
}

function bandBullets(band: MilestoneBand): string[] {
  return (['physical', 'social', 'language', 'cognitive'] as const)
    .filter((c) => band[c]?.length)
    .map((c) => `**${c[0].toUpperCase()}${c.slice(1)}:** ${band[c].slice(0, 2).join('; ')}`);
}

// ── Intent detection ───────────────────────────────────────────
type Intent = 'vaccine' | 'milestone' | 'growth';

function detectIntents(query: string): Intent[] {
  const q = normalize(query);
  const intents: Intent[] = [];
  if (/vaccin|immuni[sz]|\bshots?\b|\bjabs?\b|injection|booster|\bbcg\b|\bmmr\b|\bdtp\b|polio/.test(q)) intents.push('vaccine');
  if (/milestone|develop|crawl|walk|\btalk|speech|\bwords?\b|\bsit|\broll|motor|cognitive|language|focus on/.test(q)) intents.push('milestone');
  if (/weight|height|growth|\bgrow|\bbmi\b|\btall|\bshort\b|underweight|overweight|on track/.test(q)) intents.push('growth');
  return intents;
}

// ── Reference block for the Claude system prompt ───────────────
export function buildKnowledgeContext(query: string, child: ChildSnapshot): string {
  const parts: string[] = [];

  const growth = growthSummaryLines(child);
  if (growth.length) {
    parts.push(`### WHO Child Growth Standards assessment (latest record)\n${growth.map((l) => `- ${l}`).join('\n')}\n_Computed from official WHO LMS tables. Growth is judged by the trend over time, not one measurement._`);
  }

  const { next: nextVaccines } = scheduleAroundAge(child.ageMonths);
  if (nextVaccines.length) {
    parts.push(
      `### Next in the standard IAP schedule\n${nextVaccines.map((s) => `- ${s.ageLabel}: ${s.vaccines.join(', ')}`).join('\n')}\n_${vaccineData.disclaimer}_`,
    );
  }

  const { current, next } = milestoneBands(child.ageMonths);
  const mLines: string[] = [];
  if (current) mLines.push(`- By ${current.ageMonth} months most children: ${bandBullets(current).join(' | ')}`);
  if (next) mLines.push(`- By ${next.ageMonth} months most children: ${bandBullets(next).join(' | ')}`);
  if (mLines.length) parts.push(`### CDC milestone reference\n${mLines.join('\n')}`);

  const faq = searchFaq(query, child.ageMonths, 3);
  if (faq.length) {
    parts.push(`### Relevant knowledge base entries\n${faq.map((f) => `#### ${f.topic}\n${f.answer}`).join('\n\n')}`);
  }

  return parts.join('\n\n');
}

// ── Offline answer generator ───────────────────────────────────
export function generateLocalAnswer(query: string, child: ChildSnapshot): string {
  const sections: string[] = [];
  const { name } = child;
  const lower = query.toLowerCase();
  const urgent = detectUrgent(query);
  const intents = detectIntents(query);
  const now = new Date();

  if (urgent) sections.push(URGENT_NOTICE);

  if (intents.includes('vaccine')) {
    const overdue = child.vaccines.filter((v) => !v.administeredAt && v.scheduledDate < now);
    const upcoming = child.vaccines.filter((v) => !v.administeredAt && v.scheduledDate >= now).slice(0, 3);
    const given = child.vaccines.filter((v) => v.administeredAt).length;
    const lines = [`## ${name}'s vaccinations`, `- **${given}** vaccine(s) recorded as given in Parento.`];
    if (overdue.length) {
      lines.push(`- ⚠️ **Overdue:** ${overdue.map((v) => `${v.name} (due ${shortDate(v.scheduledDate)})`).join(', ')}.`);
      lines.push("- A missed dose usually doesn't need restarting. Your pediatrician can give a catch-up plan, so it's worth booking a visit soon. If these were already given, mark them as done in **Track**.");
    } else {
      lines.push("- ✅ No overdue vaccines in Parento's records.");
    }
    if (upcoming.length) {
      lines.push(`- **Next in ${name}'s records:** ${upcoming.map((v) => `${v.name} (${shortDate(v.scheduledDate)})`).join(', ')}.`);
    }
    const { next, afterCare } = scheduleAroundAge(child.ageMonths);
    if (next.length) {
      lines.push(`- **Next in the IAP 2023 schedule:** ${next.map((s) => `${s.ageLabel}: ${s.vaccines.join(', ')}`).join('; ')}.`);
      const note = next.find((s) => s.notes)?.notes;
      if (note) lines.push(`- _IAP note:_ ${note}`);
    }
    if (/after|side effect|watch/.test(lower)) {
      lines.push('', '### After a vaccine', ...afterCare.map((a) => `- ${a}`));
    }
    sections.push(lines.join('\n'));
  }

  if (intents.includes('growth')) {
    const lines = [`## ${name}'s growth`];
    const latest = child.growth[0];
    if (!latest) {
      lines.push('- No growth records yet. Add weight and height in **Track** so they can be compared with WHO standards.');
    } else {
      const measured = [latest.weight && `${latest.weight} kg`, latest.height && `${latest.height} cm`].filter(Boolean).join(', ');
      lines.push(`- Latest record: ${measured} on ${shortDate(latest.recordedAt)}.`);
      const cmp = growthSummaryLines(child);
      if (cmp.length) lines.push(...cmp.map((l) => `- ${l}`));
      else lines.push("- WHO Child Growth Standards cover birth to 5 years. For older children, ask your doctor to plot the record on a WHO 5-19 years growth reference chart.");
      const prev = child.growth[1];
      if (prev && latest.weight && prev.weight) {
        const diff = Math.round((latest.weight - prev.weight) * 10) / 10;
        lines.push(`- Change since the previous record (${shortDate(prev.recordedAt)}): ${diff >= 0 ? '+' : ''}${diff} kg.`);
      }
      const monthsOld = monthsBetween(latest.recordedAt, now);
      if (monthsOld >= 3) lines.push(`- This measurement is ${monthsOld} months old, so a fresh one would give a more accurate picture.`);
      lines.push('- Growth is judged by the trend over time, not a single number.');
    }
    sections.push(lines.join('\n'));
  }

  if (intents.includes('milestone')) {
    const lines = [`## ${name}'s development (${formatAge(child.ageMonths)})`];
    const tracked = child.milestones;
    if (tracked.length) {
      lines.push(`- Tracked milestones achieved: **${tracked.filter((m) => m.achieved).length}/${tracked.length}**.`);
      const notYet = tracked.filter((m) => !m.achieved && m.ageMonth <= child.ageMonths);
      if (notYet.length) {
        lines.push(`- Not yet marked as achieved: ${notYet.slice(0, 5).map((m) => `"${m.title}" (~${m.ageMonth}m)`).join(', ')}. If ${name} already does these, tick them off in **Track**; if not, mention them at the next check-up.`);
      }
    }
    const { current, next } = milestoneBands(child.ageMonths);
    const band = next ?? current;
    if (band) {
      lines.push('', `### ${next ? 'What most children do by' : 'Typical skills by'} ${band.ageMonth} months (CDC)`, ...bandBullets(band).map((b) => `- ${b}`));
      if (band.screening) lines.push(`- 🩺 ${band.screening}`);
      if (band.tips?.length) lines.push('', '### Ways to help (CDC tips)', ...band.tips.slice(0, 2).map((t) => `- ${t}`));
    }
    sections.push(lines.join('\n'));
  }

  // FAQ entries for whatever else the question touches on
  const faqLimit = intents.length ? 1 : 2;
  // Skip FAQ entries that only repeat what the personalised sections above already said.
  const covered = new Set<string>([
    ...(intents.includes('vaccine') ? ['vaccine-side-effects', 'missed-vaccine'] : []),
    ...(intents.includes('growth') ? ['growth-concern'] : []),
  ]);
  const faq = searchFaq(query, child.ageMonths, faqLimit + covered.size)
    .filter((f) => !covered.has(f.id))
    .slice(0, faqLimit);
  for (const f of faq) sections.push(`## ${f.topic}\n${f.answer}`);

  if (child.allergies.length && /food|eat|solid|allerg|snack|meal|peanut|egg/.test(lower)) {
    sections.push(`⚠️ Remember: ${name} has a recorded allergy to **${child.allergies.join(', ')}**.`);
  }

  const hasContent = sections.length > (urgent ? 1 : 0);
  if (!hasContent) {
    const topics = FAQ.slice(0, 10).map((f) => f.topic.toLowerCase()).join(', ');
    sections.push(
      `I couldn't find a specific answer to that in Parento's knowledge base. I can help with ${name}'s **vaccines, growth and milestones**, and topics such as ${topics}.\n\nTry rephrasing, or use **Consult** to ask a pediatrician directly.`,
    );
  }

  sections.push('_General information, not a diagnosis. Please consult your pediatrician for medical decisions._');
  return sections.join('\n\n');
}

export const knowledgeStats = {
  faqEntries: FAQ.length,
  vaccineScheduleEntries: SCHEDULE.length,
  milestoneAgeBands: MILESTONE_BANDS.length,
};
