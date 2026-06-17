import { Landmark, Leaf, ChevronDown } from 'lucide-react';
import { useRouteStore } from '../store/useRouteStore';
import { getCategoryColor } from '../utils/graphLayout';

export function CategoryBar() {
  const points = useRouteStore((s) => s.points);
  const collapsedCategories = useRouteStore((s) => s.collapsedCategories);
  const toggleCategoryCollapse = useRouteStore((s) => s.toggleCategoryCollapse);

  const categories = points.filter((p) => p.isCategory);

  if (collapsedCategories.size === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 flex gap-3 animate-[fadeSlideDown_300ms_ease-out]">
      {categories
        .filter((c) => collapsedCategories.has(c.id))
        .map((cat) => {
          const color = getCategoryColor(cat.category);
          const children = points.filter((p) => p.parentId === cat.id);
          const totalStay = children.reduce((s, p) => s + p.minStayMinutes, 0);
          const Icon = cat.category === 'humanity' ? Landmark : Leaf;

          return (
            <button
              key={cat.id}
              onClick={() => toggleCategoryCollapse(cat.id)}
              className="group flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${color}22 0%, rgba(30, 58, 95, 0.7) 100%)`,
                borderColor: `${color}55`,
                boxShadow: `0 4px 20px ${color}22`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `${color}33`,
                  color,
                }}
              >
                <Icon size={16} strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <div
                  className="text-slate-100 font-bold text-[13.5px]"
                  style={{ fontFamily: '"Noto Serif SC", serif' }}
                >
                  {cat.name}（已折叠）
                </div>
                <div className="text-slate-400 text-[11.5px]">
                  {children.length} 个点位 · 累计停留 {totalStay} 分钟
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
            </button>
          );
        })}
    </div>
  );
}
