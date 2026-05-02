/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  RefreshCw, 
  ArrowRightLeft, 
  Calendar, 
  History as HistoryIcon, 
  Trash2, 
  Copy, 
  Check,
  Zap,
  Info,
  Clock2,
  CalendarDays,
  ChevronRight,
  ArrowUp,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfDay,
  subDays,
  addDays,
  startOfWeek,
  startOfMonth,
  startOfYear,
  fromUnixTime, 
  getUnixTime, 
  parseISO, 
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds
} from 'date-fns';

// --- Types ---
interface HistoryItem {
  id: string;
  type: 'to_date' | 'to_timestamp' | 'diff';
  input: string;
  result: string;
  timestamp: number;
}

// --- Components ---

const Header = () => (
  <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-lg sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4 group cursor-default">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-slate-900 flex items-center gap-2">
            ChronoTools
            <span className="text-blue-600 font-mono text-[10px] px-2 py-0.5 bg-blue-50/50 border border-blue-200/50 rounded-lg backdrop-blur-sm">v2.7.0</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium tracking-tight">开发者专属的时间戳与日期处理中心</p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-300">当前日期</span>
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarDays className="w-3.5 h-3.5" />
            {format(new Date(), 'yyyy年MM月dd日')}
          </div>
        </div>
        <div className="w-px h-8 bg-slate-200/60" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-300">时区信息</span>
          <div className="flex items-center gap-2 text-slate-600">
            <RefreshCw className="w-3.5 h-3.5" />
            UTC {format(new Date(), 'xxx')}
          </div>
        </div>
      </div>
    </div>
  </header>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      className={`p-2 rounded-xl transition-all duration-300 ${copied ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
      title="复制到剪贴板"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('chrono-history');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Converter 1: Timestamp -> Date
  const [tsInput, setTsInput] = useState<string>('');
  
  // Converter 2: Date -> Timestamp
  const [dateInput, setDateInput] = useState<string>(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
  
  // Diff Calculator
  const [diffStart, setDiffStart] = useState<string>('');
  const [diffEnd, setDiffEnd] = useState<string>('');

  // Update current time and handle scroll for "Back to Top"
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('chrono-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (type: HistoryItem['type'], input: string, result: string) => {
    // Only add if not identical to last entry
    if (history.length > 0 && history[0].input === input && history[0].result === result) return;
    
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      input,
      result,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 30));
  };

  const clearHistory = () => {
    if (confirm('确定要清除所有历史记录吗？')) {
      setHistory([]);
    }
  };

  const updateDatePart = (part: string, value: number) => {
    const current = isValid(parseISO(dateInput)) ? parseISO(dateInput) : 
                    isValid(fromUnixTime(parseInt(dateInput))) ? fromUnixTime(parseInt(dateInput)) : new Date();
    const newDate = new Date(current);
    if (part === 'year') newDate.setFullYear(value);
    if (part === 'month') newDate.setMonth(value);
    if (part === 'day') newDate.setDate(value);
    if (part === 'hour') newDate.setHours(value);
    if (part === 'minute') newDate.setMinutes(value);
    if (part === 'second') newDate.setSeconds(value);
    setDateInput(format(newDate, 'yyyy-MM-dd HH:mm:ss'));
  };

  const DateToken = ({ value, label, part, items, current }: { 
    value: string; 
    label: string; 
    part: string; 
    items: {val: number, label: string}[];
    current: number;
  }) => (
    <div className="flex flex-col items-center group/token relative">
      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mb-1 opacity-0 group-hover/token:opacity-100 transition-opacity">{label}</span>
      <div className="relative">
        <select 
          value={current}
          onChange={(e) => updateDatePart(part, parseInt(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        >
          {items.map(item => <option key={item.val} value={item.val}>{item.label}</option>)}
        </select>
        <div className="px-1.5 py-1 rounded-md bg-transparent hover:bg-blue-50 text-slate-900 font-mono font-bold transition-colors cursor-pointer group-hover/token:text-blue-600">
          {value}
        </div>
      </div>
    </div>
  );

  const codeSnippets = [
    { lang: 'JavaScript', code: 'Math.floor(Date.now() / 1000)' },
    { lang: 'Python', code: 'import time; int(time.time())' },
    { lang: 'Java', code: 'System.currentTimeMillis() / 1000L' },
    { lang: 'PHP', code: 'time()' },
    { lang: 'Go', code: 'time.Now().Unix()' },
    { lang: 'C#', code: 'DateTimeOffset.Now.ToUnixTimeSeconds()' },
    { lang: 'Ruby', code: 'Time.now.to_i' },
    { lang: 'MySQL', code: 'UNIX_TIMESTAMP()' }
  ];

  // Logic: TS -> Date
  const tsResult = useMemo(() => {
    if (!tsInput) return null;
    const num = parseInt(tsInput);
    if (isNaN(num)) return { error: '无效数字' };
    
    const isMs = tsInput.length > 10;
    const date = isMs ? new Date(num) : fromUnixTime(num);
    
    if (!isValid(date)) return { error: '无效日期' };
    
    const formatted = format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
    // Save to history automatically after a small delay
    const timer = setTimeout(() => {
      addToHistory('to_date', tsInput, formatted);
    }, 1000);
    
    return {
      date,
      formatted,
      utc: date.toUTCString(),
      type: isMs ? '毫秒 (MS)' : '秒 (S)',
      cleanup: () => clearTimeout(timer)
    };
  }, [tsInput]);

  useEffect(() => {
    return () => {
      if (tsResult && 'cleanup' in tsResult) (tsResult as any).cleanup?.();
    };
  }, [tsResult]);

  // Logic: Date -> TS
  const dateResult = useMemo(() => {
    if (!dateInput) return null;
    let date = parseISO(dateInput);
    if (!isValid(date)) {
      date = parseISO(dateInput.replace(' ', 'T'));
    }
    
    if (!isValid(date)) {
      const parsed = Date.parse(dateInput);
      if (!isNaN(parsed)) date = new Date(parsed);
    }

    if (!isValid(date)) return { error: '无效的日期格式' };

    const s = getUnixTime(date);
    const ms = date.getTime();

    // Save to history
    const timer = setTimeout(() => {
      addToHistory('to_timestamp', dateInput, s.toString());
    }, 1000);

    return {
      s,
      ms,
      cleanup: () => clearTimeout(timer)
    };
  }, [dateInput]);

  useEffect(() => {
    return () => {
      if (dateResult && 'cleanup' in dateResult) (dateResult as any).cleanup?.();
    };
  }, [dateResult]);

  // Logic: Difference
  const diffResult = useMemo(() => {
    if (!diffStart || !diffEnd) return null;
    
    const parseTsOrDate = (input: string) => {
      const num = parseInt(input);
      if (!isNaN(num) && input.length >= 10) {
        return input.length > 10 ? new Date(num) : fromUnixTime(num);
      }
      return parseISO(input.replace(' ', 'T'));
    };

    const d1 = parseTsOrDate(diffStart);
    const d2 = parseTsOrDate(diffEnd);

    if (!isValid(d1) || !isValid(d2)) return { error: '日期解析失败' };

    const days = Math.abs(differenceInDays(d1, d2));
    const resultStr = `${days}天`;

    // Save to history
    const timer = setTimeout(() => {
      addToHistory('diff', `${diffStart} ↔ ${diffEnd}`, resultStr);
    }, 1000);

    return {
      days,
      hours: Math.abs(differenceInHours(d1, d2)),
      minutes: Math.abs(differenceInMinutes(d1, d2)),
      seconds: Math.abs(differenceInSeconds(d1, d2)),
      cleanup: () => clearTimeout(timer)
    };
  }, [diffStart, diffEnd]);

  useEffect(() => {
    return () => {
      if (diffResult && 'cleanup' in diffResult) (diffResult as any).cleanup?.();
    };
  }, [diffResult]);

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-500/30">
      <Header />

      <main className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tools */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Live Clock Section */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">实时系统时钟</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">当前时间戳 (秒)</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold tracking-tight text-slate-800">
                    {Math.floor(currentTime.getTime() / 1000)}
                  </span>
                  <CopyButton text={Math.floor(currentTime.getTime() / 1000).toString()} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">当前时间戳 (毫秒)</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold tracking-tight text-blue-600">
                    {currentTime.getTime()}
                  </span>
                  <CopyButton text={currentTime.getTime().toString()} />
                </div>
              </div>
              <div className="md:col-span-2 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                  <span className="label-xs">ISO 8601 格式</span>
                  <span className="font-mono text-sm text-slate-600">{currentTime.toISOString()}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                  <span className="label-xs">标准日期格式</span>
                  <span className="font-mono text-sm text-slate-600">{format(currentTime, 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Converter 1: TS to Date */}
          <section className="tech-card">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">时间戳转日期</h2>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TS → DATE</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="输入时间戳 (秒或毫秒)"
                    className="tech-input flex-1 text-lg py-3"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                  />
                  <button 
                    onClick={() => setTsInput(Math.floor(Date.now() / 1000).toString())}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 快捷按钮 */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: '现在', getValue: () => Math.floor(Date.now() / 1000).toString() },
                    { label: '今天', getValue: () => Math.floor(startOfDay(new Date()).getTime() / 1000).toString() },
                    { label: '昨天', getValue: () => Math.floor(subDays(startOfDay(new Date()), 1).getTime() / 1000).toString() },
                    { label: '明天', getValue: () => Math.floor(addDays(startOfDay(new Date()), 1).getTime() / 1000).toString() },
                    { label: '24h后', getValue: () => Math.floor(addDays(new Date(), 1).getTime() / 1000).toString() },
                    { label: '本周', getValue: () => Math.floor(startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() / 1000).toString() },
                    { label: '本月', getValue: () => Math.floor(startOfMonth(new Date()).getTime() / 1000).toString() },
                    { label: '今年', getValue: () => Math.floor(startOfYear(new Date()).getTime() / 1000).toString() },
                  ].map(btn => (
                    <button 
                      key={btn.label}
                      onClick={() => setTsInput(btn.getValue())}
                      className="px-3 py-1.5 bg-white hover:bg-blue-600 text-slate-500 hover:text-white text-[10px] font-bold rounded-lg border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-blue-500/20"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {tsResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {'error' in tsResult ? (
                      <p className="p-3 bg-red-50 text-red-600 text-xs font-mono rounded-lg border border-red-100">{tsResult.error}</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100/50 group transition-all hover:shadow-md hover:shadow-blue-500/5">
                          <div>
                            <span className="text-[10px] font-bold text-blue-500/60 mb-1 block uppercase tracking-widest">本地日期 ({format(new Date(), 'xxx')})</span>
                            <span className="font-mono text-slate-900 font-bold text-lg">{tsResult.formatted}</span>
                          </div>
                          <CopyButton text={tsResult.formatted} />
                        </div>
                        <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-200/50 transition-all hover:border-slate-300">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-widest">UTC / ISO 8601</span>
                            <span className="font-mono text-slate-600 text-sm">{tsResult.utc}</span>
                          </div>
                          <CopyButton text={tsResult.utc} />
                        </div>
                        <div className="pt-2">
                           <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 shadow-sm shadow-blue-500/20">
                             <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" />
                             识别为: {tsResult.type}
                           </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Converter 2: Date to TS */}
          <section className="tech-card">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">日期转时间戳</h2>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DATE → TS</div>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">日期分段编辑 (点击对应部分修改)</label>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 shadow-inner">
                      {(() => {
                        const d = isValid(parseISO(dateInput)) ? parseISO(dateInput) : 
                                  isValid(fromUnixTime(parseInt(dateInput))) ? fromUnixTime(parseInt(dateInput)) : new Date();
                        
                        return (
                          <>
                            <DateToken 
                              value={format(d, 'yyyy')} 
                              label="年" 
                              part="year" 
                              current={d.getFullYear()}
                              items={Array.from({length: 61}, (_, i) => ({ val: 2000 + i, label: (2000 + i).toString() }))}
                            />
                            <span className="text-slate-300 font-bold self-end pb-1.5">-</span>
                            <DateToken 
                              value={format(d, 'MM')} 
                              label="月" 
                              part="month" 
                              current={d.getMonth()}
                              items={Array.from({length: 12}, (_, i) => ({ val: i, label: `${i + 1}月` }))}
                            />
                            <span className="text-slate-300 font-bold self-end pb-1.5">-</span>
                            <DateToken 
                              value={format(d, 'dd')} 
                              label="日" 
                              part="day" 
                              current={d.getDate()}
                              items={Array.from({length: 31}, (_, i) => ({ val: i + 1, label: (i+1).toString().padStart(2, '0') }))}
                            />
                            <span className="w-1 md:w-3"></span>
                            <DateToken 
                              value={format(d, 'HH')} 
                              label="时" 
                              part="hour" 
                              current={d.getHours()}
                              items={Array.from({length: 24}, (_, i) => ({ val: i, label: i.toString().padStart(2, '0') }))}
                            />
                            <span className="text-slate-300 font-bold self-end pb-1.5">:</span>
                            <DateToken 
                              value={format(d, 'mm')} 
                              label="分" 
                              part="minute" 
                              current={d.getMinutes()}
                              items={Array.from({length: 60}, (_, i) => ({ val: i, label: i.toString().padStart(2, '0') }))}
                            />
                            <span className="text-slate-300 font-bold self-end pb-1.5">:</span>
                            <DateToken 
                              value={format(d, 'ss')} 
                              label="秒" 
                              part="second" 
                              current={d.getSeconds()}
                              items={Array.from({length: 60}, (_, i) => ({ val: i, label: i.toString().padStart(2, '0') }))}
                            />
                          </>
                        );
                      })()}
                      
                      <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                      
                      <div className="flex gap-1 ml-auto">
                        <button 
                          onClick={() => setDateInput(format(new Date(), 'yyyy-MM-dd HH:mm:ss'))}
                          className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="设为现在"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <div className="relative group/picker">
                          <input 
                            type="datetime-local" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              if (isValid(date)) setDateInput(format(date, 'yyyy-MM-dd HH:mm:ss'));
                            }}
                          />
                          <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pl-1">手动编辑原文</label>
                      <input 
                        type="text" 
                        placeholder="例如: 2024-05-20 13:14:00"
                        className="tech-input text-sm py-2 px-3 bg-slate-50/50 border-slate-100 italic"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 快捷按钮 */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: '当前', getValue: () => format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
                    { label: '今天', getValue: () => format(startOfDay(new Date()), 'yyyy-MM-dd HH:mm:ss') },
                    { label: '昨天', getValue: () => format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd HH:mm:ss') },
                    { label: '本周', getValue: () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd HH:mm:ss') },
                    { label: '本月', getValue: () => format(startOfMonth(new Date()), 'yyyy-MM-dd HH:mm:ss') },
                    { label: '今年', getValue: () => format(startOfYear(new Date()), 'yyyy-MM-dd HH:mm:ss') },
                  ].map(btn => (
                    <button 
                      key={btn.label}
                      onClick={() => setDateInput(btn.getValue())}
                      className="px-3 py-1.5 bg-white hover:bg-blue-600 text-slate-500 hover:text-white text-[10px] font-bold rounded-lg border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-blue-500/20"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {dateResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {'error' in dateResult ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl md:col-span-2">
                          <p className="text-red-700 text-xs font-mono">{dateResult.error}</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 group transition-all hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/5">
                            <span className="text-[10px] font-bold text-blue-500/70 uppercase tracking-widest mb-1 shadow-sm block">Unix 时间戳 (秒)</span>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-2xl text-blue-700 font-bold">{dateResult.s}</span>
                              <CopyButton text={dateResult.s.toString()} />
                            </div>
                          </div>
                          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200/50 group transition-all hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-500/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Unix 时间戳 (毫秒)</span>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-2xl text-slate-700 font-bold">{dateResult.ms}</span>
                              <CopyButton text={dateResult.ms.toString()} />
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </section>

          {/* Calculator: Difference */}
          <section className="tech-card">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">时间间隔计算</h2>
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">开始时间</label>
                  <input 
                    className="tech-input w-full bg-slate-50/50" 
                    placeholder="时间戳或日期字符串..."
                    value={diffStart}
                    onChange={e => setDiffStart(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setDiffStart(Math.floor(Date.now() / 1000).toString())} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">设为现在</button>
                    <button onClick={() => setDiffStart(format(new Date(), 'yyyy-MM-01'))} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider">月初</button>
                  </div>
                </div>
                <div className="pt-6 text-slate-300 font-mono text-xl">→</div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">结束时间</label>
                  <input 
                    className="tech-input w-full bg-slate-50/50" 
                    placeholder="时间戳或日期字符串..."
                    value={diffEnd}
                    onChange={e => setDiffEnd(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setDiffEnd(Math.floor(Date.now() / 1000).toString())} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">设为现在</button>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {diffResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {'error' in diffResult ? (
                      <p className="p-4 bg-red-50 text-red-600 text-xs font-mono rounded-xl border border-red-100 col-span-full">{diffResult.error}</p>
                    ) : (
                      <>
                        <div className="text-center p-6 bg-gradient-to-b from-blue-50 to-blue-100/30 border border-blue-200/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-3xl font-mono font-black text-blue-700 tracking-tighter">{diffResult.days}</div>
                          <div className="text-[10px] text-blue-500/80 font-bold uppercase tracking-widest mt-1">天数 (Days)</div>
                        </div>
                        <div className="text-center p-6 bg-slate-50/80 border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-colors">
                          <div className="text-2xl font-mono font-bold text-slate-800 tracking-tight">{diffResult.hours}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">小时 (Hours)</div>
                        </div>
                        <div className="text-center p-6 bg-slate-50/80 border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-colors">
                          <div className="text-2xl font-mono font-bold text-slate-800 tracking-tight">{diffResult.minutes}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">分钟 (Minutes)</div>
                        </div>
                        <div className="text-center p-6 bg-slate-50/80 border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-colors">
                          <div className="text-2xl font-mono font-bold text-slate-800 tracking-tight">{diffResult.seconds.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">秒数 (Seconds)</div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>

        {/* Right Column: History & Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* History Panel */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[400px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-500">
                <HistoryIcon className="w-3.5 h-3.5" />
                本地历史记录
              </h2>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                  title="清除记录"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs">暂无计算记录</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-4 bg-white/60 hover:bg-white rounded-xl border border-slate-200/60 group relative transition-all hover:shadow-lg hover:shadow-slate-500/5 hover:border-blue-200/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          item.type === 'to_date' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                          item.type === 'to_timestamp' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {item.type === 'to_date' ? 'TS → DATE' : item.type === 'to_timestamp' ? 'DATE → TS' : 'DIFF'}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[9px] font-bold">
                          <Clock2 className="w-2.5 h-2.5" />
                          {format(item.timestamp, 'HH:mm:ss')}
                        </div>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 truncate mb-1.5 opacity-70">IN: {item.input}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-mono font-bold text-slate-800 break-all leading-tight">{item.result}</p>
                        <button 
                          onClick={() => {
                            if (item.type === 'to_date') setTsInput(item.input);
                            if (item.type === 'to_timestamp') setDateInput(item.input);
                            if (item.type === 'diff') {
                               const [s, e] = item.input.split(' ↔ ');
                               setDiffStart(s);
                               setDiffEnd(e);
                            }
                          }}
                          className="flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 transition-all bg-blue-50 text-blue-600 rounded-lg shadow-sm hover:bg-blue-600 hover:text-white"
                          title="重新加载此记录"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Quick Snippets */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-500">
                <Terminal className="w-3.5 h-3.5" />
                各语言获取当前时间戳 (s)
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {codeSnippets.map(item => (
                <div key={item.lang} className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{item.lang}</span>
                  <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[10px] text-blue-300 flex justify-between group">
                    <code className="truncate pr-4 leading-relaxed">{item.code}</code>
                    <CopyButton text={item.code} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reference Cheat Sheet */}
          <section className="bg-slate-800 text-slate-300 rounded-xl shadow-lg border border-slate-700/50">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                开发者快速参考
              </h2>
            </div>
            <div className="p-6 space-y-4 font-mono text-[12px]">
              <div className="flex justify-between py-2 border-b border-slate-700/50 group hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors">
                <span className="text-slate-500">1 分钟</span>
                <span className="text-blue-400 font-bold">60</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50 group hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors">
                <span className="text-slate-500">1 小时</span>
                <span className="text-blue-400 font-bold">3,600</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50 group hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors">
                <span className="text-slate-500">1 天</span>
                <span className="text-blue-400 font-bold">86,400</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50 group hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors">
                <span className="text-slate-500">1 周</span>
                <span className="text-blue-400 font-bold">604,800</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50 group hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors">
                <span className="text-slate-500">1 月 (30天)</span>
                <span className="text-blue-400 font-bold">2,592,000</span>
              </div>
              <div className="flex justify-between py-2 group hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors">
                <span className="text-slate-500">1 年 (365天)</span>
                <span className="text-blue-400 font-bold">31,536,000</span>
              </div>
            </div>
          </section>

          {/* Quick Tips */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-amber-800 tracking-tight flex items-center gap-2 uppercase tracking-widest">
                <Zap className="w-4 h-4 text-amber-600" />
                识别建议
              </h3>
              <ul className="text-xs text-amber-700 space-y-3 font-medium">
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>10 位数字:</strong> Unix 秒 (例如 1715xxxxxx)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>13 位数字:</strong> 毫秒 (例如 1715xxxxxxxxxx)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>JS <code>Date.now()</code> 返回的是毫秒。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Python <code>time.time()</code> 返回浮点秒。</span>
                </li>
              </ul>
            </div>
          </section>
          
          {/* Engine Info */}
          <div className="p-6 border border-dashed border-slate-200 rounded-2xl bg-white/50">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">系统状态</span>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-[11px]">
                 <span className="text-slate-500">浏览器语言:</span>
                 <span className="text-slate-700 font-mono font-medium">{Intl.DateTimeFormat().resolvedOptions().locale}</span>
               </div>
               <div className="flex justify-between items-center text-[11px]">
                 <span className="text-slate-500">本地时区偏移:</span>
                 <span className="text-slate-700 font-mono font-medium">{format(new Date(), 'xxx')}</span>
               </div>
               <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
                 所有计算均在浏览器本地执行，确保极速响应与隐私安全。
               </p>
             </div>
          </div>
          
        </div>

      </main>

      <footer className="mt-16 pb-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
        开源工具 • 极简设计 • v2.7.0
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-slate-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-slate-200 transition-all hover:bg-slate-50 active:scale-95 group"
              title="返回顶部"
            >
              <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        <button 
          onClick={() => {
            setTsInput('');
            setDateInput(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
            setDiffStart('');
            setDiffEnd('');
          }}
          className="bg-slate-800 hover:bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl border border-slate-700 transition-all hover:rotate-180 active:scale-95"
          title="重置所有输入"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
