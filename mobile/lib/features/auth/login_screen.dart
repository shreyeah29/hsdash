import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hsdash_mobile/config/theme.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_controller.dart';
import 'package:hsdash_mobile/features/auth/auth_controller.dart';
import 'package:hsdash_mobile/features/auth/auth_routes.dart';
import 'package:hsdash_mobile/models/user.dart';
import 'package:hsdash_mobile/config/platform_ui.dart';
import 'package:hsdash_mobile/features/auth/auth_screen_background.dart';
import 'package:hsdash_mobile/widgets/hswf_logo.dart';

enum LoginPortal { admin, team }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, required this.portal});

  final LoginPortal portal;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  static const _adminBg = 'assets/images/login_admin_bg.jpg';
  static const _teamBg = 'assets/images/login_team_bg.jpg';

  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  bool get _isAdmin => widget.portal == LoginPortal.admin;

  /// `emmanuel@wedding.local` → `emmanuel` for legacy logins.
  static String _loginIdentifier(String raw) {
    final trimmed = raw.trim();
    if (trimmed.contains('@')) return trimmed.split('@').first.trim().toLowerCase();
    return trimmed.toLowerCase();
  }

  Color get _accent => _isAdmin ? AppColors.violet : AppColors.emerald;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final ok = await ref.read(authControllerProvider.notifier).login(
          _loginIdentifier(_username.text),
          _password.text,
          expectedRole: _isAdmin ? UserRole.admin : null,
          teamPortal: !_isAdmin,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) {
      final user = ref.read(authControllerProvider).user;
      if (user == null) return;
      if (user.role == UserRole.admin) {
        await ref.read(adminWorkspaceProvider.notifier).restore();
        final profile = ref.read(adminWorkspaceProvider);
        if (!mounted) return;
        context.go(profile != null ? '/admin' : '/admin/profiles');
      } else {
        context.go(homeRouteFor(user));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final error = ref.watch(authControllerProvider.select((s) => s.error));

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: appAuthOverlayStyle,
      child: Scaffold(
        backgroundColor: Colors.black,
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
          toolbarHeight: 44,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
            onPressed: () => context.go('/login'),
          ),
          title: Text(
            _isAdmin ? 'Admin' : 'Team',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 17),
          ),
          centerTitle: true,
        ),
        body: AuthScreenBackground(
          imageAsset: _isAdmin ? _adminBg : _teamBg,
          blurSigma: 11,
          tintTop: _isAdmin ? const Color(0xA328245C) : const Color(0xA3043D2B),
          tintBottom: _isAdmin ? const Color(0xD91E1B4B) : const Color(0xD9064434),
          imageAlignment: _isAdmin ? const Alignment(0, 0.1) : Alignment.center,
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 72, 24, 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: AuthGlassCard(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Center(child: HswfLogo(height: 44, framed: true)),
                          const SizedBox(height: 18),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: _accent.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: _accent.withValues(alpha: 0.45)),
                            ),
                            child: Text(
                              _isAdmin ? 'ADMIN PORTAL' : 'TEAM PORTAL',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                                color: Colors.white.withValues(alpha: 0.95),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Sign in',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _isAdmin
                                ? 'Studio overview, deliverables & team access.'
                                : 'Tasks, assignments and daily production updates.',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 14,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 24),
                          _AuthField(
                            controller: _username,
                            label: 'Username',
                            hint: 'e.g. laxman',
                            autocorrect: false,
                          ),
                          const SizedBox(height: 14),
                          _AuthField(
                            controller: _password,
                            label: 'Password',
                            obscure: _obscure,
                            onToggleObscure: () => setState(() => _obscure = !_obscure),
                            onSubmitted: _submit,
                          ),
                          if (error != null) ...[
                            const SizedBox(height: 14),
                            Text(
                              error,
                              style: TextStyle(
                                color: AppColors.rose.withValues(alpha: 0.95),
                                fontSize: 14,
                                height: 1.35,
                              ),
                            ),
                          ],
                          const SizedBox(height: 22),
                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _accent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: _loading
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Enter dashboard', style: TextStyle(fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthField extends StatelessWidget {
  const _AuthField({
    required this.controller,
    required this.label,
    this.hint,
    this.keyboardType,
    this.autocorrect = true,
    this.obscure = false,
    this.onToggleObscure,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final TextInputType? keyboardType;
  final bool autocorrect;
  final bool obscure;
  final VoidCallback? onToggleObscure;
  final VoidCallback? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      autocorrect: autocorrect,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      onFieldSubmitted: onSubmitted != null ? (_) => onSubmitted!() : null,
      validator: (v) {
        if (label == 'Email') {
          if (v == null || v.trim().isEmpty) return 'Email required';
          if (!v.contains('@')) return 'Enter a valid email';
        } else if (v == null || v.isEmpty) {
          return 'Password required';
        }
        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.1),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white, width: 1.2),
        ),
        errorStyle: const TextStyle(color: Color(0xFFFDA4AF)),
        suffixIcon: onToggleObscure != null
            ? IconButton(
                icon: Icon(
                  obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
                onPressed: onToggleObscure,
              )
            : null,
      ),
    );
  }
}
