/// Editor picks for `POST .../start-post-production` (multi-select per lane).
class PostProductionEditorPick {
  const PostProductionEditorPick({
    this.photoEditorIds = const [],
    this.cinematicEditorIds = const [],
    this.traditionalEditorIds = const [],
    this.albumEditorIds = const [],
  });

  final List<String> photoEditorIds;
  final List<String> cinematicEditorIds;
  final List<String> traditionalEditorIds;
  final List<String> albumEditorIds;

  bool get hasAny =>
      photoEditorIds.isNotEmpty ||
      cinematicEditorIds.isNotEmpty ||
      traditionalEditorIds.isNotEmpty ||
      albumEditorIds.isNotEmpty;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (photoEditorIds.isNotEmpty) map['photoEditorIds'] = photoEditorIds;
    if (cinematicEditorIds.isNotEmpty) map['cinematicEditorIds'] = cinematicEditorIds;
    if (traditionalEditorIds.isNotEmpty) map['traditionalEditorIds'] = traditionalEditorIds;
    if (albumEditorIds.isNotEmpty) map['albumEditorIds'] = albumEditorIds;
    return map;
  }
}
