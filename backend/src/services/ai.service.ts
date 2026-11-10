import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import {
  ChildSnapshot,
  buildKnowledgeContext,
  detectUrgent,
  formatAge,
  generateLocalAnswer,
  growthSummaryLines,
  monthsBetween,
  URGENT_NOTICE,
} from './knowledge.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AiSource = 'claude' | 'knowledge-base';

// ── Provider selection ─────────────────────────────────────────
// Real Anthropic keys start with "sk-ant-" and are far longer than 40 chars.
// Anything else (missing, placeholder, truncated) uses the offline knowledge base.
function hasUsableApiKey(): boolean {
  const key = config.ANTHROPIC_API_KEY?.trim();
  return !!key && key.startsWith('sk-ant-') && key.length > 40;
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!hasUsableApiKey()) return null;
  if (!client) client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return client;
}

export function getAiStatus() {
  const usable = hasUsableApiKey();
  return {
    mode: (usable ? 'claude' : 'knowledge-base') as AiSource,
    model: usable ? config.ANTHROPIC_MODEL : null,
  };
}

// ── Load child (with ownership check) ──────────────────────────
// Exported so the controller can return a proper 404/403 *before* opening the stream.
export async function loadChildForChat(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      growthRecords: { orderBy: { recordedAt: 'desc' }, take: 10 },
      vaccinations: { orderBy: { scheduledDate: 'asc' } },
      milestones: { orderBy: { ageMonth: 'asc' } },
      medications: { where: { isActive: true } },
    },
  });
  if (!child) throw new NotFoundError('Child');
  if (child.parentId !== parentId) throw new ForbiddenError();
  return child;
}

export type LoadedChild = Awaited<ReturnType<typeof loadChildForChat>>;

function toSnapshot(child: LoadedChild): ChildSnapshot {
  return {
    name: child.name,
    dateOfBirth: new Date(child.dateOfBirth),
    ageMonths: monthsBetween(new Date(child.dateOfBirth), new Date()),
    gender: child.gender,
    allergies: child.allergies,
    growth: child.growthRecords.map((g) => ({
      weight: g.weight,
      height: g.height,
      headCirc: g.headCirc,
      bmi: g.bmi,
      recordedAt: new Date(g.recordedAt),
    })),
    vaccines: child.vaccinations.map((v) => ({
      name: v.name,
      scheduledDate: new Date(v.scheduledDate),
      administeredAt: v.administeredAt ? new Date(v.administeredAt) : null,
    })),
    milestones: child.milestones.map((m) => ({ title: m.title, category: m.category, ageMonth: m.ageMonth, achieved: m.achieved })),
  };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Child context for the system prompt ────────────────────────
function buildChildContext(child: LoadedChild, snap: ChildSnapshot): string {
  const ageMonths = snap.ageMonths;
  const now = new Date();

  const growthHistory = child.growthRecords.slice(0, 5).map((r) => {
    const parts: string[] = [];
    if (r.weight) parts.push(`${r.weight}kg`);
    if (r.height) parts.push(`${r.height}cm`);
    if (r.bmi) parts.push(`BMI ${r.bmi.toFixed(1)}`);
    return `${fmtDate(new Date(r.recordedAt))}: ${parts.join(', ')}`;
  }).join('\n');

  const latest = child.growthRecords[0];
  const previous = child.growthRecords[1];
  const growthTrend = latest && previous
    ? `Weight trend: ${previous.weight ?? 'N/A'}kg → ${latest.weight ?? 'N/A'}kg. Height trend: ${previous.height ?? 'N/A'}cm → ${latest.height ?? 'N/A'}cm.`
    : '';
  const whoLines = growthSummaryLines(snap);

  const total = child.milestones.length;
  const achieved = child.milestones.filter((m) => m.achieved).length;
  const overdueMilestones = child.milestones.filter((m) => !m.achieved && m.ageMonth <= ageMonths);
  const upcomingMilestones = child.milestones.filter((m) => !m.achieved && m.ageMonth > ageMonths && m.ageMonth <= ageMonths + 3);
  const fmtM = (m: { title: string; ageMonth: number; category: string }) => `- "${m.title}" (expected ~${m.ageMonth}m, category: ${m.category})`;

  const overdueVaccines = child.vaccinations.filter((v) => !v.administeredAt && new Date(v.scheduledDate) < now);
  const upcomingVaccines = child.vaccinations.filter((v) => !v.administeredAt && new Date(v.scheduledDate) >= now);
  const completedVaccines = child.vaccinations.filter((v) => v.administeredAt);

  const medicationList = child.medications.map((m) => `- ${m.name}: ${m.dosage}, ${m.frequency}`).join('\n');

  return `
## Child Profile: ${child.name}
- Age: ${formatAge(ageMonths)} (born ${fmtDate(new Date(child.dateOfBirth))})
- Gender: ${child.gender.toLowerCase()}
- Blood type: ${child.bloodType || 'not recorded'}
- Known allergies: ${child.allergies.length > 0 ? child.allergies.join(', ') : 'none recorded'}

## Growth Data (most recent first)
${growthHistory || 'No growth records yet.'}
${growthTrend}
${whoLines.length ? `WHO Child Growth Standards assessment of latest record:\n${whoLines.map((l) => `- ${l}`).join('\n')}` : ''}

## Developmental Milestones
- Overall progress: ${achieved}/${total} milestones achieved (${total > 0 ? Math.round((achieved / total) * 100) : 0}%)
${overdueMilestones.length > 0 ? `\n### Not yet marked achieved but expected by now (${overdueMilestones.length}):\n${overdueMilestones.slice(0, 5).map(fmtM).join('\n')}` : '\nNo overdue milestones'}
${upcomingMilestones.length > 0 ? `\n### Coming up in next 3 months:\n${upcomingMilestones.slice(0, 5).map(fmtM).join('\n')}` : ''}

## Vaccination Status
- Completed: ${completedVaccines.length} vaccines
${overdueVaccines.length > 0 ? `\n### Overdue vaccines:\n${overdueVaccines.map((v) => `- ${v.name} (was due ${fmtDate(new Date(v.scheduledDate))})`).join('\n')}` : 'No overdue vaccines'}
${upcomingVaccines.length > 0 ? `\n### Upcoming:\n${upcomingVaccines.slice(0, 3).map((v) => `- ${v.name} (due ${fmtDate(new Date(v.scheduledDate))})`).join('\n')}` : ''}

## Active Medications
${medicationList || 'None'}
`.trim();
}

// ── System prompt ──────────────────────────────────────────────
function buildSystemPrompt(childContext: string, knowledge: string): string {
  return `You are Parento AI, a warm, knowledgeable, and empathetic child health assistant. You have been given real-time data about a specific child from their parent's Parento account, plus reference material from Parento's curated knowledge base.

Your role:
- Answer parenting and child health questions with accuracy and compassion
- Reference the child's ACTUAL data (growth records, milestones, vaccinations) when relevant
- Prefer the reference material below over general recall when they cover the question
- Flag genuine concerns clearly but without causing unnecessary panic
- Always recommend consulting a real doctor for medical decisions
- Keep responses focused and scannable (use bullet points for lists, bold for key points)
- Never make diagnoses. Frame as "this may suggest..." or "a doctor can evaluate..."
- Never give medicine doses; refer dosing questions to the child's doctor or pharmacist

${childContext}

---

# Parento knowledge base (reference)
${knowledge || 'No specific entries matched this question.'}

---

Guidelines:
- If the parent asks about something unrelated to child health or parenting, politely redirect
- If a concern sounds urgent (breathing trouble, seizure, unresponsiveness, poisoning, fever in a baby under 3 months), start by telling them to seek medical attention immediately (emergency number 112 in India)
- Cite specific data points from the child's records when giving advice
- Milestones "not yet marked achieved" may simply not have been ticked in the app; suggest updating Track rather than assuming a delay
- For overdue milestones or vaccinations, acknowledge them proactively if the topic comes up`;
}

// ── Helpers ────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Streams a locally generated answer in small pieces so the UI behaves the same as with Claude. */
async function streamText(text: string, onChunk: (c: string) => void, signal?: AbortSignal, delayMs = 12) {
  const pieces = text.match(/\S+\s*|\s+/g) ?? [text];
  for (let i = 0; i < pieces.length; i += 3) {
    if (signal?.aborted) return;
    onChunk(pieces.slice(i, i + 3).join(''));
    if (delayMs > 0) await sleep(delayMs);
  }
}

function isFallbackWorthy(err: unknown): boolean {
  if (err instanceof Anthropic.APIUserAbortError) return false;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return true;
  if (err instanceof Anthropic.APIConnectionError) return true;
  if (err instanceof Anthropic.NotFoundError) return true; // e.g. unknown model name
  if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) return true;
  if (err instanceof Anthropic.APIError && (err.status === 529 || (err.status ?? 0) >= 500)) return true;
  return false;
}

// ── Stream AI response ─────────────────────────────────────────
export async function streamAIResponse(
  child: LoadedChild,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<{ fullText: string; source: AiSource }> {
  const snap = toSnapshot(child);
  const question = messages[messages.length - 1].content;

  let fullText = '';
  const emit = (c: string) => {
    fullText += c;
    onChunk(c);
  };

  const runLocal = async (notice?: string) => {
    const answer = generateLocalAnswer(question, snap);
    await streamText(notice ? `${notice}\n\n${answer}` : answer, emit, signal);
    return { fullText, source: 'knowledge-base' as AiSource };
  };

  const anthropic = getClient();
  if (!anthropic) return runLocal();

  const system = buildSystemPrompt(buildChildContext(child, snap), buildKnowledgeContext(question, snap));

  try {
    const stream = anthropic.messages.stream(
      {
        model: config.ANTHROPIC_MODEL,
        max_tokens: 1024,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        emit(event.delta.text);
      }
    }
    return { fullText, source: 'claude' };
  } catch (err) {
    if (signal?.aborted) return { fullText, source: 'claude' };
    // Only fall back if nothing has been streamed yet, otherwise the reply would be mixed.
    if (fullText.length === 0 && isFallbackWorthy(err)) {
      logger.warn(`AI provider unavailable, using knowledge base: ${(err as Error).message}`);
      const urgent = detectUrgent(question);
      return runLocal(urgent ? undefined : '_Claude is unavailable right now, so this answer comes from Parento\'s built-in knowledge base._');
    }
    throw err;
  }
}

// Kept for any future non-streaming callers.
export async function getAIResponse(childId: string, parentId: string, messages: ChatMessage[]): Promise<string> {
  const child = await loadChildForChat(childId, parentId);
  const { fullText } = await streamAIResponse(child, messages, () => {});
  return fullText;
}

export { URGENT_NOTICE };

// ── Child summary for the chat sidebar ─────────────────────────
export async function getChildSummary(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      growthRecords: { orderBy: { recordedAt: 'desc' }, take: 1 },
      vaccinations: true,
      milestones: true,
    },
  });

  if (!child) throw new NotFoundError('Child');
  if (child.parentId !== parentId) throw new ForbiddenError();

  const now = new Date();
  const ageMonths = monthsBetween(new Date(child.dateOfBirth), now);
  return {
    id: child.id,
    name: child.name,
    ageMonths,
    gender: child.gender,
    latestWeight: child.growthRecords[0]?.weight ?? null,
    latestHeight: child.growthRecords[0]?.height ?? null,
    overdueVaccines: child.vaccinations.filter((v) => !v.administeredAt && new Date(v.scheduledDate) < now).length,
    overdueMilestones: child.milestones.filter((m) => !m.achieved && m.ageMonth <= ageMonths).length,
    achievedMilestones: child.milestones.filter((m) => m.achieved).length,
    totalMilestones: child.milestones.length,
  };
}
