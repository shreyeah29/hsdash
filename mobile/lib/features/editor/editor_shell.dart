import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hsdash_mobile/features/editor/laxman/laxman_editor_shell.dart';
import 'package:hsdash_mobile/models/user.dart';

/// All [UserRole.editor] accounts use the monochrome team editor shell.
class EditorShell extends ConsumerWidget {
  const EditorShell({super.key, required this.user});

  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return LaxmanEditorShell(user: user);
  }
}
