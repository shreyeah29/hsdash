import 'package:flutter/material.dart';
import 'package:hsdash_mobile/config/premium_light_design_system.dart';

/// Premium CRM visual tokens — warm luxury light.
abstract final class LeadDetailPalette {
  static const background = PremiumLight.background;
  static const backgroundTop = PremiumLight.background;
  static const backgroundBottom = PremiumLight.surface;
  static const surface = PremiumLight.card;
  static const border = PremiumLight.border;
  static const text = PremiumLight.textPrimary;
  static const textSecondary = PremiumLight.textSecondary;
  static const labelColor = PremiumLight.textMuted;
  static const accent = PremiumLight.accent;
  static const accentSecondary = PremiumLight.accentSecondary;
  static const accentSoft = PremiumLight.secondaryButton;
  static const success = PremiumLight.success;
  static const warning = PremiumLight.warning;
  static const danger = PremiumLight.error;
  static const mutedFill = PremiumLight.surface;

  static const cardRadius = PremiumLight.radiusCard;
  static const pagePaddingH = 24.0;
  static const sectionGap = PremiumLight.sectionGap;

  static LinearGradient get pageGradient => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [backgroundTop, backgroundBottom],
      );

  static List<BoxShadow> get cardShadow => PremiumLight.cardShadow;

  static TextStyle get leadName => PremiumLight.pageTitle.copyWith(fontSize: 28);

  static TextStyle get sectionTitle => PremiumLight.label.copyWith(
        fontSize: 12,
        color: textSecondary,
      );

  static TextStyle get fieldLabel => PremiumLight.caption.copyWith(fontSize: 12);

  static TextStyle get fieldValue => PremiumLight.cardTitle.copyWith(fontSize: 16);

  static TextStyle get body => PremiumLight.body.copyWith(fontSize: 15);

  static TextStyle get meta => PremiumLight.bodySecondary;

  static TextStyle get caption => PremiumLight.caption;

  static TextStyle get quotationValue => PremiumLight.cardTitle.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      );

  static InputDecoration borderlessField({required String hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: meta.copyWith(color: labelColor),
      filled: false,
      border: InputBorder.none,
      enabledBorder: InputBorder.none,
      focusedBorder: InputBorder.none,
      disabledBorder: InputBorder.none,
      errorBorder: InputBorder.none,
      focusedErrorBorder: InputBorder.none,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
      isDense: true,
    );
  }
}

/// Subtle top-to-bottom gradient behind scroll content.
class LeadDetailBackground extends StatelessWidget {
  const LeadDetailBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(gradient: LeadDetailPalette.pageGradient),
      child: child,
    );
  }
}

class LeadSectionHeader extends StatelessWidget {
  const LeadSectionHeader({super.key, required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Text(title.toUpperCase(), style: LeadDetailPalette.sectionTitle),
          if (trailing != null) ...[const Spacer(), trailing!],
        ],
      ),
    );
  }
}

/// Premium card — soft shadow, light border, generous radius.
class LeadDetailSurface extends StatelessWidget {
  const LeadDetailSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.radius = LeadDetailPalette.cardRadius,
  });

  final Widget child;
  final EdgeInsets padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: LeadDetailPalette.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: LeadDetailPalette.border.withValues(alpha: 0.85)),
        boxShadow: LeadDetailPalette.cardShadow,
      ),
      child: child,
    );
  }
}

class LeadMessageCallout extends StatelessWidget {
  const LeadMessageCallout({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
      decoration: BoxDecoration(
        color: LeadDetailPalette.mutedFill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: LeadDetailPalette.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('FROM ENQUIRY', style: LeadDetailPalette.caption.copyWith(letterSpacing: 1.1, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(message, style: LeadDetailPalette.body.copyWith(fontWeight: FontWeight.w400)),
        ],
      ),
    );
  }
}

class LeadNoteComposer extends StatelessWidget {
  const LeadNoteComposer({
    super.key,
    required this.controller,
    required this.busy,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return LeadDetailSurface(
      padding: const EdgeInsets.fromLTRB(18, 8, 8, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              minLines: 1,
              maxLines: 4,
              style: LeadDetailPalette.body,
              cursorColor: LeadDetailPalette.accent,
              textInputAction: TextInputAction.send,
              decoration: LeadDetailPalette.borderlessField(hint: 'Write a follow-up note…'),
              onSubmitted: (_) => onSubmit(),
            ),
          ),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: busy ? null : onSubmit,
              borderRadius: BorderRadius.circular(999),
              child: Ink(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: busy ? LeadDetailPalette.border : LeadDetailPalette.accent,
                  boxShadow: busy
                      ? null
                      : [
                          BoxShadow(
                            color: LeadDetailPalette.accent.withValues(alpha: 0.28),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                ),
                child: const Icon(Icons.arrow_upward_rounded, size: 18, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LeadNoteBubble extends StatelessWidget {
  const LeadNoteBubble({
    super.key,
    required this.author,
    required this.time,
    required this.content,
  });

  final String author;
  final String time;
  final String content;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$author · $time', style: LeadDetailPalette.caption),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: BoxDecoration(
              color: LeadDetailPalette.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: LeadDetailPalette.border.withValues(alpha: 0.7)),
              boxShadow: [
                BoxShadow(
                  color: LeadDetailPalette.text.withValues(alpha: 0.025),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Text(content, style: LeadDetailPalette.body.copyWith(fontWeight: FontWeight.w400)),
          ),
        ],
      ),
    );
  }
}
