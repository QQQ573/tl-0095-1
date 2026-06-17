import { useMemo } from 'react';
import { Clock, Timer, AlertTriangle, X, Footprints } from 'lucide-react';
import { useRouteStore } from '../store/useRouteStore';
import { calculateChainInfo } from '../utils/timeCalculator';
import { formatMinutes } from '../utils/graphLayout';

export function ChainInfoBar() {
  const selectedChain = useRouteStore((s) => s.selectedChain);
  const clearChain = useRouteStore((s) => s.clearChain);
  const toggleChainNode = useRouteStore((s) => s.toggleChainNode);
  const points = useRouteStore((s) => s.points);
  const edges = useRouteStore((s) => s.edges);
  const setDetailPoint = useRouteStore((s) => s.setDetailPoint);

  const info = useMemo(
    () => calculateChainInfo(selectedChain, points, edges),
    [selectedChain, points, edges]
  );

  if (selectedChain.length === 0) return null;

  const chainPoints = selectedChain
    .map((id) => points.find((p) => p.id === id))
    .filter((p) => !!p);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 animate-[fadeSlideUp_300ms_cubic-bezier(0.22,1,0.36,1)]">
      <div
        className="mx-auto max-w-[1180px] mb-5 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 58, 95, 0.94) 100%)',
          borderColor: info.hasConflict ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.35)',
        }}
      >
        <div className="flex items-center gap-5 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-amber-400">
              <Footprints size={20} strokeWidth={2.2} />
            </div>
            <span
              className="text-slate-100 font-bold text-[15px]"
              style={{ fontFamily: '"Noto Serif SC", serif' }}
            >
              游览链（{selectedChain.length}/6）
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto py-1 no-scrollbar">
            {chainPoints.map((p, i) => (
              <div key={p!.id} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDetailPoint(p!.id)}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-[1.02]"
                  style={{
                    background: p!.category === 'humanity' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    borderColor: p!.category === 'humanity' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.45)',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{
                      background: p!.category === 'humanity' ? '#f59e0b' : '#10b981',
                      color: '#1e3a5f',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-slate-100 text-[13px] font-medium"
                    style={{ fontFamily: '"Noto Serif SC", serif' }}
                  >
                    {p!.name}
                  </span>
                </button>
                <button
                  onClick={() => toggleChainNode(p!.id)}
                  className="w-5 h-5 rounded-full bg-slate-700/60 hover:bg-red-500/70 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  title="移除"
                >
                  <X size={12} />
                </button>
                {i < chainPoints.length - 1 && (
                  <div className="w-6 h-px bg-slate-600/60 shrink-0" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <Footprints size={15} className="text-cyan-400" />
              <span className="text-slate-400 text-[12px]">步行</span>
              <span className="text-cyan-300 font-bold text-[15px]">{formatMinutes(info.totalWalkMinutes)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer size={15} className="text-amber-400" />
              <span className="text-slate-400 text-[12px]">停留</span>
              <span className="text-amber-300 font-bold text-[15px]">{formatMinutes(info.totalStayMinutes)}</span>
            </div>
            <div className="w-px h-7 bg-slate-600/60" />
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-white" />
              <span className="text-white font-bold text-[17px]">{formatMinutes(info.totalMinutes)}</span>
            </div>
            <button
              onClick={clearChain}
              className="px-3 py-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600/80 text-slate-200 text-[12.5px] font-medium transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        {info.hasConflict && (
          <div
            className="px-6 py-3 border-t flex items-start gap-3 animate-[conflictPulse_2s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0.08) 100%)',
              borderTopColor: 'rgba(239, 68, 68, 0.35)',
            }}
          >
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" strokeWidth={2.2} />
            <div className="flex-1">
              <div className="text-red-300 font-bold text-[13px] mb-1">闭馆 / 顺序冲突</div>
              <ul className="text-red-200/90 text-[12.5px] space-y-0.5">
                {info.conflicts.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
