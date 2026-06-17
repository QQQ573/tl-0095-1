import { useEffect, useRef, useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { GraphCanvas } from '../components/GraphCanvas';
import { DetailCard } from '../components/DetailCard';
import { CategoryBar } from '../components/CategoryBar';
import { ChainInfoBar } from '../components/ChainInfoBar';
import { Map, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { useRouteStore } from '../store/useRouteStore';

export function RoutePlanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const requestZoom = useRouteStore((s) => s.requestZoom);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const measure = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (containerRef.current) {
          setDimensions({
            w: containerRef.current.clientWidth,
            h: containerRef.current.clientHeight,
          });
        }
      }, 300);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-5 pb-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(16,185,129,0.2))', border: '1px solid rgba(245,158,11,0.4)' }}>
            <Map size={22} className="text-amber-400" strokeWidth={2.2} />
          </div>
          <div>
            <h1
              className="text-slate-100 text-xl font-bold leading-tight"
              style={{ fontFamily: '"Noto Serif SC", serif' }}
            >
              暑期研学路线规划
            </h1>
            <p className="text-slate-400 text-[12px] mt-0.5">
              拖拽节点调整布局 · 单击选中游览链 · 双击查看详情
            </p>
          </div>
        </div>

        <div className="pointer-events-auto">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => requestZoom('reset')}
            className="w-9 h-9 rounded-lg bg-slate-800/60 backdrop-blur-md border border-slate-600/40 text-slate-300 hover:text-white hover:bg-slate-700/70 flex items-center justify-center transition-colors"
            title="缩放重置"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => requestZoom('in')}
            className="w-9 h-9 rounded-lg bg-slate-800/60 backdrop-blur-md border border-slate-600/40 text-slate-300 hover:text-white hover:bg-slate-700/70 flex items-center justify-center transition-colors"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => requestZoom('out')}
            className="w-9 h-9 rounded-lg bg-slate-800/60 backdrop-blur-md border border-slate-600/40 text-slate-300 hover:text-white hover:bg-slate-700/70 flex items-center justify-center transition-colors"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <div className="w-px h-6 bg-slate-600/50 mx-1" />
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 backdrop-blur-md border border-slate-600/30 text-slate-400 text-[11.5px]"
            style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
          >
            <Info size={13} />
            滚轮缩放 · 空白拖拽平移
          </div>
        </div>
      </div>

      <CategoryBar />

      <div
        ref={containerRef}
        className="absolute inset-0 pt-20 pb-28"
      >
        {dimensions.w > 0 && dimensions.h > 0 && (
          <GraphCanvas containerWidth={dimensions.w} containerHeight={dimensions.h} />
        )}
      </div>

      <ChainInfoBar />
      <DetailCard />
    </div>
  );
}
