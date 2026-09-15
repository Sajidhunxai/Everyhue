import 'package:flutter/material.dart';

import '../widgets/brand_logo.dart';
import 'analyze_screen.dart';
import 'home_screen.dart';
import 'placeholder_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 7, vsync: this);
    _tabs.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TabControllerProvider(
      controller: _tabs,
      child: Scaffold(
        appBar: AppBar(
          title: const BrandLogo(size: LogoSize.sm),
        ),
        body: TabBarView(
          controller: _tabs,
          physics: const NeverScrollableScrollPhysics(),
          children: const [
            HomeScreen(),
            AnalyzeScreen(),
            PlaceholderScreen(title: 'Compare'),
            PlaceholderScreen(title: 'Shop'),
            PlaceholderScreen(title: 'Wardrobe'),
            PlaceholderScreen(title: 'Family profiles'),
            PlaceholderScreen(title: 'Stylist'),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tabs.index,
          onDestinationSelected: _tabs.animateTo,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.camera_alt_outlined), selectedIcon: Icon(Icons.camera_alt), label: 'Analyze'),
            NavigationDestination(icon: Icon(Icons.compare_arrows), label: 'Compare'),
            NavigationDestination(icon: Icon(Icons.shopping_bag_outlined), label: 'Shop'),
            NavigationDestination(icon: Icon(Icons.checkroom_outlined), label: 'Wardrobe'),
            NavigationDestination(icon: Icon(Icons.people_outline), label: 'Family'),
            NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), label: 'Stylist'),
          ],
        ),
      ),
    );
  }
}

class TabControllerProvider extends InheritedWidget {
  const TabControllerProvider({
    super.key,
    required this.controller,
    required super.child,
  });

  final TabController controller;

  static TabController of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<TabControllerProvider>();
    assert(provider != null, 'TabControllerProvider not found');
    return provider!.controller;
  }

  @override
  bool updateShouldNotify(TabControllerProvider oldWidget) =>
      controller != oldWidget.controller;
}
