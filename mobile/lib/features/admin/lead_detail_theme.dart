import 'package:flutter/material.dart';
import 'package:hsdash_mobile/features/admin/admin_home_theme.dart';

/// Premium CRM visual tokens — Attio / Linear / Mercury inspired.
abstract final class LeadDetailPalette {
  static const background = Color(0xFFF7F8FC);
  static const backgroundTop = Color(0xFFFAFBFF);
  static const backgroundBottom = Color(0xFFF4F6FC);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFE8EAF2);
  static const text = Color(0xFF111827);
  static const textSecondary = Color(0xFF6B7280);
  static const labelColor = Color(0xFF8B95A7);
  static const accent = Color(0xFF8B5CF6);
  static const accentSoft = Color(0xFFF3EEFF);
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const mutedFill = Color(0xFFF4F6FC);

  static const cardRadius = 20.0;
  static const pagePaddingH = 24.0;
  static const sectionGap = 28.0;

  static LinearGradient get pageGradient => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [backgroundTop, backgroundBottom],
      );

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: text.withValues(alpha: 0.04),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: text.withValues(alpha: 0.02),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static TextStyle get leadName => AdminHomeTypography.inter(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: text,
        height: 1.15,
      );

  static TextStyle get sectionTitle => AdminHomeTypography.inter(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.2,
        color: textSecondary,
      );

  static TextStyle get fieldLabel => AdminHomeTypography.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: labelColor,
      );

  static TextStyle get fieldValue => AdminHomeTypography.inter(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: text,
        height: 1.35,
      );

  static TextStyle get body => AdminHomeTypography.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: text,
        height: 1.45,
      );

  static TextStyle get meta => AdminHomeTypography.inter(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: textSecondary,
        height: 1.4,
      );

  static TextStyle get caption => AdminHomeTypography.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: labelColor,
        letterSpacing: 0.2,
      );

  static TextStyle get quotationValue => AdminHomeTypography.inter(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: text,
        height: 1.25,
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
