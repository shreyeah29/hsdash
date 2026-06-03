import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';

/// Full-screen hero + overlaid sign-in. Routes: `/login/admin`, `/login/team`.
class LoginChoiceScreen extends StatefulWidget {
  const LoginChoiceScreen({super.key});

  @override
  State<LoginChoiceScreen> createState() => _LoginChoiceScreenState();
}

class _LoginChoiceScreenState extends State<LoginChoiceScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _fade;

  @override
  void initState() {
    super.initState();
    _fade = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..forward();
  }

  @override
  void dispose() {
    _fade.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: appAuthOverlayStyle,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: FadeTransition(
          opacity: CurvedAnimation(parent: _fade, curve: Curves.easeOut),
          child: const _FullScreenLogin(),
        ),
      ),
    );
  }
}

class _FullScreenLogin extends StatelessWidget {
  const _FullScreenLogin();

  static const _heroAsset = 'assets/images/login_hero.png';

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          _heroAsset,
          fit: BoxFit.cover,
          alignment: const Alignment(0, 0.15),
          errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF431407)),
        ),
        // Scrim tuned for warm sunset — readable text without killing the photo
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xB3000000),
                Color(0x33000000),
                Color(0x1A000000),
                Color(0x8C0F0A08),
                Color(0xD9120E0A),
              ],
              stops: [0.0, 0.28, 0.52, 0.78, 1.0],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                const _TopBrand(),
                const Spacer(),
                _GlassSignInPanel(
                  onAdmin: () => context.go('/login/admin'),
                  onTeam: () => context.go('/login/team'),
                ),
                SizedBox(height: 12 + bottom),
                const _FooterNote(),
                SizedBox(height: 8 + bottom),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TopBrand extends StatelessWidget {
  const _TopBrand();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.94),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Center(
            child: Text(
              'HS',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF4338CA),
                letterSpacing: -0.5,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'HS Dash',
          style: TextStyle(
            color: Colors.white,
            fontSize: 34,
            fontWeight: FontWeight.w700,
            letterSpacing: -1,
            height: 1.05,
            shadows: [
              Shadow(color: Color(0x80000000), blurRadius: 16, offset: Offset(0, 4)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Production operations for your studio',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.88),
            fontSize: 16,
            height: 1.4,
            fontWeight: FontWeight.w400,
            shadows: const [
              Shadow(color: Color(0x99000000), blurRadius: 10, offset: Offset(0, 2)),
            ],
          ),
        ),
      ],
    );
  }
}

class _GlassSignInPanel extends StatelessWidget {
  const _GlassSignInPanel({required this.onAdmin, required this.onTeam});

  final VoidCallback onAdmin;
  final VoidCallback onTeam;

  @override
  Widget build(BuildContext context) {
    return FrostedGlass(
      borderRadius: 22,
      blurSigma: 18,
      tint: const Color(0x52000000),
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Sign in',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.95),
              fontSize: 22,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Select your workspace',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.72),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 18),
          _GlassPortalButton(
            icon: Icons.shield_outlined,
            title: 'Admin sign in',
            subtitle: 'Overview · calendar · team',
            onTap: onAdmin,
          ),
          const SizedBox(height: 10),
          _GlassPortalButton(
            icon: Icons.people_outline,
            title: 'Team sign in',
            subtitle: 'Tasks · assignments · alerts',
            onTap: onTeam,
          ),
        ],
      ),
    );
  }
}

class _GlassPortalButton extends StatefulWidget {
  const _GlassPortalButton({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  State<_GlassPortalButton> createState() => _GlassPortalButtonState();
}

class _GlassPortalButtonState extends State<_GlassPortalButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: _pressed
              ? Colors.white.withValues(alpha: 0.22)
              : Colors.white.withValues(alpha: 0.12),
          border: Border.all(
            color: Colors.white.withValues(alpha: _pressed ? 0.45 : 0.28),
          ),
        ),
        child: Row(
          children: [
            Icon(widget.icon, color: Colors.white, size: 22),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    widget.subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.72),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_rounded,
              color: Colors.white.withValues(alpha: 0.85),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

class _FooterNote extends StatelessWidget {
  const _FooterNote();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.lock_outline, size: 13, color: Colors.white.withValues(alpha: 0.55)),
        const SizedBox(width: 6),
        Text(
          'Secure platform · v1.0.0',
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withValues(alpha: 0.55),
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }
}
