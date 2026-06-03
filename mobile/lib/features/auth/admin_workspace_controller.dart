import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hsdash_mobile/features/auth/admin_workspace_profile.dart';

const _profileKey = 'hsdash_admin_workspace_profile';

class AdminWorkspaceStorage {
  AdminWorkspaceStorage({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<AdminWorkspaceProfile?> read() async {
    final raw = await _storage.read(key: _profileKey);
    return AdminWorkspaceProfile.tryParse(raw);
  }

  Future<void> write(AdminWorkspaceProfile profile) =>
      _storage.write(key: _profileKey, value: profile.name);

  Future<void> clear() => _storage.delete(key: _profileKey);
}

final adminWorkspaceStorageProvider = Provider<AdminWorkspaceStorage>((ref) => AdminWorkspaceStorage());

class AdminWorkspaceNotifier extends Notifier<AdminWorkspaceProfile?> {
  @override
  AdminWorkspaceProfile? build() => null;

  Future<void> restore() async {
    state = await ref.read(adminWorkspaceStorageProvider).read();
  }

  Future<void> select(AdminWorkspaceProfile profile) async {
    await ref.read(adminWorkspaceStorageProvider).write(profile);
    state = profile;
  }

  Future<void> clear() async {
    await ref.read(adminWorkspaceStorageProvider).clear();
    state = null;
  }
}

final adminWorkspaceProvider = NotifierProvider<AdminWorkspaceNotifier, AdminWorkspaceProfile?>(
  AdminWorkspaceNotifier.new,
);

