import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Animated square-pixel snowfall — studio admin backdrop.
class PixelSnowBackground extends StatefulWidget {
  const PixelSnowBackground({
    super.key,
    this.color = const Color(0xFFFFFFFF),
    this.flakeSize = 0.01,
    this.minFlakeSize = 1.25,
    this.pixelResolution = 500,
    this.speed = 1.25,
    this.depthFade = 8,
    this.farPlane = 20,
    this.brightness = 1,
    this.gamma = 0.4545,
    this.density = 0.3,
    this.direction = 125,
  });

  final Color color;
  final double flakeSize;
  final double minFlakeSize;
  final int pixelResolution;
  final double speed;
  final double depthFade;
  final double farPlane;
  final double brightness;
  final double gamma;
  final double density;
  final double direction;

  @override
  State<PixelSnowBackground> createState() => _PixelSnowBackgroundState();
}

class _PixelSnowBackgroundState extends State<PixelSnowBackground> with SingleTickerProviderStateMixin {
  late final Ticker _ticker;
  Duration _elapsed = Duration.zero;
  Size? _size;
  List<_SnowFlake>? _flakes;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker((elapsed) {
      setState(() => _elapsed = elapsed);
    })..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _ensureFlakes(Size size) {
    if (_size == size && _flakes != null) return;
    _size = size;

    final grid = widget.pixelResolution;
    final baseCount = grid * grid * widget.density * 0.0012;
    final areaScale = (size.width * size.height) / (390 * 844);
    final count = (baseCount * areaScale).round().clamp(90, 420);

    final random = math.Random(42);
    _flakes = List.generate(count, (_) {
      return _SnowFlake(
        x: random.nextDouble() * size.width,
        y: random.nextDouble() * size.height,
        depth: random.nextDouble(),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: RepaintBoundary(
        child: CustomPaint(
          painter: _PixelSnowPainter(
            flakes: _flakes,
            elapsed: _elapsed,
            size: _size,
            color: widget.color,
            flakeSize: widget.flakeSize,
            minFlakeSize: widget.minFlakeSize,
            speed: widget.speed,
            depthFade: widget.depthFade,
            farPlane: widget.farPlane,
            brightness: widget.brightness,
            gamma: widget.gamma,
            direction: widget.direction,
            onLayout: _ensureFlakes,
          ),
          child: const SizedBox.expand(),
        ),
      ),
    );
  }
}

class _SnowFlake {
  const _SnowFlake({required this.x, required this.y, required this.depth});

  final double x;
  final double y;
  final double depth;
}

class _PixelSnowPainter extends CustomPainter {
  _PixelSnowPainter({
    required this.flakes,
    required this.elapsed,
    required this.size,
    required this.color,
    required this.flakeSize,
    required this.minFlakeSize,
    required this.speed,
    required this.depthFade,
    required this.farPlane,
    required this.brightness,
    required this.gamma,
    required this.direction,
    required this.onLayout,
  });

  final List<_SnowFlake>? flakes;
  final Duration elapsed;
  final Size? size;
  final Color color;
  final double flakeSize;
  final double minFlakeSize;
  final double speed;
  final double depthFade;
  final double farPlane;
  final double brightness;
  final double gamma;
  final double direction;
  final void Function(Size size) onLayout;

  @override
  void paint(Canvas canvas, Size canvasSize) {
    onLayout(canvasSize);
    final particles = flakes;
    if (particles == null || particles.isEmpty) return;

    final seconds = elapsed.inMicroseconds / 1e6;
    final radians = direction * math.pi / 180;
    final dx = math.cos(radians);
    final dy = math.sin(radians);
    final paint = Paint()..style = PaintingStyle.fill;

    for (final flake in particles) {
      final near = 1 - flake.depth;
      final velocity = speed * (0.35 + near * 0.65) * 28;
      final travel = seconds * velocity;

      var x = (flake.x + dx * travel) % canvasSize.width;
      var y = (flake.y + dy * travel) % canvasSize.height;
      if (x < 0) x += canvasSize.width;
      if (y < 0) y += canvasSize.height;

      final side = minFlakeSize + near * flakeSize * canvasSize.width * 0.22;
      final depthAttenuation = (1 - (flake.depth * depthFade / farPlane)).clamp(0.08, 1.0);
      final gammaLift = math.pow(near.clamp(0.0, 1.0), gamma).toDouble();
      final alpha = (brightness * gammaLift * depthAttenuation).clamp(0.04, 0.92);

      paint.color = color.withValues(alpha: alpha);
      canvas.drawRect(Rect.fromLTWH(x, y, side, side), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _PixelSnowPainter oldDelegate) {
    return oldDelegate.elapsed != elapsed ||
        oldDelegate.flakes != flakes ||
        oldDelegate.size != size ||
        oldDelegate.color != color;
  }
}

/// Dark studio base + drifting pixel snow.
class AdminStudioBackdrop extends StatelessWidget {
  const AdminStudioBackdrop({super.key, required this.backgroundColor});

  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(color: backgroundColor),
        const PixelSnowBackground(),
      ],
    );
  }
}
