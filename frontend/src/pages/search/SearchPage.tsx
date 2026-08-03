import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Stethoscope, Users, FileText, Hash, Sparkles, Baby } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postsApi, doctorsApi, userApi } from '@/api/services';
import { Avatar, Card, Badge, Skeleton, EmptyState, StarRating, SectionHeader } from '@/components/ui';
import clsx from 'clsx';

type Tab = 'all' | 'doctors' | 'posts' | 'people';

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

const TRENDING_TAGS  = ['#newborn', '#breastfeeding', '#toddlerlife', '#vaccination', '#babysleep', '#milestones', '#solidfood', '#postpartum', '#pregnancy', '#parenting'];
const POPULAR_SEARCH = ['Pediatrician', 'Child Psychologist', 'Nutritionist', 'Sleep tips', 'Baby food', 'Vaccination schedule'];

// ── Left sidebar ───────────────────────────────────────────────
function SearchSidebar({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-primary-500" />
          <p className="font-semibold text-sm text-ink-primary">Trending</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map(tag => (
            <button key={tag} onClick={() => onSearch(tag)}
              className="px-3 py-1.5 rounded-pill bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors">
              {tag}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search size={15} className="text-primary-500" />
          <p className="font-semibold text-sm text-ink-primary">Popular searches</p>
        </div>
        <div className="space-y-1">
          {POPULAR_SEARCH.map(s => (
            <button key={s} onClick={() => onSearch(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-gray-100 transition-colors group">
              <Hash size={13} className="text-ink-muted group-hover:text-primary-400 flex-shrink-0" />
              <span className="text-sm text-ink-secondary group-hover:text-ink-primary">{s}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary-500 to-teal-500 text-white">
        <Baby size={24} className="mb-2 text-white/80" />
        <p className="font-bold text-sm mb-1">Parento AI</p>
        <p className="text-xs text-white/80 mb-3">Get personalised answers about your child's health</p>
        <Link to="/ai" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-pill transition-colors">
          <Sparkles size={13} /> Try AI
        </Link>
      </Card>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query, 380);
  const enabled = debounced.trim().length > 1;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const postsQ   = useQuery({ queryKey: ['search', 'posts',   debounced], queryFn: () => postsApi.search(debounced),            enabled: enabled && (tab === 'all' || tab === 'posts'),   staleTime: 30_000 });
  const doctorsQ = useQuery({ queryKey: ['search', 'doctors', debounced], queryFn: () => doctorsApi.list({ search: debounced }), enabled: enabled && (tab === 'all' || tab === 'doctors'), staleTime: 30_000 });
  const usersQ   = useQuery({ queryKey: ['search', 'users',   debounced], queryFn: () => userApi.search(debounced),             enabled: enabled && (tab === 'all' || tab === 'people'),  staleTime: 30_000 });

  const posts   = postsQ.data?.data?.data   ?? [];
  const doctors = doctorsQ.data?.data?.data ?? [];
  const users   = usersQ.data?.data?.data   ?? [];
  const isLoading = postsQ.isFetching || doctorsQ.isFetching || usersQ.isFetching;
  const hasAny = posts.length > 0 || doctors.length > 0 || users.length > 0;

  const tabs: Array<{ id: Tab; label: string; icon: any; count: number }> = [
    { id: 'all',     label: 'All',     icon: Search,      count: posts.length + doctors.length + users.length },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, count: doctors.length },
    { id: 'posts',   label: 'Posts',   icon: FileText,    count: posts.length },
    { id: 'people',  label: 'People',  icon: Users,       count: users.length },
  ];

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-primary">Search</h1>
        <p className="text-sm text-ink-muted">Find doctors, posts, and people</p>
      </div>

      {/* Search input — full width */}
      <div className="relative mb-5 max-w-2xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search doctors, posts, people..."
          className="w-full bg-white border-2 border-gray-200 rounded-pill pl-11 pr-11 py-3.5 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-card transition-all"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-ink-muted transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tab chips — shown when searching */}
      {enabled && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all',
                tab === id ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-ink-secondary hover:border-primary-300'
              )}>
              <Icon size={12} />{label}
              {count > 0 && (
                <span className={clsx('px-1.5 py-0.5 rounded-full text-[10px] font-bold', tab === id ? 'bg-white/20' : 'bg-gray-100')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop: 2-col | Mobile: 1-col ── */}
      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-6">
        {/* Results */}
        <div>
          <AnimatePresence mode="wait">
            {!debounced.trim() ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Mobile trending (desktop has sidebar) */}
                <div className="lg:hidden space-y-5">
                  <div>
                    <SectionHeader title="Trending topics" />
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_TAGS.map(tag => (
                        <button key={tag} onClick={() => setQuery(tag)}
                          className="px-4 py-2 rounded-pill bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors">
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionHeader title="Popular searches" />
                    <div className="space-y-1">
                      {POPULAR_SEARCH.map(s => (
                        <button key={s} onClick={() => setQuery(s)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-card text-left hover:bg-primary-50 transition-colors">
                          <Search size={15} className="text-ink-muted" />
                          <span className="text-sm text-ink-secondary">{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Desktop empty state */}
                <div className="hidden lg:flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mb-5"><Search size={36} className="text-primary-400" /></div>
                  <h3 className="font-bold text-lg text-ink-primary mb-2">Search Parento</h3>
                  <p className="text-sm text-ink-muted max-w-xs">Find verified doctors, community posts, and connect with other parents.</p>
                </div>
              </motion.div>
            ) : isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </motion.div>
            ) : !hasAny ? (
              <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState icon={<Search size={28} />} title={`No results for "${debounced}"`} description="Try different keywords or check your spelling." />
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Doctors */}
                {(tab === 'all' || tab === 'doctors') && doctors.length > 0 && (
                  <section>
                    <SectionHeader title={`Doctors (${doctors.length})`} />
                    <div className="space-y-3">
                      {(tab === 'all' ? doctors.slice(0, 4) : doctors).map((doc: any, i: number) => (
                        <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="p-4 hover:shadow-card-hover transition-shadow">
                            <div className="flex items-center gap-3">
                              <Avatar src={doc.user?.avatarUrl} name={doc.user?.fullName ?? '?'} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-ink-primary">{doc.user?.fullName}</p>
                                  <Badge variant="success" className="text-[10px]">Verified</Badge>
                                </div>
                                <p className="text-xs text-primary-500 font-medium">{doc.specialty}</p>
                                <StarRating rating={doc.rating} size={11} />
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-primary-600">₹{((doc.consultationFee ?? 0) / 100).toFixed(0)}</p>
                                <p className="text-[10px] text-ink-muted">/session</p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* People */}
                {(tab === 'all' || tab === 'people') && users.length > 0 && (
                  <section>
                    <SectionHeader title={`People (${users.length})`} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(tab === 'all' ? users.slice(0, 4) : users).map((u: any, i: number) => (
                        <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <Card className="p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
                            <Avatar src={u.avatarUrl} name={u.fullName} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-ink-primary truncate">{u.fullName}</p>
                                <Badge variant={u.role === 'DOCTOR' ? 'primary' : 'gray'} className="text-[10px] capitalize">{u.role?.toLowerCase()}</Badge>
                              </div>
                              {u.bio && <p className="text-xs text-ink-muted mt-0.5 truncate">{u.bio}</p>}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Posts */}
                {(tab === 'all' || tab === 'posts') && posts.length > 0 && (
                  <section>
                    <SectionHeader title={`Posts (${posts.length})`} />
                    <div className="space-y-3">
                      {(tab === 'all' ? posts.slice(0, 5) : posts).map((post: any, i: number) => (
                        <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <Card className="p-4 hover:shadow-card-hover transition-shadow">
                            <div className="flex gap-3">
                              <Avatar src={post.author?.avatarUrl} name={post.author?.fullName ?? '?'} size="sm" className="flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-ink-primary">{post.author?.fullName}</p>
                                <p className="text-sm text-ink-secondary mt-0.5 line-clamp-2 leading-relaxed">{post.content}</p>
                                {post.hashtags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {post.hashtags.slice(0, 3).map((tag: string) => (
                                      <span key={tag} className="text-xs text-primary-500">{tag}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-3 mt-1.5 text-xs text-ink-muted">
                                  <span>❤️ {post.likesCount}</span>
                                  <span>💬 {post.commentsCount}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:block">
          <SearchSidebar onSearch={setQuery} />
        </div>
      </div>
    </div>
  );
}
