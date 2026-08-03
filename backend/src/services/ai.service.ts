import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { config } from '../config/env';

// ── Date helpers ──────────────────────────────────────────────
function differenceInMonths(a: Date, b: Date): number {
  return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function isPast(d: Date): boolean {
  return d < new Date();
}

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Build rich child context from DB ──────────────────────────
async function buildChildContext(childId: string, parentId: string): Promise<string> {
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

  const ageMonths = differenceInMonths(new Date(), new Date(child.dateOfBirth));
  const ageLabel = ageMonths < 24
    ? `${ageMonths} months`
    : `${Math.floor(ageMonths / 12)} years ${ageMonths % 12} months`;

  // Latest growth
  const latestGrowth = child.growthRecords[0];
  const previousGrowth = child.growthRecords[1];
  const growthTrend = latestGrowth && previousGrowth
    ? `Weight trend: ${previousGrowth.weight ?? 'N/A'}kg → ${latestGrowth.weight ?? 'N/A'}kg. Height trend: ${previousGrowth.height ?? 'N/A'}cm → ${latestGrowth.height ?? 'N/A'}cm.`
    : '';

  // Milestone analysis
  const totalMilestones = child.milestones.length;
  const achieved = child.milestones.filter((m) => m.achieved).length;
  const overdueMilestones = child.milestones.filter(
    (m) => !m.achieved && m.ageMonth <= ageMonths
  );
  const upcomingMilestones = child.milestones.filter(
    (m) => !m.achieved && m.ageMonth > ageMonths && m.ageMonth <= ageMonths + 3
  );

  // Vaccination analysis
  const now = new Date();
  const overdueVaccines = child.vaccinations.filter(
    (v) => !v.administeredAt && isPast(new Date(v.scheduledDate))
  );
  const upcomingVaccines = child.vaccinations.filter(
    (v) => !v.administeredAt && !isPast(new Date(v.scheduledDate))
  );
  const completedVaccines = child.vaccinations.filter((v) => v.administeredAt);

  // Format growth history for context
  const growthHistory = child.growthRecords.slice(0, 5).map((r) => {
    const parts = [];
    if (r.weight) parts.push(`${r.weight}kg`);
    if (r.height) parts.push(`${r.height}cm`);
    if (r.bmi) parts.push(`BMI ${r.bmi.toFixed(1)}`);
    return `${fmtDate(new Date(r.recordedAt))}: ${parts.join(', ')}`;
  }).join('\n');

  // Format overdue milestones
  const overdueList = overdueMilestones.slice(0, 5).map(
    (m) => `- "${m.title}" (expected ~${m.ageMonth}m, category: ${m.category})`
  ).join('\n');

  // Format upcoming milestones
  const upcomingList = upcomingMilestones.slice(0, 5).map(
    (m) => `- "${m.title}" (expected ~${m.ageMonth}m, category: ${m.category})`
  ).join('\n');

  // Format vaccines
  const overdueVaccineList = overdueVaccines.map(
    (v) => `- ${v.name} (was due ${fmtDate(new Date(v.scheduledDate))})`
  ).join('\n');

  const upcomingVaccineList = upcomingVaccines.slice(0, 3).map(
    (v) => `- ${v.name} (due ${fmtDate(new Date(v.scheduledDate))})`
  ).join('\n');

  // Active medications
  const medicationList = child.medications.map(
    (m) => `- ${m.name}: ${m.dosage}, ${m.frequency}`
  ).join('\n');

  return `
## Child Profile: ${child.name}
- Age: ${ageLabel} (born ${fmtDate(new Date(child.dateOfBirth))})
- Gender: ${child.gender.toLowerCase()}
- Blood type: ${child.bloodType ?? 'not recorded'}
- Known allergies: ${child.allergies.length > 0 ? child.allergies.join(', ') : 'none recorded'}

## Growth Data (most recent first)
${growthHistory || 'No growth records yet.'}
${latestGrowth?.bmi ? `\nCurrent BMI: ${latestGrowth.bmi.toFixed(1)} (${bmiInterpretation(latestGrowth.bmi, ageMonths)})` : ''}
${growthTrend}

## Developmental Milestones
- Overall progress: ${achieved}/${totalMilestones} milestones achieved (${totalMilestones > 0 ? Math.round((achieved / totalMilestones) * 100) : 0}%)
${overdueMilestones.length > 0 ? `\n### ⚠️ Overdue milestones (${overdueMilestones.length} not yet achieved but expected by now):\n${overdueList}` : '\n✅ No overdue milestones'}
${upcomingMilestones.length > 0 ? `\n### Coming up in next 3 months:\n${upcomingList}` : ''}

## Vaccination Status
- Completed: ${completedVaccines.length} vaccines
${overdueVaccines.length > 0 ? `\n### ⚠️ Overdue vaccines:\n${overdueVaccineList}` : '✅ No overdue vaccines'}
${upcomingVaccines.length > 0 ? `\n### Upcoming:\n${upcomingVaccineList}` : ''}

## Active Medications
${medicationList || 'None'}
`.trim();
}

function bmiInterpretation(bmi: number, ageMonths: number): string {
  // Simplified pediatric BMI categories
  if (bmi < 14) return 'underweight range — consider consulting a doctor';
  if (bmi < 18) return 'healthy range';
  if (bmi < 20) return 'overweight range — monitor';
  return 'obese range — consult a doctor';
}

// ── System prompt ──────────────────────────────────────────────
function buildSystemPrompt(childContext: string): string {
  return `You are Parento AI, a warm, knowledgeable, and empathetic child health assistant. You have been given real-time data about a specific child from their parent's Parento account.

Your role:
- Answer parenting and child health questions with accuracy and compassion
- Reference the child's ACTUAL data (growth records, milestones, vaccinations) when relevant
- Flag genuine concerns clearly but without causing unnecessary panic
- Always recommend consulting a real doctor for medical decisions
- Be conversational and supportive — parents are often anxious and need reassurance
- Keep responses focused and scannable (use bullet points for lists, bold for key points)
- Never make diagnoses. Always frame as "this may suggest..." or "a doctor can evaluate..."

IMPORTANT: You have access to this child's real health data. Use it to give personalized, specific answers — not generic advice.

${childContext}

---

Guidelines:
- If the parent asks about something unrelated to child health, politely redirect
- If a concern sounds urgent (high fever, breathing issues, severe symptoms), always say "seek medical attention immediately"
- Cite specific data points from the child's records when giving advice (e.g., "Based on Aanya's last growth record showing 8.2kg...")
- For overdue milestones or vaccinations, acknowledge them proactively if the topic comes up
- End responses with a brief, warm closing line when appropriate`;
}

// ── Stream AI response ─────────────────────────────────────────
export async function streamAIResponse(
  childId: string,
  parentId: string,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  const childContext = await buildChildContext(childId, parentId);
  const systemPrompt = buildSystemPrompt(childContext);

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text);
    }
  }

  onDone();
}

// ── Non-streaming for simple queries ──────────────────────────
export async function getAIResponse(
  childId: string,
  parentId: string,
  messages: ChatMessage[]
): Promise<string> {
  const childContext = await buildChildContext(childId, parentId);
  const systemPrompt = buildSystemPrompt(childContext);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('');
}

// ── Get child summary for display ─────────────────────────────
export async function getChildSummary(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      growthRecords: { orderBy: { recordedAt: 'desc' }, take: 1 },
      vaccinations: true,
      milestones: true,
    },
  });

  if (!child || child.parentId !== parentId) throw new ForbiddenError();

  const ageMonths = differenceInMonths(new Date(), new Date(child.dateOfBirth));
  const overdueVaccines = child.vaccinations.filter(
    (v) => !v.administeredAt && isPast(new Date(v.scheduledDate))
  ).length;
  const overdueMilestones = child.milestones.filter(
    (m) => !m.achieved && m.ageMonth <= ageMonths
  ).length;
  const achievedMilestones = child.milestones.filter((m) => m.achieved).length;

  return {
    id: child.id,
    name: child.name,
    ageMonths,
    gender: child.gender,
    latestWeight: child.growthRecords[0]?.weight ?? null,
    latestHeight: child.growthRecords[0]?.height ?? null,
    overdueVaccines,
    overdueMilestones,
    achievedMilestones,
    totalMilestones: child.milestones.length,
  };
}
