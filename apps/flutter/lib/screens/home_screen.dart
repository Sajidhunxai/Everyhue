import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_button.dart';
import '../widgets/brand_logo.dart';
import 'login_screen.dart';
import 'shell_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiClient();
  bool _loading = true;
  String? _error;
  dynamic _stats;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    if (auth.accessToken == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final stats = await _api.fetchDashboard(auth.accessToken!);
      if (mounted) setState(() => _stats = stats);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    if (!auth.ready) {
      return const Center(child: CircularProgressIndicator());
    }

    if (auth.user == null) {
      return _GuestHome(onSignIn: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
          ));
    }

    final firstName = auth.user!.name?.split(' ').first;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'YOUR DASHBOARD',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppTheme.primary,
                  letterSpacing: 1,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Hello${firstName != null ? ', $firstName' : ''}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            _stats?.latestSeason != null
                ? 'Latest season: ${_stats!.latestSeason}. Pick up where you left off.'
                : 'Upload your first photo to discover your seasonal palette.',
          ),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(_error!, style: const TextStyle(color: AppTheme.danger)),
            ),
          if (_stats != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                _StatCard(label: 'Analyses', value: '${_stats!.analysisCount}'),
                const SizedBox(width: 8),
                _StatCard(label: 'Wardrobe', value: '${_stats!.wardrobeCount}'),
                const SizedBox(width: 8),
                _StatCard(label: 'Profiles', value: '${_stats!.profileCount}'),
              ],
            ),
          ],
          const SizedBox(height: 16),
          AppButton(
            label: _stats != null && _stats!.analysisCount > 0
                ? 'New analysis'
                : 'Start analyzing',
            onPressed: () => TabControllerProvider.of(context).animateTo(1),
          ),
          const SizedBox(height: 24),
          Text(
            'QUICK LINKS',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppTheme.muted,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          ..._quickLinks.map((l) => _QuickLinkCard(link: l)),
          const SizedBox(height: 24),
          AppButton(
            label: 'Sign out',
            variant: AppButtonVariant.ghost,
            onPressed: () => auth.signOut(),
          ),
        ],
      ),
    );
  }
}

const _quickLinks = [
  _QuickLink(title: 'Compare', desc: 'Best-lit photo', tab: 2),
  _QuickLink(title: 'Shop', desc: 'Colors for you', tab: 3),
  _QuickLink(title: 'Wardrobe', desc: 'Saved colors', tab: 4),
  _QuickLink(title: 'Family', desc: 'Household profiles', tab: 5),
  _QuickLink(title: 'Stylist', desc: 'Outfit advice', tab: 6),
];

class _QuickLink {
  const _QuickLink({required this.title, required this.desc, required this.tab});
  final String title;
  final String desc;
  final int tab;
}

class _QuickLinkCard extends StatelessWidget {
  const _QuickLinkCard({required this.link});
  final _QuickLink link;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surface,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(link.title, style: const TextStyle(color: AppTheme.ink)),
        subtitle: Text(link.desc),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.muted),
        onTap: () {
          TabControllerProvider.of(context).animateTo(link.tab);
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.line),
        ),
        child: Column(
          children: [
            Text(value, style: const TextStyle(color: AppTheme.ink, fontSize: 22, fontWeight: FontWeight.w700)),
            Text(label.toUpperCase(), style: const TextStyle(color: AppTheme.muted, fontSize: 10, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _GuestHome extends StatelessWidget {
  const _GuestHome({required this.onSignIn});
  final VoidCallback onSignIn;

  static const _swatches = [
    Color(0xFF7B9FD4),
    Color(0xFFE8A87C),
    Color(0xFF9BC4A8),
    Color(0xFFB8A8C8),
    Color(0xFFE07A7A),
    Color(0xFFF5F3F0),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const BrandLogo(size: LogoSize.lg),
        const SizedBox(height: 8),
        Text(AppTheme.tagline, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 12),
        const Text(
          'Discover your seasonal palette from a daylight photo. Sign in to save results across devices.',
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _swatches
              .map((c) => Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: c,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.line),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 24),
        AppButton(label: 'Sign in to get started', onPressed: onSignIn),
      ],
    );
  }
}
