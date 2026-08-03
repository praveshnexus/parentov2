import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Baby, Stethoscope, Users, TrendingUp, Shield, Star, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { TopNav } from '@/components/layout';

const features = [
  { icon: Baby,        title: 'Child Growth Tracking',    desc: 'Monitor height, weight, milestones and vaccinations in one place.',     color: 'bg-blue-50 text-blue-500' },
  { icon: Stethoscope, title: 'Expert Consultations',     desc: 'Book sessions with verified pediatric specialists instantly.',           color: 'bg-green-50 text-green-500' },
  { icon: Users,       title: 'Parent Community',         desc: 'Connect, share experiences, and get support from other parents.',        color: 'bg-purple-50 text-purple-500' },
  { icon: Sparkles,    title: 'AI Health Assistant',      desc: 'Get personalized insights using your child\'s real health data.',        color: 'bg-primary-50 text-primary-500' },
  { icon: TrendingUp,  title: 'Growth Analytics',         desc: 'Visual charts and insights to understand development trajectory.',       color: 'bg-pink-50 text-pink-500' },
  { icon: Shield,      title: 'Safe & Secure',            desc: 'Your family\'s data is always private and protected.',                   color: 'bg-red-50 text-red-500' },
];

const testimonials = [
  { name: 'Priya Sharma',  role: 'Mother of 2',     text: 'Parento completely changed how I track my children\'s development. The milestone tracker is incredible!', avatar: '👩🏽' },
  { name: 'Dr. Rahul M.',  role: 'Pediatrician',    text: 'As a doctor, managing appointments and communicating with parents on Parento is seamless.',               avatar: '👨🏽‍⚕️' },
  { name: 'Anjali Nair',   role: 'First-time mom',  text: 'The community support I found on Parento was invaluable during those first sleepless months.',            avatar: '👩🏻' },
];

const stats = [
  { value: '50K+',  label: 'Parents' },
  { value: '2K+',   label: 'Doctors' },
  { value: '4.9★',  label: 'App Rating' },
  { value: '98%',   label: 'Satisfaction' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <main className="pt-16">

        {/* ── Hero ──────────────────────────────────── */}
        <section className="relative overflow-hidden bg-primary-500 pt-16 pb-24 px-5 text-center">
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-pill mb-6">
              <Heart size={14} className="fill-white" />
              Trusted by 50,000+ parents
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Your trusted companion<br />in parenting
            </h1>
            <p className="text-primary-100 text-base md:text-lg mb-8 max-w-lg mx-auto">
              Track growth, consult expert doctors, join a supportive community, and get AI-powered health insights — all in one app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold px-8 py-3.5 rounded-pill shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-sm">
                Get started free
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-pill hover:bg-white/10 active:scale-95 transition-all duration-200 text-sm">
                Sign in
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="relative grid grid-cols-4 gap-3 max-w-lg mx-auto mt-12">
            {stats.map(({ value, label }) => (
              <div key={label} className="bg-white/15 rounded-2xl py-3 px-2 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-[11px] text-primary-100 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ──────────────────────────────── */}
        <section className="py-16 px-5 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Everything you need</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ink-primary mt-2">Built for modern parents</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-5 rounded-card border border-gray-100 hover:shadow-card transition-shadow">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3.5 ${f.color}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-ink-primary mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── App preview banner ─────────────────────── */}
        <section className="bg-surface-bg py-14 px-5">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary-500 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4" />
              <Sparkles size={36} className="text-white mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Meet Parento AI</h2>
              <p className="text-primary-100 mb-6 max-w-md mx-auto">
                The only parenting AI that reads your child's actual growth records, milestone history, and vaccination data to give personalized advice.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-7 py-3 rounded-pill hover:shadow-lg active:scale-95 transition-all">
                Try Parento AI
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────── */}
        <section className="py-16 px-5 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ink-primary mt-2">Loved by families</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-card shadow-card p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-ink-secondary italic leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="font-semibold text-sm text-ink-primary">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────── */}
        <section className="py-16 px-5 text-center bg-surface-bg">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Baby size={40} className="text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-ink-primary mb-2">Start your parenting journey</h2>
            <p className="text-ink-secondary mb-6 max-w-sm mx-auto">Join thousands of parents already using Parento. Free forever for parents.</p>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-primary-500 text-white font-bold px-8 py-3.5 rounded-pill shadow-md hover:bg-primary-600 hover:shadow-lg active:scale-95 transition-all">
              Create free account
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-ink-muted mt-3">No credit card required</p>
          </motion.div>
        </section>

        {/* ── Footer ─────────────────────────────────── */}
        <footer className="border-t border-gray-100 py-8 px-5">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
                <Baby size={16} className="text-white" />
              </div>
              <span className="font-bold text-ink-primary">Parento</span>
            </div>
            <p className="text-xs text-ink-muted">© {new Date().getFullYear()} Parento. Made with ❤️ for parents everywhere.</p>
            <div className="flex gap-5 text-xs text-ink-secondary">
              <a href="#" className="hover:text-ink-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-ink-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-ink-primary transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
