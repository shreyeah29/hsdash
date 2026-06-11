import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

String escapeCsvCell(String value) {
  final v = value.replaceAll('\r\n', ' ').replaceAll('\n', ' ');
  if (v.contains(',') || v.contains('"')) {
    return '"${v.replaceAll('"', '""')}"';
  }
  return v;
}

List<String> csvLine(List<String> cells) => cells.map(escapeCsvCell).toList();

Future<void> shareSpreadsheet({
  required BuildContext context,
  required String filename,
  required List<String> columns,
  required List<List<String>> rows,
}) async {
  final box = context.findRenderObject() as RenderBox?;
  final origin = box != null ? box.localToGlobal(Offset.zero) & box.size : null;

  final buffer = StringBuffer()..writeln(columns.map(escapeCsvCell).join(','));
  for (final row in rows) {
    buffer.writeln(csvLine(row).join(','));
  }

  final dir = await getTemporaryDirectory();
  final safeName = filename.endsWith('.csv') ? filename : '$filename.csv';
  final file = File('${dir.path}/$safeName');
  await file.writeAsString(buffer.toString());

  await Share.shareXFiles(
    [XFile(file.path, mimeType: 'text/csv', name: safeName)],
    subject: safeName,
    sharePositionOrigin: origin,
  );
}
