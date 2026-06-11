import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:hsdash_mobile/config/env.dart';

typedef RealtimeEventHandler = void Function(String event);

/// Socket.IO client — mirrors web `RealtimeSync.tsx` and `API.md` realtime section.
class RealtimeClient {
  io.Socket? _socket;

  bool get isConnected => _socket?.connected ?? false;

  void connect({
    required String token,
    required RealtimeEventHandler onEvent,
  }) {
    disconnect();

    final socket = io.io(
      apiBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableReconnection()
          .enableForceNew()
          .setReconnectionAttempts(12)
          .build(),
    );

    void listen(String name) => socket.on(name, (_) => onEvent(name));

    listen('task:updated');
    listen('production:cleared');
    listen('assignment:updated');
    listen('notification:new');
    listen('attendance:updated');

    _socket = socket;
  }

  void disconnect() {
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
