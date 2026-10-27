import { useState } from 'react';
import { Language, t } from './translations';

interface FlutterGuideProps {
  lang: Language;
  theme: 'dark' | 'light';
  onClose: () => void;
}

const flutterCode = `// pubspec.yaml dependencies
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.4.2
  shared_preferences: ^2.2.2
  flutter_local_notifications: ^17.0.0
  audioplayers: ^5.2.1
  provider: ^6.1.1

// lib/main.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SalahTrackerApp());
}

class SalahTrackerApp extends StatefulWidget {
  const SalahTrackerApp({super.key});
  @override
  State<SalahTrackerApp> createState() => _SalahTrackerAppState();
}

class _SalahTrackerAppState extends State<SalahTrackerApp> {
  ThemeMode _themeMode = ThemeMode.dark;
  String _language = 'en';

  // Custom color scheme matching the web app
  static const Color darkGreen900 = Color(0xFF00160D);
  static const Color darkGreen700 = Color(0xFF003D2B);
  static const Color darkGreen500 = Color(0xFF005A3C);
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFF4D03F);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Salah Tracker',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: darkGreen900,
        colorScheme: ColorScheme.dark(
          primary: gold,
          secondary: darkGreen500,
          surface: darkGreen700,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: darkGreen700,
          foregroundColor: gold,
        ),
      ),
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFf0f7f4),
        colorScheme: ColorScheme.light(
          primary: const Color(0xFFB8860B),
          secondary: darkGreen500,
          surface: Colors.white,
        ),
      ),
      home: SalahTrackerHome(
        themeMode: _themeMode,
        language: _language,
        onThemeChanged: (mode) => setState(() => _themeMode = mode),
        onLanguageChanged: (lang) => setState(() => _language = lang),
      ),
    );
  }
}

class SalahTrackerHome extends StatefulWidget {
  final ThemeMode themeMode;
  final String language;
  final ValueChanged<ThemeMode> onThemeChanged;
  final ValueChanged<String> onLanguageChanged;

  const SalahTrackerHome({
    super.key,
    required this.themeMode,
    required this.language,
    required this.onThemeChanged,
    required this.onLanguageChanged,
  });

  @override
  State<SalahTrackerHome> createState() => _SalahTrackerHomeState();
}

class _SalahTrackerHomeState extends State<SalahTrackerHome> {
  int _currentIndex = 0;
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  @override
  void initState() {
    super.initState();
    _initNotifications();
  }

  Future<void> _initNotifications() async {
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );
    await _notifications.initialize(settings);
  }

  // Prayer data model
  static const List<Map<String, dynamic>> prayers = [
    {'name': 'Fajr', 'time': '5:00 AM', 'icon': '🌅'},
    {'name': 'Dhuhr', 'time': '12:30 PM', 'icon': '☀️'},
    {'name': 'Asr', 'time': '3:45 PM', 'icon': '🌤️'},
    {'name': 'Maghrib', 'time': '6:15 PM', 'icon': '🌅'},
    {'name': 'Isha', 'time': '8:00 PM', 'icon': '🌙'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          TodayView(prayers: prayers),
          WeekView(prayers: prayers),
          MonthView(prayers: prayers),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: Theme.of(context).colorScheme.surface,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.today), label: 'Today'),
          NavigationDestination(icon: Icon(Icons.calendar_week), label: 'Week'),
          NavigationDestination(icon: Icon(Icons.calendar_month), label: 'Month'),
        ],
      ),
    );
  }
}

// Today's prayer tracking view
class TodayView extends StatelessWidget {
  final List<Map<String, dynamic>> prayers;
  const TodayView({super.key, required this.prayers});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 140,
          floating: false,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            title: const Text('Salah Tracker',
                style: TextStyle(fontWeight: FontWeight.bold)),
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: isDark
                      ? [SalahTrackerApp.darkGreen700, SalahTrackerApp.darkGreen900]
                      : [SalahTrackerApp.darkGreen500.withOpacity(0.2),
                         const Color(0xFFf0f7f4)],
                ),
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => PrayerCard(
                prayer: prayers[index],
                isDark: isDark,
              ),
              childCount: prayers.length,
            ),
          ),
        ),
      ],
    );
  }
}

class PrayerCard extends StatefulWidget {
  final Map<String, dynamic> prayer;
  final bool isDark;
  const PrayerCard({super.key, required this.prayer, required this.isDark});

  @override
  State<PrayerCard> createState() => _PrayerCardState();
}

class _PrayerCardState extends State<PrayerCard> {
  bool _completed = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: _completed
          ? SalahTrackerApp.darkGreen500.withOpacity(0.4)
          : widget.isDark
              ? SalahTrackerApp.darkGreen700.withOpacity(0.6)
              : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: _completed
              ? SalahTrackerApp.gold.withOpacity(0.5)
              : SalahTrackerApp.darkGreen500.withOpacity(0.3),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: _completed
              ? SalahTrackerApp.gold
              : SalahTrackerApp.darkGreen900,
          child: Text(
            _completed ? '✓' : widget.prayer['icon'],
            style: TextStyle(fontSize: 20),
          ),
        ),
        title: Text(
          widget.prayer['name'],
          style: TextStyle(
            color: _completed ? SalahTrackerApp.gold : null,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(widget.prayer['time']),
        trailing: IconButton(
          icon: Icon(
            _completed ? Icons.check_circle : Icons.circle_outlined,
            color: _completed ? SalahTrackerApp.gold : null,
          ),
          onPressed: () => setState(() => _completed = !_completed),
        ),
      ),
    );
  }
}

// Week and Month views follow similar patterns
class WeekView extends StatelessWidget {
  final List<Map<String, dynamic>> prayers;
  const WeekView({super.key, required this.prayers});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Week View'));
}

class MonthView extends StatelessWidget {
  final List<Map<String, dynamic>> prayers;
  const MonthView({super.key, required this.prayers});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Month View'));
}`;

const webViewCode = `// Option 2: Embed the web app in Flutter WebView
// This loads the hosted Salah Tracker web app

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SalahWebView extends StatefulWidget {
  const SalahWebView({super.key});
  @override
  State<SalahWebView> createState() => _SalahWebViewState();
}

class _SalahWebViewState extends State<SalahWebView> {
  late final WebViewController controller;
  String _language = 'en';
  String _theme = 'dark';

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          return NavigationDecision.navigate;
        },
        onPageFinished: (url) {
          // Inject theme and language settings
          _applySettings();
        },
      ))
      ..loadRequest(Uri.parse('https://your-salah-tracker-url.com'));
  }

  void _applySettings() {
    controller.runJavaScript(
      'window.postMessage({theme: "' + _theme + '"}, "*");' +
      'localStorage.setItem("salah-lang", "' + _language + '");' +
      'localStorage.setItem("salah-theme", "' + _theme + '");' +
      'location.reload();'
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Salah Tracker'),
        actions: [
          // Language selector
          PopupMenuButton<String>(
            onSelected: (lang) {
              setState(() => _language = lang);
              _applySettings();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'en', child: Text('English')),
              const PopupMenuItem(value: 'ta', child: Text('தமிழ்')),
              const PopupMenuItem(value: 'ml', child: Text('മലയാളം')),
              const PopupMenuItem(value: 'ar', child: Text('العربية')),
            ],
          ),
          // Theme toggle
          IconButton(
            icon: Icon(_theme == 'dark' ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              setState(() => _theme = _theme == 'dark' ? 'light' : 'dark');
              _applySettings();
            },
          ),
        ],
      ),
      body: WebViewWidget(controller: controller),
    );
  }
}`;

const nativeBridgeCode = `// Option 3: Native Bridge for Flutter ↔ Web Communication
// Allows Flutter to control the web app and receive events

// JavaScript channel for Flutter ↔ Web communication
class SalahBridge {
  final WebViewController controller;
  
  SalahBridge(this.controller) {
    _setupChannels();
  }

  void _setupChannels() {
    controller.addJavaScriptChannel(
      'SalahTracker',
      onMessageReceived: (message) {
        _handleMessage(message.message);
      },
    );
  }

  void _handleMessage(String jsonMessage) {
    try {
      final data = jsonDecode(jsonMessage);
      switch (data['type']) {
        case 'prayer_completed':
          _onPrayerCompleted(data['prayer'], data['date']);
          break;
        case 'goal_achieved':
          _onGoalAchieved(data['date']);
          break;
        case 'prayer_time':
          _onPrayerTime(data['prayer']);
          break;
      }
    } catch (e) {
      debugPrint('Bridge error: $e');
    }
  }

  void _onPrayerCompleted(String prayer, String date) {
    // Trigger Flutter-side sound or haptic feedback
    HapticFeedback.mediumImpact();
    // Play native sound
    _playSound('prayer_complete.mp3');
  }

  void _onGoalAchieved(String date) {
    // Show native celebration
    HapticFeedback.heavyImpact();
    _playSound('goal_achieved.mp3');
    _showCelebrationNotification();
  }

  void _onPrayerTime(String prayer) {
    // Show local notification
    _showPrayerNotification(prayer);
  }

  // Send data from Flutter to Web
  void sendToWeb(String method, Map<String, dynamic> data) {
    final jsonStr = jsonEncode(data);
    controller.runJavaScript(
      'window.dispatchEvent(new CustomEvent("' + method + '", {detail: ' + jsonStr + '}))'
    );
  }
}

// Add this to your web app's JavaScript:
// window.SalahTracker.postMessage(JSON.stringify({
//   type: 'prayer_completed',
//   prayer: 'Fajr',
//   date: '2024-01-15'
// }));`;

export default function FlutterGuide({ lang, theme, onClose }: FlutterGuideProps) {
  const [activeTab, setActiveTab] = useState<'native' | 'webview' | 'bridge'>('native');
  const [copied, setCopied] = useState(false);

  const isDark = theme === 'dark';

  const getActiveCode = () => {
    switch (activeTab) {
      case 'native': return flutterCode;
      case 'webview': return webViewCode;
      case 'bridge': return nativeBridgeCode;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tc = isDark 
    ? {
        bg: 'bg-[#00160D]',
        bgSecondary: 'bg-[#003D2B]/80',
        bgTertiary: 'bg-[#003D2B]/50',
        border: 'border-[#005A3C]/30',
        text: 'text-white',
        textSecondary: 'text-emerald-300/70',
        textMuted: 'text-emerald-300/50',
        gold: 'text-[#D4AF37]',
        codeBg: 'bg-[#00160D]',
      }
    : {
        bg: 'bg-[#f0f7f4]',
        bgSecondary: 'bg-white/90',
        bgTertiary: 'bg-white/70',
        border: 'border-[#005A3C]/20',
        text: 'text-[#00160D]',
        textSecondary: 'text-[#003D2B]/70',
        textMuted: 'text-[#003D2B]/50',
        gold: 'text-[#B8860B]',
        codeBg: 'bg-[#f8f8f0]',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className={`${tc.bg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border ${tc.border} card-glow flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${tc.border}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl golden-gradient flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${tc.gold}`}>
                {lang === 'ta' ? 'Flutter ஒருங்கிணைப்பு' :
                 lang === 'ml' ? 'ഫ്ലട്ടർ ഏകീകരണം' :
                 lang === 'ar' ? 'تكامل فلاتر' :
                 'Flutter Integration'}
              </h2>
              <p className={`text-xs ${tc.textMuted}`}>
                {lang === 'ta' ? 'இந்த வலைப் பயன்பாட்டை Flutter இல் பயன்படுத்தவும்' :
                 lang === 'ml' ? 'ഈ വെബ് ആപ്പ് Flutter-ൽ ഉപയോഗിക്കുക' :
                 lang === 'ar' ? 'استخدم تطبيق الويب في فلاتر' :
                 'Use this web app in your Flutter project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full ${tc.bgTertiary} border ${tc.border} flex items-center justify-center hover:opacity-80`}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${tc.border} px-4`}>
          {[
            { key: 'native' as const, label: lang === 'ar' ? 'أصلي' : lang === 'ta' ? 'நேட்டிவ்' : lang === 'ml' ? 'നേറ്റീവ്' : 'Native' },
            { key: 'webview' as const, label: lang === 'ar' ? 'ويب فيو' : lang === 'ta' ? 'WebView' : lang === 'ml' ? 'WebView' : 'WebView' },
            { key: 'bridge' as const, label: lang === 'ar' ? 'جسر' : lang === 'ta' ? 'பிரிட்ஜ்' : lang === 'ml' ? 'ബ്രിഡ്ജ്' : 'Bridge' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? `${tc.gold} border-[#D4AF37]`
                  : `${tc.textMuted} border-transparent hover:${tc.textSecondary}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className={`px-4 py-3 border-b ${tc.border}`}>
          <p className={`text-xs ${tc.textSecondary}`}>
            {activeTab === 'native' && (lang === 'ta' ? 'Flutter-இல் Salah Tracker-இன் நேட்டிவ் பதிப்பை உருவாக்கவும்' :
              lang === 'ml' ? 'Flutter-ൽ Salah Tracker-ന്റെ നേറ്റീവ് പതിപ്പ് സൃഷ്ടിക്കുക' :
              lang === 'ar' ? 'إنشاء نسخة أصلية من متتبع الصلاة في فلاتر' :
              'Build a native Flutter version of the Salah Tracker with matching theme colors and prayer tracking UI.')}
            {activeTab === 'webview' && (lang === 'ta' ? 'WebView மூலம் Flutter-இல் இந்த வலைப் பயன்பாட்டைப் பதிவு செய்யவும்' :
              lang === 'ml' ? 'WebView വഴി Flutter-ൽ ഈ വെബ് ആപ്പ് എംബെഡ് ചെയ്യുക' :
              lang === 'ar' ? 'تضمين تطبيق الويب في فلاتر عبر WebView' :
              'Embed this web app directly in your Flutter app using WebView with language and theme control.')}
            {activeTab === 'bridge' && (lang === 'ta' ? 'Flutter மற்றும் வலைப் பயன்பாட்டிற்கு இடையே இரும திசை தொடர்பு' :
              lang === 'ml' ? 'Flutter-ഉം വെബ് ആപ്പും തമ്മിലുള്ള ദ്വിദിശ ആശയവിനിമയം' :
              lang === 'ar' ? 'اتصال ثنائي الاتجاه بين فلاتر وتطبيق الويب' :
              'Two-way communication between Flutter and the web app for sounds, haptics, and notifications.')}
          </p>
        </div>

        {/* Code Block */}
        <div className="flex-1 overflow-auto p-4">
          <div className="relative">
            <button
              onClick={copyToClipboard}
              className={`absolute top-2 right-2 z-10 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-[#D4AF37] text-[#00160D]'
                  : `${tc.bgTertiary} ${tc.textMuted} border ${tc.border} hover:border-[#D4AF37]/30`
              }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <pre className={`${tc.codeBg} rounded-xl p-4 overflow-x-auto text-xs leading-relaxed border ${tc.border}`}>
              <code className={`${tc.textSecondary} whitespace-pre`}>
                {getActiveCode()}
              </code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t ${tc.border} flex items-center justify-between`}>
          <p className={`text-[10px] ${tc.textMuted}`}>
            {lang === 'ta' ? 'Flutter 3.x+ உடன் இணக்கமானது' :
             lang === 'ml' ? 'Flutter 3.x+ുമായി പൊരുത്തപ്പെടുന്നു' :
             lang === 'ar' ? 'متوافق مع Flutter 3.x+' :
             'Compatible with Flutter 3.x+'}
          </p>
          <button
            onClick={onClose}
            className="golden-gradient text-[#00160D] font-bold py-2 px-5 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            {lang === 'ta' ? 'மூடு' : lang === 'ml' ? 'അടയ്ക്കുക' : lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
