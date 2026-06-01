/// Editor lane assignments for deliverable task creation.
class EventEditorAssignments {
  const EventEditorAssignments({
    this.photoEditorId,
    this.cinematicEditorId,
    this.traditionalEditorId,
    this.albumEditorId,
  });

  final String? photoEditorId;
  final String? cinematicEditorId;
  final String? traditionalEditorId;
  final String? albumEditorId;

  static const empty = EventEditorAssignments();

  bool get hasAny =>
      _set(photoEditorId) ||
      _set(cinematicEditorId) ||
      _set(traditionalEditorId) ||
      _set(albumEditorId);

  EventEditorAssignments copyWith({
    String? photoEditorId,
    String? cinematicEditorId,
    String? traditionalEditorId,
    String? albumEditorId,
    bool clearPhoto = false,
    bool clearCinematic = false,
    bool clearTraditional = false,
    bool clearAlbum = false,
  }) {
    return EventEditorAssignments(
      photoEditorId: clearPhoto ? null : (photoEditorId ?? this.photoEditorId),
      cinematicEditorId: clearCinematic ? null : (cinematicEditorId ?? this.cinematicEditorId),
      traditionalEditorId: clearTraditional ? null : (traditionalEditorId ?? this.traditionalEditorId),
      albumEditorId: clearAlbum ? null : (albumEditorId ?? this.albumEditorId),
    );
  }

  String? idForField(String fieldKey) {
    switch (fieldKey) {
      case 'photoEditorId':
        return photoEditorId;
      case 'cinematicEditorId':
        return cinematicEditorId;
      case 'traditionalEditorId':
        return traditionalEditorId;
      case 'albumEditorId':
        return albumEditorId;
      default:
        return null;
    }
  }

  EventEditorAssignments toggleField(String fieldKey, String userId) {
    final current = idForField(fieldKey);
    final next = current == userId ? null : userId;
    switch (fieldKey) {
      case 'photoEditorId':
        return copyWith(photoEditorId: next, clearPhoto: next == null);
      case 'cinematicEditorId':
        return copyWith(cinematicEditorId: next, clearCinematic: next == null);
      case 'traditionalEditorId':
        return copyWith(traditionalEditorId: next, clearTraditional: next == null);
      case 'albumEditorId':
        return copyWith(albumEditorId: next, clearAlbum: next == null);
      default:
        return this;
    }
  }

  Map<String, String> toJson() {
    final map = <String, String>{};
    if (_set(photoEditorId)) map['photoEditorId'] = photoEditorId!;
    if (_set(cinematicEditorId)) map['cinematicEditorId'] = cinematicEditorId!;
    if (_set(traditionalEditorId)) map['traditionalEditorId'] = traditionalEditorId!;
    if (_set(albumEditorId)) map['albumEditorId'] = albumEditorId!;
    return map;
  }

  static bool _set(String? id) => id != null && id.isNotEmpty;
}

/// Body for `POST /events` — see `API.md`.
class CreateEventFormData {
  const CreateEventFormData({
    required this.clientName,
    required this.eventDate,
    this.editors = EventEditorAssignments.empty,
  });

  final String clientName;
  /// `YYYY-MM-DD` local day key.
  final String eventDate;
  final EventEditorAssignments editors;

  Map<String, dynamic> toJson() => {
        'clientName': clientName.trim(),
        'eventDate': '${eventDate}T00:00:00.000Z',
        ...editors.toJson(),
      };
}

/// Editor lanes for deliverable assignment UI.
abstract final class EventEditorLanes {
  static const photo = ('Photo editor', 'PHOTO_TEAM', 'photoEditorId');
  static const cinematic = ('Cinematic editor', 'CINEMATIC_TEAM', 'cinematicEditorId');
  static const traditional = ('Traditional editor', 'TRADITIONAL_TEAM', 'traditionalEditorId');
  static const album = ('Album editor', 'ALBUM_TEAM', 'albumEditorId');

  static const all = [photo, cinematic, traditional, album];
}
