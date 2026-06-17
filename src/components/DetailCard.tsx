import { X, Clock, Calendar, MapPin, Landmark, Leaf, Timer } from 'lucide-react';
import { useRouteStore } from '../store/useRouteStore';
import { getCategoryColor } from '../utils/graphLayout';
import { findPrerequisites, findDependents } from '../utils/timeCalculator';

export function DetailCard() {
  const detailPointId = useRouteStore((s) => s.detailPointId);
  const setDetailPoint = useRouteStore((s) => s.setDetailPoint);
  const points = useRouteStore((s) => s.points);
  const edges = useRouteStore((s) => s.edges);

  const point = points.find((p) => p.id === detailPointId);

  if (!point || point.isCategory) return null;

  const color = getCategoryColor(point.category);
  const prerequisites = findPrerequisites(point.id, edges)
    .map((id) => points.find((p) => p.id === id))
    .filter((p) => !!p);
  const dependents = findDependents(point.id, edges)
    .map((id) => points.find((p) => p.id === id))
    .filter((p) => !!p);

  const Icon = point.category === 'humanity' ? Landmark : Leaf;

  return (
    <div
      className="fixed top-0 right-0 h-full w-[380px] z-40 animate-[slideInRight_350ms_cubic-bezier(0.22,1,0.36,1)]"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(30, 58, 95, 0.97) 100%)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)`,
        }}
      />
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${color}22`,
                border: `2px solid ${color}55`,
                color,
              }}
            >
              <Icon size={24} strokeWidth={2} />
            </div>
            <div>
              <h2
                className="text-slate-100 text-xl font-bold leading-tight"
                style={{ fontFamily: '"Noto Serif SC", serif' }}
              >
                {point.name}
              </h2>
              <div className="text-slate-400 text-sm mt-0.5 font-mono tracking-wider">
                {point.id}
              </div>
            </div>
          </div>
          <button
            onClick={() => setDetailPoint(null)}
            className="w-9 h-9 rounded-full bg-slate-700/60 hover:bg-slate-600/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${color}22`,
              color,
              border: `1px solid ${color}44`,
            }}
          >
            {point.category === 'humanity' ? '人文线' : '生态线'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/40">
            教育权重 {point.educationWeight}/10
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-slate-300 text-sm font-semibold mb-2 flex items-center gap-2">
            <MapPin size={14} strokeWidth={2} style={{ color }} />
            讲解摘要
          </h3>
          <p
            className="text-slate-300/90 text-[13.5px] leading-relaxed p-4 rounded-xl bg-slate-800/50 border border-slate-700/40"
            style={{ fontFamily: '"Noto Serif SC", serif', lineHeight: '1.85' }}
          >
            {point.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
              <Clock size={13} />
              开放时间
            </div>
            <div className="text-slate-100 font-semibold text-[14px]">{point.openTime}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
              <Calendar size={13} />
              闭馆窗口
            </div>
            <div
              className="font-semibold text-[14px]"
              style={{ color: point.closeWindow === '无' ? '#10b981' : '#ef4444' }}
            >
              {point.closeWindow}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/40 col-span-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
              <Timer size={13} />
              最短停留时间
            </div>
            <div className="text-slate-100 font-semibold text-[14px]">{point.minStayMinutes} 分钟</div>
          </div>
        </div>

        {prerequisites.length > 0 && (
          <div className="mb-5">
            <h3 className="text-slate-300 text-sm font-semibold mb-2">必须先游览</h3>
            <div className="flex flex-wrap gap-2">
              {prerequisites.map((p) => (
                <button
                  key={p!.id}
                  onClick={() => setDetailPoint(p!.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600/70 text-slate-200 text-xs border border-slate-600/40 transition-colors"
                >
                  {p!.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {dependents.length > 0 && (
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2">游览后可进入</h3>
            <div className="flex flex-wrap gap-2">
              {dependents.map((p) => (
                <button
                  key={p!.id}
                  onClick={() => setDetailPoint(p!.id)}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                  style={{
                    background: `${color}18`,
                    borderColor: `${color}44`,
                    color,
                  }}
                >
                  {p!.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
