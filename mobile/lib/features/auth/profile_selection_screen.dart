import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_controller.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_profile.dart';
import 'package:hsdash_mobile/widgets/hswf_logo.dart';

/// Netflix-style admin workspace picker — same dashboard for every profile.
class ProfileSelectionScreen extends ConsumerStatefulWidget {
  const ProfileSelectionScreen({super.key});

  @override
  ConsumerState<ProfileSelectionScreen> createState() => _ProfileSelectionScreenState();
}

class _ProfileSelectionScreenState extends ConsumerState<ProfileSelectionScreen> with TickerProviderStateMixin {
  late final AnimationController _entrance;
  late final List<Animation<double>> _cardFade;
  late final List<Animation<Offset>> _cardSlide;
  AdminWorkspaceProfile? _pressing;
  AdminWorkspaceProfile? _navigating;

  @override
  void initState() {
    super.initState();
    _entrance = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    const profiles = AdminWorkspaceProfile.values;
    _cardFade = List.generate(profiles.length, (i) {
      final start = 0.12 + i * 0.12;
      final end = (start + 0.45).clamp(0.0, 1.0);
      return CurvedAnimation(
        parent: _entrance,
        curve: Interval(start, end, curve: Curves.easeOutCubic),
      );
    });
    _cardSlide = List.generate(profiles.length, (i) {
      final start = 0.12 + i * 0.12;
      final end = (start + 0.45).clamp(0.0, 1.0);
      return Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero).animate(
        CurvedAnimation(parent: _entrance, curve: Interval(start, end, curve: Curves.easeOutCubic)),
      );
    });
    _entrance.forward();
  }

  @override
  void dispose() {
    _entrance.dispose();
    super.dispose();
  }

  Future<void> _select(AdminWorkspaceProfile profile) async {
    if (_navigating != null) return;
    HapticFeedback.mediumImpact();
    setState(() => _navigating = profile);
    await ref.read(adminWorkspaceProvider.notifier).select(profile);
    if (!mounted) return;
    await Future<void>.delayed(const Duration(milliseconds: 280));
    if (!mounted) return;
    context.go('/admin');
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0A0F),
        body: Stack(
          fit: StackFit.expand,
          children: [
            const _AmbientBackground(),
            SafeArea(
              child: Column(
                children: [
                  FadeTransition(
                    opacity: CurvedAnimation(parent: _entrance, curve: const Interval(0, 0.35, curve: Curves.easeOut)),
                    child: const _Header(),
                  ),
                  const SizedBox(height: 4),
                  Expanded(
                    child: LayoutBuilder(builder: (context, constraints) => _buildVerticalStack(constraints)),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerticalStack(BoxConstraints constraints) {
    const profiles = AdminWorkspaceProfile.values;
    const gap = 10.0;
    final count = profiles.length;
    final totalGap = gap * (count - 1);
    final slotHeight = (constraints.maxHeight - totalGap) / count;
    final cardWidth = math.min(340.0, constraints.maxWidth - 40);

    return Center(
      child: SizedBox(
        width: cardWidth,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < profiles.length; i++) ...[
              SizedBox(
                height: slotHeight,
                width: cardWidth,
                child: FadeTransition(
                  opacity: _cardFade[i],
                  child: SlideTransition(
                    position: _cardSlide[i],
                    child: _ProfileCard(
                      profile: profiles[i],
                      isPressed: _pressing == profiles[i],
                      isNavigating: _navigating == profiles[i],
                      onHighlight: (v) => setState(() => _pressing = v ? profiles[i] : null),
                      onSelect: () => _select(profiles[i]),
                    ),
                  ),
                ),
              ),
              if (i < count - 1) const SizedBox(height: gap),
            ],
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
      child: Column(
        children: [
          const HswfLogo(height: 48, framed: true),
          const SizedBox(height: 14),
          Text(
            'Choose a profile',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.white.withValues(alpha: 0.72),
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _AmbientBackground extends StatelessWidget {
  const _AmbientBackground();

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0F0F18), Color(0xFF1A1028), Color(0xFF0A0A0F)],
            ),
          ),
        ),
        Positioned(
          top: -80,
          left: -60,
          child: _GlowOrb(color: const Color(0xFF7C3AED).withValues(alpha: 0.35), size: 280),
        ),
        Positioned(
          bottom: -100,
          right: -40,
          child: _GlowOrb(color: const Color(0xFF06B6D4).withValues(alpha: 0.22), size: 320),
        ),
        ...List.generate(18, (i) => _FloatingParticle(index: i)),
      ],
    );
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _FloatingParticle extends StatefulWidget {
  const _FloatingParticle({required this.index});

  final int index;

  @override
  State<_FloatingParticle> createState() => _FloatingParticleState();
}

class _FloatingParticleState extends State<_FloatingParticle> with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 4000 + widget.index * 400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rnd = math.Random(widget.index + 7);
    final left = rnd.nextDouble();
    final top = rnd.nextDouble();
    final size = 2.0 + rnd.nextDouble() * 3;

    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        return Positioned(
          left: MediaQuery.sizeOf(context).width * left,
          top: MediaQuery.sizeOf(context).height * (top + _c.value * 0.04),
          child: Opacity(
            opacity: 0.15 + _c.value * 0.25,
            child: child,
          ),
        );
      },
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.5),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class _ProfileCard extends StatefulWidget {
  const _ProfileCard({
    required this.profile,
    required this.isPressed,
    required this.isNavigating,
    required this.onHighlight,
    required this.onSelect,
  });

  final AdminWorkspaceProfile profile;
  final bool isPressed;
  final bool isNavigating;
  final ValueChanged<bool> onHighlight;
  final VoidCallback onSelect;

  @override
  State<_ProfileCard> createState() => _ProfileCardState();
}

class _ProfileCardState extends State<_ProfileCard> {
  static const double _nameGap = 8;
  static const double _avatarRadius = 18;
  static const double _labelHeight = 24;
  static const double _layoutSlack = 6;

  @override
  Widget build(BuildContext context) {
    final accent = Color(widget.profile.glowStart);
    final highlighted = widget.isPressed || widget.isNavigating;
    final scale = widget.isPressed ? 1.05 : (widget.isNavigating ? 1.02 : 1.0);

    return GestureDetector(
      onTapDown: (_) => widget.onHighlight(true),
      onTapUp: (_) {
        widget.onHighlight(false);
        widget.onSelect();
      },
      onTapCancel: () => widget.onHighlight(false),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final reserved = _nameGap + _labelHeight + _layoutSlack;
          final avatarSize = math.min(
            constraints.maxWidth * 0.88,
            constraints.maxHeight - reserved,
          );

          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedScale(
                  scale: scale,
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutBack,
                  child: SizedBox(
                    width: avatarSize,
                    height: avatarSize,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(_avatarRadius),
                        border: Border.all(
                          color: highlighted ? accent : Colors.white.withValues(alpha: 0.45),
                          width: highlighted ? 2.5 : 2,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(_avatarRadius - 2),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            FittedBox(
                              fit: widget.profile.avatarFit,
                              alignment: widget.profile.avatarAlignment,
                              clipBehavior: Clip.hardEdge,
                              child: Transform.scale(
                                scale: widget.profile.avatarZoom,
                                child: Image.asset(
                                  widget.profile.avatarAsset,
                                  filterQuality: FilterQuality.high,
                                  errorBuilder: (_, __, ___) => ColoredBox(
                                    color: Color(widget.profile.glowEnd).withValues(alpha: 0.35),
                                    child: Center(
                                      child: Text(
                                        widget.profile.label[0],
                                        style: const TextStyle(
                                          fontSize: 36,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            if (widget.isNavigating)
                              ColoredBox(
                                color: Colors.black.withValues(alpha: 0.35),
                                child: const Center(
                                  child: SizedBox(
                                    width: 26,
                                    height: 26,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.5,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: _nameGap),
                Text(
                  widget.profile.label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.2,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
