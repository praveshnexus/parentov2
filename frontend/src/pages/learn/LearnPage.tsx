import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Play, Lightbulb, ChevronRight,
  Baby, Heart, Brain, Shield, Utensils, Moon, Sparkles,
  Clock, Star, ArrowRight, CheckCircle, Hash
} from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui';
import clsx from 'clsx';

const CATEGORIES = [
  { id: 'nutrition',   label: 'Feeding & Nutrition', icon: Utensils, color: 'bg-orange-50 text-orange-500' },
  { id: 'sleep',       label: 'Sleep Patterns',      icon: Moon,     color: 'bg-indigo-50 text-indigo-500' },
  { id: 'development', label: 'Development',         icon: Brain,    color: 'bg-purple-50 text-purple-500' },
  { id: 'health',      label: 'Health & Safety',     icon: Shield,   color: 'bg-red-50 text-red-500' },
  { id: 'newborn',     label: 'Newborn Care',        icon: Baby,     color: 'bg-pink-50 text-pink-500' },
  { id: 'parenting',   label: 'Parenting Tips',      icon: Heart,    color: 'bg-green-50 text-green-500' },
];

const GUIDES = [
  {
    id: '1',
    title: 'Newborn Care (0–3 months)',
    badge: 'Essential',
    badgeVariant: 'primary' as const,
    sections: [
      { title: 'Feeding & Nutrition', items: ['Breastfeeding basics', 'Bottle feeding guidelines', 'Feeding schedule', 'Common feeding issues'] },
      { title: 'Sleep Patterns',      items: ['Creating sleep routines', 'Safe sleep practices', 'Managing night wakings'] },
      { title: 'Daily Care',          items: ['Diaper changing', 'Bathing tips', 'Umbilical cord care', 'Skin care'] },
    ],
  },
  {
    id: '2',
    title: 'Development Milestones',
    badge: 'Important',
    badgeVariant: 'warning' as const,
    sections: [
      { title: 'Motor Skills (0–6m)',  items: ['Head control', 'Tummy time progress', 'Grasping reflex'] },
      { title: 'Social Skills (0–6m)', items: ['First smiles', 'Eye contact', 'Response to voice'] },
      { title: 'Cognitive (6–12m)',    items: ['Object permanence', 'Cause and effect', 'Simple problem solving'] },
    ],
  },
  {
    id: '3',
    title: 'Health & Safety',
    badge: 'Must Read',
    badgeVariant: 'danger' as const,
    sections: [
      { title: 'Vaccination',   items: ['Recommended schedule', 'Important vaccines', 'Side effects to watch'] },
      { title: 'Baby Proofing', items: ['Home safety measures', 'Choking hazards', 'Safe sleeping environment'] },
      { title: 'Emergency',     items: ['When to call the doctor', 'First aid basics', 'Fever management'] },
    ],
  },
];

const TOYS = [
  { name: 'Building Blocks (0–3y)', desc: 'Develops spatial awareness and motor skills', icon: '🧱', age: '0–3y' },
  { name: 'Sensory Toys (6m–2y)',   desc: 'Enhances tactile learning and exploration',  icon: '🧸', age: '6m–2y' },
  { name: 'Puzzles (2–5y)',         desc: 'Builds problem-solving and patience',         icon: '🧩', age: '2–5y' },
  { name: 'Art Supplies (3–6y)',    desc: 'Encourages creativity and fine motor skills', icon: '🎨', age: '3–6y' },
];

const ACTIVITIES = [
  { name: 'Memory Games',  age: 'Age: 2–4 years', color: 'bg-blue-50',  icon: '🎯' },
  { name: 'Pattern Play',  age: 'Age: 3–5 years', color: 'bg-green-50', icon: '🔶' },
  { name: 'Story Time',    age: 'Age: 1–6 years', color: 'bg-amber-50', icon: '📖' },
  { name: 'Music & Dance', age: 'Age: 0–6 years', color: 'bg-pink-50',  icon: '🎵' },
];

const TIPS = [
  { title: 'Daily Routines',       desc: 'Establishing healthy habits and schedules', icon: Clock },
  { title: 'Communication Skills', desc: 'Effective ways to talk with your child',    icon: Heart },
  { title: 'Positive Discipline',  desc: 'Guide behaviour with love and boundaries',  icon: Star },
  { title: 'Screen Time Balance',  desc: 'Managing technology in your child\'s life', icon: Shield },
];

// ── Guide accordion ────────────────────────────────────────────
function GuideDetail({ guide }: { guide: typeof GUIDES[0] }) {
  const [expanded, setExpanded] = useState<string | null>(guide.sections[0]?.title ?? null);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 mb-4">
        <Badge variant={guide.badgeVariant}>{guide.badge}</Badge>
        <h2 className="font-bold text-ink-primary">{guide.title}</h2>
      </div>
      {guide.sections.map(section => (
        <div key={section.title} className="rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === section.title ? null : section.title)}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors">
            <p className="font-semibold text-sm text-ink-primary">{section.title}</p>
            <ChevronRight size={15} className={clsx('text-ink-muted transition-transform duration-200', expanded === section.title && 'rotate-90')} />
          </button>
          <AnimatePresence>
            {expanded === section.title && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 space-y-2.5 border-t border-gray-100">
                  {section.items.map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle size={13} className="text-primary-400 flex-shrink-0" />
                      <p className="text-sm text-ink-secondary">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ── Right sidebar ──────────────────────────────────────────────
function LearnSidebar({ activeGuideId, onSelectGuide }: { activeGuideId: string; onSelectGuide: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <SectionHeader title="All Guides" />
        <div className="space-y-2 mt-1">
          {GUIDES.map(g => (
            <button key={g.id} onClick={() => onSelectGuide(g.id)}
              className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border-2',
                activeGuideId === g.id ? 'border-primary-400 bg-primary-50' : 'border-transparent hover:bg-gray-50')}>
              <BookOpen size={14} className={activeGuideId === g.id ? 'text-primary-500' : 'text-ink-muted'} />
              <div className="flex-1 min-w-0">
                <p className={clsx('text-xs font-semibold truncate', activeGuideId === g.id ? 'text-primary-700' : 'text-ink-primary')}>{g.title}</p>
                <Badge variant={g.badgeVariant} className="text-[10px] mt-0.5">{g.badge}</Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionHeader title="Quick topics" />
        <div className="flex flex-wrap gap-2 mt-2">
          {['Breastfeeding', 'Sleep Training', 'Vaccination', 'Milestones', 'Baby Food', 'Postpartum'].map(t => (
            <span key={t} className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-pill">
              <Hash size={10} />{t}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary-500 to-teal-500 text-white">
        <Sparkles size={18} className="mb-2 text-white/80" />
        <p className="font-bold text-sm mb-1">Ask Parento AI</p>
        <p className="text-xs text-white/80 mb-3">Get personalised learning content based on your child's age</p>
        <Link to="/ai" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-pill transition-colors">
          Try AI <ArrowRight size={12} />
        </Link>
      </Card>
    </div>
  );
}

// ── Learning Resources tab ─────────────────────────────────────
function ResourcesTab() {
  return (
    <div className="space-y-7">
      {/* Browse by category */}
      <div>
        <SectionHeader title="Browse by Category" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
            <motion.div key={id} whileHover={{ y: -2 }}>
              <Card className="p-4 cursor-pointer hover:shadow-card-hover transition-all">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-2.5', color)}>
                  <Icon size={20} />
                </div>
                <p className="font-semibold text-sm text-ink-primary">{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Educational Toys */}
      <div>
        <SectionHeader title="Educational Toys" />
        <div className="space-y-3">
          {TOYS.map(toy => (
            <Card key={toy.name} className="p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{toy.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-ink-primary">{toy.name}</p>
                  <Badge variant="gray" className="text-[10px]">{toy.age}</Badge>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{toy.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Educational videos */}
      <div>
        <SectionHeader title="Educational videos" />
        <Card className="overflow-hidden hover:shadow-card-hover transition-shadow cursor-pointer">
          <div className="relative bg-gradient-to-br from-primary-400 to-teal-500 h-44 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative w-12 h-12 rounded-full bg-white/25 flex items-center justify-center">
              <Play size={22} className="text-white ml-0.5" />
            </div>
            <div className="absolute bottom-3 left-0 right-0 px-4">
              <p className="text-white font-semibold text-sm text-center">Know About Development Delay</p>
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-ink-primary">Educational videos</p>
            <p className="text-xs text-ink-muted mt-0.5">Expert-curated videos on developmental milestones</p>
          </div>
        </Card>
      </div>

      {/* Interactive Activities */}
      <div>
        <SectionHeader title="Interactive Activities" />
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITIES.map(act => (
            <Card key={act.name} className={clsx('p-4 cursor-pointer hover:shadow-card-hover transition-shadow', act.color)}>
              <span className="text-2xl mb-2 block">{act.icon}</span>
              <p className="font-semibold text-sm text-ink-primary">{act.name}</p>
              <p className="text-xs text-ink-muted mt-0.5">{act.age}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Parenting Tips */}
      <div>
        <SectionHeader title="Parenting Tips" />
        <div className="space-y-2">
          {TIPS.map(({ title, desc, icon: Icon }) => (
            <Card key={title} className="p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink-primary border-l-4 border-primary-400 pl-3">{title}</p>
                <p className="text-xs text-ink-muted mt-0.5 pl-3">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-ink-muted flex-shrink-0" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Parenting Guide tab ────────────────────────────────────────
function GuideTab({ activeGuideId, setActiveGuideId }: { activeGuideId: string; setActiveGuideId: (id: string) => void }) {
  const activeGuide = GUIDES.find(g => g.id === activeGuideId) ?? GUIDES[0];
  return (
    <div>
      {/* Mobile guide chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden">
        {GUIDES.map(g => (
          <button key={g.id} onClick={() => setActiveGuideId(g.id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all',
              activeGuideId === g.id ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-ink-secondary hover:border-primary-300')}>
            {g.title}
          </button>
        ))}
      </div>
      <Card className="p-5">
        <AnimatePresence mode="wait">
          <motion.div key={activeGuideId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <GuideDetail guide={activeGuide} />
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}

// ── Main Learn Page ────────────────────────────────────────────
export default function LearnPage() {
  const [activeTab, setActiveTab]         = useState<'resources' | 'guide'>('resources');
  const [activeGuideId, setActiveGuideId] = useState('1');

  return (
    <div className="max-w-app mx-auto">
      {/* Page header — sticky, matches refreshed design */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 md:top-16 z-20">
        <div className="max-w-app mx-auto flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-400 flex items-center justify-center text-xs">🎓</div>
          <div>
            <h1 className="text-[15px] font-bold text-ink-primary">Learning Resources</h1>
            <p className="text-xs text-primary-500 font-medium">Know your Child Better</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Tab toggle */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { id: 'resources' as const, label: 'Learning Resources', icon: BookOpen },
            { id: 'guide'     as const, label: 'Parenting Guide',    icon: Lightbulb },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={clsx('flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-semibold transition-all',
                activeTab === id ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-ink-secondary hover:border-primary-300')}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Desktop 2-col */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
          <div>
            <AnimatePresence mode="wait">
              {activeTab === 'resources' ? (
                <motion.div key="resources" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ResourcesTab />
                </motion.div>
              ) : (
                <motion.div key="guide" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GuideTab activeGuideId={activeGuideId} setActiveGuideId={setActiveGuideId} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-36">
              <LearnSidebar activeGuideId={activeGuideId}
                onSelectGuide={id => { setActiveGuideId(id); setActiveTab('guide'); }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
