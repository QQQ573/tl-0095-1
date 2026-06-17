import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { useRouteStore } from '../store/useRouteStore';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const points = useRouteStore((s) => s.points);
  const triggerPulse = useRouteStore((s) => s.triggerPulse);
  const setDetailPoint = useRouteStore((s) => s.setDetailPoint);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return points
      .filter((p) => !p.isCategory)
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, points]);

  const handleSelect = (pointId: string) => {
    triggerPulse(pointId, 1200);
    setDetailPoint(pointId);
    setQuery('');
    setOpen(false);
  };

  useEffect(() => {
    setOpen(query.trim().length > 0);
  }, [query]);

  return (
    <div className="relative z-30">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/80">
          <Search size={18} strokeWidth={2} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索点位名称或编号，如 M001、博物馆..."
          className="w-[420px] h-12 pl-12 pr-10 rounded-full bg-slate-800/70 backdrop-blur-md border border-slate-600/50 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 text-[14px]"
          style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-14 left-0 w-[420px] rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-600/40 shadow-2xl overflow-hidden animate-[searchFadeIn_180ms_ease-out]">
          {results.map((p, i) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-700/60 transition-colors text-left border-b border-slate-700/50 last:border-b-0"
              style={{ animation: `fadeSlideIn 200ms ${i * 40}ms both ease-out` }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: p.category === 'humanity' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                  color: p.category === 'humanity' ? '#f59e0b' : '#10b981',
                }}
              >
                <MapPin size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-100 font-medium text-[14px] truncate" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                  {p.name}
                </div>
                <div className="text-slate-400 text-[12px] mt-0.5">
                  <span className="font-mono mr-2">{p.id}</span>
                  <span className="opacity-80">停留 {p.minStayMinutes} 分钟</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span>{p.category === 'humanity' ? '人文线' : '生态线'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-14 left-0 w-[420px] rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-600/40 shadow-2xl p-6 text-center animate-[searchFadeIn_180ms_ease-out]">
          <div className="text-slate-400 text-[13px]" style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
            未找到匹配的点位
          </div>
        </div>
      )}
    </div>
  );
}
