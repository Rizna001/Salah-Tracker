import { useState, useEffect } from 'react';

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface PrayerRecord {
  date: string;
  prayers: Record<PrayerName, boolean>;
}

const PRAYERS: { name: PrayerName; time: string; icon: string }[] = [
  { name: 'Fajr', time: '5:00 AM', icon: '🌅' },
  { name: 'Dhuhr', time: '12:30 PM', icon: '☀️' },
  { name: 'Asr', time: '3:45 PM', icon: '🌤️' },
  { name: 'Maghrib', time: '6:15 PM', icon: '🌅' },
  { name: 'Isha', time: '8:00 PM', icon: '🌙' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function getMonthDates(): string[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function loadRecords(): PrayerRecord[] {
  try {
    const stored = localStorage.getItem('salah-records');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: PrayerRecord[]) {
  localStorage.setItem('salah-records', JSON.stringify(records));
}

function getStreak(records: PrayerRecord[]): number {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const record = records.find(r => r.date === dateStr);
    
    if (record && Object.values(record.prayers).every(v => v)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function App() {
  const [records, setRecords] = useState<PrayerRecord[]>(loadRecords);
  const [view, setView] = useState<'today' | 'week' | 'month'>('today');
  const [animatePrayer, setAnimatePrayer] = useState<string | null>(null);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const today = getToday();
  const todayRecord = records.find(r => r.date === today);
  const todayPrayers = todayRecord?.prayers || { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false };
  const todayCompleted = Object.values(todayPrayers).filter(Boolean).length;
  const streak = getStreak(records);

  const togglePrayer = (prayer: PrayerName) => {
    setAnimatePrayer(prayer);
    setTimeout(() => setAnimatePrayer(null), 500);

    setRecords(prev => {
      const existing = prev.find(r => r.date === today);
      if (existing) {
        return prev.map(r =>
          r.date === today
            ? { ...r, prayers: { ...r.prayers, [prayer]: !r.prayers[prayer] } }
            : r
        );
      }
      return [
        ...prev,
        {
          date: today,
          prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false, [prayer]: true },
        },
      ];
    });
  };

  const weekDates = getWeekDates();
  const monthDates = getMonthDates();

  const getPrayerStatus = (date: string, prayer: PrayerName): boolean => {
    const record = records.find(r => r.date === date);
    return record?.prayers[prayer] || false;
  };

  const getDayCompletion = (date: string): number => {
    const record = records.find(r => r.date === date);
    if (!record) return 0;
    return Object.values(record.prayers).filter(Boolean).length;
  };

  const monthCompletion = monthDates.reduce((acc, date) => {
    return acc + getDayCompletion(date);
  }, 0);

  const monthTotal = monthDates.length * 5;
  const monthPercentage = monthTotal > 0 ? Math.round((monthCompletion / monthTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#00160D] star-pattern text-white">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#003D2B] to-transparent opacity-80"></div>
        <div className="relative max-w-lg mx-auto px-4 pt-8 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold golden-text">Salah Tracker</h1>
              <p className="text-emerald-300/70 text-sm mt-1">Track your daily prayers</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full golden-gradient flex items-center justify-center shadow-lg">
                <span className="text-2xl">🕌</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-[#003D2B]/60 rounded-xl p-3 text-center border border-[#005A3C]/50">
              <p className="text-2xl font-bold text-[#D4AF37]">{todayCompleted}/5</p>
              <p className="text-xs text-emerald-300/60 mt-1">Today</p>
            </div>
            <div className="bg-[#003D2B]/60 rounded-xl p-3 text-center border border-[#005A3C]/50">
              <p className="text-2xl font-bold text-[#D4AF37]">{streak}</p>
              <p className="text-xs text-emerald-300/60 mt-1">Day Streak</p>
            </div>
            <div className="bg-[#003D2B]/60 rounded-xl p-3 text-center border border-[#005A3C]/50">
              <p className="text-2xl font-bold text-[#D4AF37]">{monthPercentage}%</p>
              <p className="text-xs text-emerald-300/60 mt-1">This Month</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-lg mx-auto px-4">
        <div className="flex bg-[#003D2B]/40 rounded-xl p-1 border border-[#005A3C]/30">
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                view === tab
                  ? 'bg-[#005A3C] text-[#D4AF37] shadow-md'
                  : 'text-emerald-300/60 hover:text-emerald-300/80'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {view === 'today' && (
          <div className="fade-in space-y-3">
            {/* Progress Bar */}
            <div className="bg-[#003D2B]/60 rounded-xl p-4 border border-[#005A3C]/30 card-glow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-emerald-300/70">Today's Progress</span>
                <span className="text-sm font-bold text-[#D4AF37]">{todayCompleted * 20}%</span>
              </div>
              <div className="h-2 bg-[#00160D] rounded-full overflow-hidden">
                <div
                  className="h-full golden-gradient rounded-full transition-all duration-500"
                  style={{ width: `${todayCompleted * 20}%` }}
                ></div>
              </div>
              <p className="text-xs text-emerald-300/50 mt-2">
                {todayCompleted === 5
                  ? '✨ All prayers completed! MashaAllah!'
                  : `${5 - todayCompleted} prayer${5 - todayCompleted !== 1 ? 's' : ''} remaining`}
              </p>
            </div>

            {/* Prayer Cards */}
            {PRAYERS.map((prayer) => {
              const isCompleted = todayPrayers[prayer.name];
              const isAnimating = animatePrayer === prayer.name;
              return (
                <button
                  key={prayer.name}
                  onClick={() => togglePrayer(prayer.name)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#005A3C]/40 border-[#D4AF37]/50 card-glow'
                      : 'bg-[#003D2B]/40 border-[#005A3C]/30 hover:border-[#005A3C]/60'
                  } ${isAnimating ? 'prayer-complete' : ''}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                      isCompleted
                        ? 'golden-gradient shadow-lg shadow-[#D4AF37]/20'
                        : 'bg-[#00160D] border border-[#005A3C]/50'
                    }`}
                  >
                    {isCompleted ? '✓' : prayer.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-semibold ${isCompleted ? 'text-[#D4AF37]' : 'text-white'}`}>
                      {prayer.name}
                    </h3>
                    <p className="text-xs text-emerald-300/50">{prayer.time}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                        : 'border-[#005A3C]/50'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-3 h-3 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {view === 'week' && (
          <div className="fade-in space-y-4">
            <div className="bg-[#003D2B]/60 rounded-xl p-4 border border-[#005A3C]/30 card-glow">
              <h3 className="text-sm text-emerald-300/70 mb-3">Weekly Overview</h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                  const completion = getDayCompletion(date);
                  const isToday = date === today;
                  return (
                    <div key={date} className="flex flex-col items-center">
                      <span className={`text-xs mb-1 ${isToday ? 'text-[#D4AF37] font-bold' : 'text-emerald-300/50'}`}>
                        {DAYS[index]}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          isToday
                            ? 'golden-gradient text-[#00160D]'
                            : completion === 5
                            ? 'bg-[#005A3C] text-[#D4AF37] border border-[#D4AF37]/30'
                            : completion > 0
                            ? 'bg-[#005A3C]/60 text-emerald-200'
                            : 'bg-[#00160D] text-emerald-300/30 border border-[#005A3C]/30'
                        }`}
                      >
                        {completion > 0 ? completion : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Week View */}
            <div className="space-y-2">
              {weekDates.map((date, index) => {
                const isToday = date === today;
                const completion = getDayCompletion(date);
                return (
                  <div
                    key={date}
                    className={`bg-[#003D2B]/40 rounded-xl p-3 border transition-all ${
                      isToday ? 'border-[#D4AF37]/30 card-glow' : 'border-[#005A3C]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isToday ? 'text-[#D4AF37]' : 'text-emerald-200'}`}>
                          {DAYS[index]}
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-300/50">{completion}/5</span>
                    </div>
                    <div className="flex gap-1.5">
                      {PRAYERS.map((prayer) => {
                        const completed = getPrayerStatus(date, prayer.name);
                        return (
                          <div
                            key={prayer.name}
                            className={`flex-1 h-2 rounded-full transition-all ${
                              completed ? 'bg-[#D4AF37]' : 'bg-[#00160D]'
                            }`}
                            title={`${prayer.name}: ${completed ? 'Completed' : 'Missed'}`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'month' && (
          <div className="fade-in space-y-4">
            {/* Monthly Progress */}
            <div className="bg-[#003D2B]/60 rounded-xl p-5 border border-[#005A3C]/30 card-glow text-center">
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#00160D" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#goldGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${monthPercentage * 2.51} 251`}
                  />
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="50%" stopColor="#F4D03F" />
                      <stop offset="100%" stopColor="#D4AF37" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#D4AF37]">{monthPercentage}%</span>
                </div>
              </div>
              <p className="text-sm text-emerald-300/70">Monthly Completion Rate</p>
              <p className="text-xs text-emerald-300/50 mt-1">{monthCompletion} of {monthTotal} prayers</p>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#003D2B]/60 rounded-xl p-4 border border-[#005A3C]/30">
              <h3 className="text-sm text-emerald-300/70 mb-3">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] text-emerald-300/40 py-1">{day}</div>
                ))}
                {/* Empty cells for days before month starts */}
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() || 7 - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {monthDates.map((date) => {
                  const completion = getDayCompletion(date);
                  const isToday = date === today;
                  const dayNum = new Date(date).getDate();
                  return (
                    <div
                      key={date}
                      className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all ${
                        isToday
                          ? 'golden-gradient text-[#00160D] font-bold'
                          : completion === 5
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                          : completion >= 3
                          ? 'bg-[#005A3C]/60 text-emerald-200'
                          : completion > 0
                          ? 'bg-[#005A3C]/30 text-emerald-300/70'
                          : 'text-emerald-300/30'
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#003D2B]/60 rounded-xl p-4 border border-[#005A3C]/30 text-center">
                <p className="text-2xl font-bold text-[#D4AF37]">
                  {records.filter(r => {
                    const d = new Date(r.date);
                    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                  }).reduce((acc, r) => acc + Object.values(r.prayers).filter(Boolean).length, 0)}
                </p>
                <p className="text-xs text-emerald-300/60 mt-1">Total Prayers</p>
              </div>
              <div className="bg-[#003D2B]/60 rounded-xl p-4 border border-[#005A3C]/30 text-center">
                <p className="text-2xl font-bold text-[#D4AF37]">
                  {records.filter(r => {
                    const d = new Date(r.date);
                    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                  }).filter(r => Object.values(r.prayers).every(v => v)).length}
                </p>
                <p className="text-xs text-emerald-300/60 mt-1">Perfect Days</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-xs text-emerald-300/30">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <p className="text-[10px] text-emerald-300/20 mt-1">
          "Indeed, prayer has been decreed upon the believers at specified times." — Quran 4:103
        </p>
      </footer>
    </div>
  );
}
