import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, eachDayOfInterval, 
  isWithinInterval, isBefore, isAfter, startOfDay, endOfDay
} from 'date-fns';

export type DateRangeValue = 
  | { type: 'preset'; value: string }
  | { type: 'custom'; start: Date; end: Date };

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

interface PresetItem {
  label: string;
  value: string;
  isCustom?: boolean;
}

const PRESETS: PresetItem[] = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Month to date', value: 'mtd', isCustom: true },
  { label: 'Year to date', value: 'ytd', isCustom: true },
  { label: 'All time', value: 'all' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentMonthLeft, setCurrentMonthLeft] = useState(
    value.type === 'custom' ? startOfMonth(value.start) : startOfMonth(new Date())
  );
  const currentMonthRight = addMonths(currentMonthLeft, 1);

  const [selectionStart, setSelectionStart] = useState<Date | null>(value.type === 'custom' ? value.start : null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(value.type === 'custom' ? value.end : null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update internal calendar state when popover opens to match prop value
  useEffect(() => {
    if (isOpen) {
      if (value.type === 'custom') {
        setSelectionStart(value.start);
        setSelectionEnd(value.end);
        setCurrentMonthLeft(startOfMonth(value.start));
      } else {
        setSelectionStart(null);
        setSelectionEnd(null);
        setCurrentMonthLeft(startOfMonth(new Date()));
      }
    }
  }, [isOpen, value]);

  const handleDayClick = (day: Date) => {
    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(startOfDay(day));
      setSelectionEnd(null);
    } else {
      if (isBefore(day, selectionStart)) {
        setSelectionStart(startOfDay(day));
        setSelectionEnd(null);
      } else {
        setSelectionEnd(endOfDay(day));
      }
    }
  };

  const handleApplyCustom = () => {
    if (selectionStart && selectionEnd) {
      onChange({ type: 'custom', start: selectionStart, end: selectionEnd });
      setIsOpen(false);
    }
  };

  const handlePresetClick = (preset: PresetItem) => {
    if (preset.isCustom) {
      const today = new Date();
      if (preset.value === 'mtd') {
        const start = startOfMonth(today);
        onChange({ type: 'custom', start, end: endOfDay(today) });
      } else if (preset.value === 'ytd') {
        const start = new Date(today.getFullYear(), 0, 1);
        onChange({ type: 'custom', start, end: endOfDay(today) });
      }
    } else {
      onChange({ type: 'preset', value: preset.value });
    }
    setIsOpen(false);
  };

  const isInRange = (day: Date) => {
    if (selectionStart && selectionEnd) {
      return isWithinInterval(day, { start: startOfDay(selectionStart), end: endOfDay(selectionEnd) });
    }
    if (selectionStart && hoverDate) {
      const start = isBefore(selectionStart, hoverDate) ? selectionStart : hoverDate;
      const end = isBefore(selectionStart, hoverDate) ? hoverDate : selectionStart;
      return isWithinInterval(day, { start: startOfDay(start), end: endOfDay(end) });
    }
    return false;
  };

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <div className="flex-1 w-64 p-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-foreground">
            {format(month, 'MMMM yyyy')}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-[10px] font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
            const isSelectedStart = selectionStart && isSameDay(day, selectionStart);
            const isSelectedEnd = selectionEnd && isSameDay(day, selectionEnd);
            const isSelected = isSelectedStart || isSelectedEnd;
            const inRange = isInRange(day);
            const isCurrentMonth = isSameMonth(day, month);
            const isDayToday = isToday(day);

            return (
              <div 
                key={day.toISOString()} 
                className={`relative flex items-center justify-center h-7 w-7 text-xs cursor-pointer
                  ${!isCurrentMonth ? 'text-muted-foreground/30' : 'text-foreground'}
                `}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDate(day)}
              >
                {/* Background highlight for in-between range */}
                {inRange && !isSelectedStart && !isSelectedEnd && (
                  <div className="absolute inset-0 bg-primary/15 -mx-0.5" />
                )}
                {inRange && isSelectedStart && !isSelectedEnd && (selectionEnd || hoverDate) && (
                  <div className={`absolute inset-y-0 bg-primary/15 -mx-0.5 ${
                    (selectionEnd && isAfter(selectionEnd, selectionStart)) || (hoverDate && isAfter(hoverDate, selectionStart))
                      ? 'right-0 left-1/2'
                      : 'left-0 right-1/2'
                  }`} />
                )}
                {inRange && isSelectedEnd && !isSelectedStart && (
                  <div className="absolute inset-y-0 left-0 right-1/2 bg-primary/15 -mx-0.5" />
                )}

                {/* Day Number */}
                <div 
                  className={`relative z-10 flex flex-col items-center justify-center w-7 h-7 transition-colors rounded-md
                    ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                    ${!isSelected && inRange ? 'text-primary font-medium' : ''}
                    ${!isSelected && !inRange && isCurrentMonth ? 'hover:bg-secondary' : ''}
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  {isDayToday && !isSelected && (
                    <span className="w-1 h-1 bg-primary rounded-full absolute bottom-0.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getDisplayText = () => {
    if (value.type === 'preset') {
      const preset = PRESETS.find(p => p.value === value.value);
      return preset ? preset.label : 'Select date';
    } else {
      if (isSameMonth(value.start, value.end) && value.start.getFullYear() === value.end.getFullYear()) {
         return `${format(value.start, 'MMM d')} - ${format(value.end, 'd, yyyy')}`;
      }
      return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-background border border-input rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{getDisplayText()}</span>
        <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden z-[80]"
            style={{ width: 'max-content' }}
          >
            {/* Calendar Range Selection (Left Grid) */}
            <div className="flex flex-col">
              <div className="flex relative items-center justify-between pt-3 px-3">
                <button 
                  onClick={() => setCurrentMonthLeft(subMonths(currentMonthLeft, 1))}
                  className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1" />
                <button 
                  onClick={() => setCurrentMonthLeft(addMonths(currentMonthLeft, 1))}
                  className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-2 px-3 pb-3" onMouseLeave={() => setHoverDate(null)}>
                {renderMonth(currentMonthLeft)}
                <div className="w-px bg-border my-2" />
                {renderMonth(currentMonthRight)}
              </div>
              
              <div className="border-t border-border p-3 flex items-center justify-between bg-secondary/30">
                <div className="text-xs text-muted-foreground">
                  {selectionStart && selectionEnd ? (
                    <span>
                      {format(selectionStart, 'MMM d, yyyy')} – {format(selectionEnd, 'MMM d, yyyy')}
                    </span>
                  ) : selectionStart ? (
                    <span>Select end date</span>
                  ) : (
                    <span>Select a date range</span>
                  )}
                </div>
                <button
                  onClick={handleApplyCustom}
                  disabled={!selectionStart || !selectionEnd}
                  className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Dropdown Preset List (Right Sidebar) */}
            <div className="w-full md:w-44 border-t md:border-t-0 md:border-l border-border p-2 flex flex-col gap-1 bg-secondary/20">
              {PRESETS.map(preset => {
                const isActive = value.type === 'preset' && value.value === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetClick(preset)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
