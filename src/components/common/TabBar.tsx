import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react';
import { useTabs } from '../../context/TabContext.tsx';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab, refreshTab } = useTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="w-full bg-[#0D0A17] border-b border-[#302741] flex items-center px-2 py-1 select-none z-10">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="p-1 rounded text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] transition-colors shrink-0"
        title="Scroll tabs left"
        aria-label="Scroll tabs left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Tabs Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all border shrink-0 ${
                isActive
                  ? 'bg-[#171226] text-[#FFFFFF] border-t-2 border-t-[#7C3AED] border-x-[#302741] border-b-transparent shadow-sm'
                  : 'bg-[#100D1B]/70 text-[#C9C4D6] border-transparent hover:bg-[#171226]/50 hover:text-[#FFFFFF]'
              }`}
            >
              {/* Tab Refresh Button: ⟳ (acts ONLY on this associated tab) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  refreshTab(tab.id);
                }}
                className="p-0.5 rounded text-[#C9C4D6] hover:text-[#22D3EE] hover:bg-[#302741]/40 transition-colors"
                title="Refresh tab content"
                aria-label={`Refresh ${tab.title} tab`}
              >
                <RotateCw className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
              </button>

              {/* Tab Page Title */}
              <span className="whitespace-nowrap max-w-[160px] truncate">{tab.title}</span>

              {/* Tab Close Button: × (closes only this tab) */}
              {tab.isClosable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 rounded text-[#C9C4D6] hover:text-[#F87171] hover:bg-[#302741]/40 transition-colors ml-0.5"
                  title="Close tab"
                  aria-label={`Close ${tab.title} tab`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="p-1 rounded text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#171226] transition-colors shrink-0"
        title="Scroll tabs right"
        aria-label="Scroll tabs right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
