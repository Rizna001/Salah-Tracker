import { useState, useEffect, useCallback } from 'react';
import { Language, LANGUAGES, t } from './translations';
import { playPrayerCompleteSound, playGoalAchievedSound, playPrayerReminderSound, playClickSound } from './sounds';

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
type Theme = 'dark' | 'light';

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

function getPrayerTranslation(lang: Language, prayer: PrayerName): string {
  const key = prayer.toLowerCase();
  return t(lang, key);
}

export default function App() {
  const [records, setRecords] = useState<PrayerRecord[]>(loadRecords);
  const [view, setView] = useState<'today' | 'week' | 'month'>('today');
  const [animatePrayer, setAnimatePrayer] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('salah-lang') as Language) || 'en';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('salah-theme') as Theme) || 'dark';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('salah-sound') !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prayerReminder, setPrayerReminder] = useState<string | null>(null);

  const isRTL = LANGUAGES.find(l => l.code === lang)?.dir === 'rtl';

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    localStorage.setItem('salah-lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('salah-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('salah-sound', soundEnabled.toString());
  }, [soundEnabled]);

  // Check for prayer time reminders every minute
  useEffect(() => {
    const checkPrayerTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes;

      const prayerTimes = [
        { name: 'Fajr', minutes: 5 * 60 },
        { name: 'Dhuhr', minutes: 12 * 60 + 30 },
        { name: 'Asr', minutes: 15 * 60 + 45 },
        { name: 'Maghrib', minutes: 18 * 60 + 15 },
        { name: 'Isha', minutes: 20 * 60 },
      ];

      prayerTimes.forEach(prayer => {
        if (Math.abs(currentTime - prayer.minutes) <= 1) {
          const todayRecord = records.find(r => r.date === getToday());
          const isCompleted = todayRecord?.prayers[prayer.name as PrayerName];
          if (!isCompleted && soundEnabled && notificationsEnabled) {
            playPrayerReminderSound();
            setPrayerReminder(prayer.name);
            setTimeout(() => setPrayerReminder(null), 5000);
          }
        }
      });
    };

    const interval = setInterval(checkPrayerTime, 60000);
    return () => clearInterval(interval);
  }, [soundEnabled, notificationsEnabled, records]);

  const today = getToday();
  const todayRecord = records.find(r => r.date === today);
  const todayPrayers = todayRecord?.prayers || { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false };
  const todayCompleted = Object.values(todayPrayers).filter(Boolean).length;
  const streak = getStreak(records);

  const togglePrayer = useCallback((prayer: PrayerName) => {
    setAnimatePrayer(prayer);
    setTimeout(() => setAnimatePrayer(null), 500);

    if (soundEnabled) {
      playPrayerCompleteSound();
    }

    setRecords(prev => {
      const existing = prev.find(r => r.date === today);
      let newPrayers: Record<PrayerName, boolean>;
      
      if (existing) {
        newPrayers = { ...existing.prayers, [prayer]: !existing.prayers[prayer] };
      } else {
        newPrayers = { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false, [prayer]: true };
      }

      // Check if goal achieved (all 5 prayers completed)
      const completedCount = Object.values(newPrayers).filter(Boolean).length;
      const wasCompleted = Object.values(todayPrayers).filter(Boolean).length;
      
      if (completedCount === 5 && wasCompleted < 5) {
        // Goal just achieved!
        if (soundEnabled) {
          setTimeout(() => playGoalAchievedSound(), 300);
        }
        setTimeout(() => setShowGoalModal(true), 500);
      }

      if (existing) {
        return prev.map(r =>
          r.date === today ? { ...r, prayers: newPrayers } : r
        );
      }
      return [...prev, { date: today, prayers: newPrayers }];
    });
  }, [soundEnabled, today, todayPrayers]);

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

  const monthCompletion = monthDates.reduce((acc, date) => acc + getDayCompletion(date), 0);
  const monthTotal = monthDates.length * 5;
  const monthPercentage = monthTotal > 0 ? Math.round((monthCompletion / monthTotal) * 100) : 0;

  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  };

  // Theme classes
  const themeClasses = theme === 'dark' 
    ? {
        bg: 'bg-[#00160D]',
        bgSecondary: 'bg-[#003D2B]/60',
        bgTertiary: 'bg-[#003D2B]/40',
        bgInput: 'bg-[#00160D]',
        border: 'border-[#005A3C]/30',
        borderHover: 'hover:border-[#005A3C]/60',
        text: 'text-white',
        textSecondary: 'text-emerald-300/70',
        textMuted: 'text-emerald-300/50',
        textFaint: 'text-emerald-300/30',
        gold: 'text-[#D4AF37]',
        cardPrayer: 'bg-[#003D2B]/40 border-[#005A3C]/30',
        cardPrayerActive: 'bg-[#005A3C]/40 border-[#D4AF37]/50',
        headerGradient: 'from-[#003D2B] to-transparent',
        pattern: 'star-pattern',
      }
    : {
        bg: 'bg-[#f0f7f4]',
        bgSecondary: 'bg-white/80',
        bgTertiary: 'bg-white/60',
        bgInput: 'bg-white',
        border: 'border-[#005A3C]/20',
        borderHover: 'hover:border-[#005A3C]/40',
        text: 'text-[#00160D]',
        textSecondary: 'text-[#003D2B]/70',
        textMuted: 'text-[#003D2B]/50',
        textFaint: 'text-[#003D2B]/30',
        gold: 'text-[#B8860B]',
        cardPrayer: 'bg-white/60 border-[#005A3C]/20',
        cardPrayerActive: 'bg-[#005A3C]/10 border-[#D4AF37]/50',
        headerGradient: 'from-[#005A3C]/20 to-transparent',
        pattern: 'star-pattern-light',
      };

  const tc = themeClasses;

  return (
    <div className={`min-h-screen ${tc.bg} ${tc.pattern} ${tc.text} transition-colors duration-300`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${tc.headerGradient} opacity-80`}></div>
        <div className="relative max-w-lg mx-auto px-4 pt-6 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold golden-text">{t(lang, 'title')}</h1>
              <p className={`${tc.textSecondary} text-sm mt-0.5`}>{t(lang, 'subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Settings Button */}
              <button
                onClick={() => { setShowSettings(!showSettings); if (soundEnabled) playClickSound(); }}
                className={`w-10 h-10 rounded-full ${tc.bgSecondary} border ${tc.border} flex items-center justify-center transition-all hover:scale-105`}
              >
                <span className="text-lg">⚙️</span>
              </button>
              {/* Theme Toggle */}
              <button
                onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); if (soundEnabled) playClickSound(); }}
                className={`w-10 h-10 rounded-full ${tc.bgSecondary} border ${tc.border} flex items-center justify-center transition-all hover:scale-105`}
              >
                <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className={`${tc.bgSecondary} rounded-xl p-3 text-center border ${tc.border} backdrop-blur-sm`}>
              <p className={`text-xl font-bold ${tc.gold}`}>{todayCompleted}/5</p>
              <p className={`text-xs ${tc.textMuted} mt-1`}>{t(lang, 'today')}</p>
            </div>
            <div className={`${tc.bgSecondary} rounded-xl p-3 text-center border ${tc.border} backdrop-blur-sm`}>
              <p className={`text-xl font-bold ${tc.gold}`}>{streak}</p>
              <p className={`text-xs ${tc.textMuted} mt-1`}>{t(lang, 'dayStreak')}</p>
            </div>
            <div className={`${tc.bgSecondary} rounded-xl p-3 text-center border ${tc.border} backdrop-blur-sm`}>
              <p className={`text-xl font-bold ${tc.gold}`}>{monthPercentage}%</p>
              <p className={`text-xs ${tc.textMuted} mt-1`}>{t(lang, 'thisMonth')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`max-w-lg mx-auto px-4 fade-in`}>
          <div className={`${tc.bgSecondary} rounded-xl p-4 border ${tc.border} backdrop-blur-sm mb-4`}>
            <h3 className={`text-sm font-semibold ${tc.gold} mb-3`}>{t(lang, 'settings')}</h3>
            
            {/* Language Selection */}
            <div className="mb-4">
              <label className={`text-xs ${tc.textSecondary} block mb-2`}>{t(lang, 'language')}</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => { setLang(language.code); if (soundEnabled) playClickSound(); }}
                    className={`py-2 px-3 rounded-lg text-sm transition-all ${
                      lang === language.code
                        ? 'golden-gradient text-[#00160D] font-bold'
                        : `${tc.bgTertiary} ${tc.text} border ${tc.border} hover:border-[#D4AF37]/30`
                    }`}
                  >
                    {language.native}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${tc.textSecondary}`}>{t(lang, 'soundEnabled')}</span>
              <button
                onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playClickSound(); }}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  soundEnabled ? 'bg-[#D4AF37]' : tc.bgInput
                } border ${soundEnabled ? 'border-[#D4AF37]' : tc.border}`}
              >
                <div className={`w-4 h-4 rounded-full transition-all absolute top-0.5 ${
                  soundEnabled ? (isRTL ? 'right-0.5' : 'left-0.5') : (isRTL ? 'left-0.5' : 'right-0.5')
                } ${soundEnabled ? 'bg-[#00160D]' : tc.textMuted}`}></div>
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${tc.textSecondary}`}>{t(lang, 'notifications')}</span>
              <button
                onClick={() => { enableNotifications(); if (soundEnabled) playClickSound(); }}
                className={`py-1.5 px-3 rounded-lg text-xs transition-all ${
                  notificationsEnabled
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                    : `${tc.bgTertiary} ${tc.textSecondary} border ${tc.border}`
                }`}
              >
                {notificationsEnabled ? t(lang, 'notificationEnabled') : t(lang, 'enableNotifications')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-lg mx-auto px-4">
        <div className={`flex ${tc.bgTertiary} rounded-xl p-1 border ${tc.border} backdrop-blur-sm`}>
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setView(tab); if (soundEnabled) playClickSound(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                view === tab
                  ? 'bg-[#005A3C] text-[#D4AF37] shadow-md'
                  : `${tc.textMuted} hover:${tc.textSecondary}`
              }`}
            >
              {t(lang, tab)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-5">
        {view === 'today' && (
          <div className="fade-in space-y-3">
            {/* Progress Bar */}
            <div className={`${tc.bgSecondary} rounded-xl p-4 border ${tc.border} card-glow backdrop-blur-sm`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm ${tc.textSecondary}`}>{t(lang, 'todayProgress')}</span>
                <span className={`text-sm font-bold ${tc.gold}`}>{todayCompleted * 20}%</span>
              </div>
              <div className={`h-2 ${tc.bgInput} rounded-full overflow-hidden`}>
                <div
                  className="h-full golden-gradient rounded-full transition-all duration-500"
                  style={{ width: `${todayCompleted * 20}%` }}
                ></div>
              </div>
              <p className={`text-xs ${tc.textMuted} mt-2`}>
                {todayCompleted === 5
                  ? t(lang, 'allCompleted')
                  : `${5 - todayCompleted} ${t(lang, 'remaining')}`}
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
                      ? tc.cardPrayerActive
                      : `${tc.cardPrayer} ${tc.borderHover}`
                  } ${isAnimating ? 'prayer-complete' : ''} backdrop-blur-sm`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                      isCompleted
                        ? 'golden-gradient shadow-lg shadow-[#D4AF37]/20'
                        : `${tc.bgInput} border ${tc.border}`
                    }`}
                  >
                    {isCompleted ? '✓' : prayer.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-semibold ${isCompleted ? tc.gold : tc.text}`}>
                      {getPrayerTranslation(lang, prayer.name)}
                    </h3>
                    <p className={`text-xs ${tc.textMuted}`}>{prayer.time}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                        : `${tc.border}`
                    }`}
                  >
                    {isCompleted && (
                      <svg className={`w-3 h-3 ${tc.gold}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
            <div className={`${tc.bgSecondary} rounded-xl p-4 border ${tc.border} card-glow backdrop-blur-sm`}>
              <h3 className={`text-sm ${tc.textSecondary} mb-3`}>{t(lang, 'weeklyOverview')}</h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                  const completion = getDayCompletion(date);
                  const isToday = date === today;
                  return (
                    <div key={date} className="flex flex-col items-center">
                      <span className={`text-xs mb-1 ${isToday ? `${tc.gold} font-bold` : tc.textMuted}`}>
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
                            : `${tc.bgInput} ${tc.textFaint} border ${tc.border}`
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
                    className={`${tc.bgTertiary} rounded-xl p-3 border transition-all backdrop-blur-sm ${
                      isToday ? 'border-[#D4AF37]/30 card-glow' : tc.border
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isToday ? tc.gold : tc.text}`}>
                          {DAYS[index]}
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-full">
                            {t(lang, 'today')}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${tc.textMuted}`}>{completion}/5</span>
                    </div>
                    <div className="flex gap-1.5">
                      {PRAYERS.map((prayer) => {
                        const completed = getPrayerStatus(date, prayer.name);
                        return (
                          <div
                            key={prayer.name}
                            className={`flex-1 h-2 rounded-full transition-all ${
                              completed ? 'bg-[#D4AF37]' : tc.bgInput
                            }`}
                            title={`${getPrayerTranslation(lang, prayer.name)}: ${completed ? t(lang, 'completed') : t(lang, 'missed')}`}
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
            {/* Monthly Progress Circle */}
            <div className={`${tc.bgSecondary} rounded-xl p-5 border ${tc.border} card-glow text-center backdrop-blur-sm`}>
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke={theme === 'dark' ? '#00160D' : '#e0e0e0'} strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="url(#goldGradient)" strokeWidth="8" strokeLinecap="round"
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
                  <span className={`text-2xl font-bold ${tc.gold}`}>{monthPercentage}%</span>
                </div>
              </div>
              <p className={`text-sm ${tc.textSecondary}`}>{t(lang, 'monthlyCompletion')}</p>
              <p className={`text-xs ${tc.textMuted} mt-1`}>{monthCompletion} / {monthTotal}</p>
            </div>

            {/* Calendar Grid */}
            <div className={`${tc.bgSecondary} rounded-xl p-4 border ${tc.border} backdrop-blur-sm`}>
              <h3 className={`text-sm ${tc.textSecondary} mb-3`}>
                {new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : lang === 'ta' ? 'ta-IN' : lang === 'ml' ? 'ml-IN' : 'en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map(day => (
                  <div key={day} className={`text-center text-[10px] ${tc.textFaint} py-1`}>{day}</div>
                ))}
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() || 6 }).map((_, i) => (
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
                          : tc.textFaint
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
              <div className={`${tc.bgSecondary} rounded-xl p-4 border ${tc.border} text-center backdrop-blur-sm`}>
                <p className={`text-2xl font-bold ${tc.gold}`}>
                  {records.filter(r => {
                    const d = new Date(r.date);
                    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                  }).reduce((acc, r) => acc + Object.values(r.prayers).filter(Boolean).length, 0)}
                </p>
                <p className={`text-xs ${tc.textMuted} mt-1`}>{t(lang, 'totalPrayers')}</p>
              </div>
              <div className={`${tc.bgSecondary} rounded-xl p-4 border ${tc.border} text-center backdrop-blur-sm`}>
                <p className={`text-2xl font-bold ${tc.gold}`}>
                  {records.filter(r => {
                    const d = new Date(r.date);
                    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                  }).filter(r => Object.values(r.prayers).every(v => v)).length}
                </p>
                <p className={`text-xs ${tc.textMuted} mt-1`}>{t(lang, 'perfectDays')}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Prayer Reminder Toast */}
      {prayerReminder && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 fade-in">
          <div className="bg-[#005A3C] border border-[#D4AF37]/50 rounded-xl px-5 py-3 shadow-xl flex items-center gap-3">
            <span className="text-2xl">🕌</span>
            <div>
              <p className="text-[#D4AF37] font-semibold text-sm">{t(lang, 'prayerReminder')}</p>
              <p className="text-white text-xs">{getPrayerTranslation(lang, prayerReminder as PrayerName)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Goal Achieved Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className={`${theme === 'dark' ? 'bg-[#003D2B]' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full border border-[#D4AF37]/30 card-glow text-center`}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className={`text-xl font-bold ${tc.gold} mb-2`}>{t(lang, 'goalAchieved')}</h2>
            <p className={`${tc.textSecondary} text-sm mb-5`}>{t(lang, 'goalMessage')}</p>
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-8 h-8 rounded-full golden-gradient flex items-center justify-center text-[#00160D] text-xs font-bold shadow-md">
                  ✓
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowGoalModal(false); if (soundEnabled) playClickSound(); }}
              className="golden-gradient text-[#00160D] font-bold py-2.5 px-6 rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              {t(lang, 'close')}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className={`text-xs ${tc.textFaint}`}>
          {t(lang, 'bismillah')}
        </p>
        <p className={`text-[10px] ${tc.textFaint} mt-1`}>
          {t(lang, 'quranVerse')}
        </p>
      </footer>
    </div>
  );
}
