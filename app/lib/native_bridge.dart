import 'dart:convert';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

// 웹의 callNative(method, params) 요청을 처리한다. (web/src/lib/native-bridge.ts)
// 반환값은 jsonEncode 가능한 값이어야 하고, 실패는 예외로 던진다.
Future<Object?> handleNativeRequest(
  String method,
  Map<String, dynamic> params,
) {
  return switch (method) {
    'getDeviceInfo' => _getDeviceInfo(),
    'pickImage' => _pickImage(params['source']),
    _ => throw UnsupportedError('알 수 없는 method: $method'),
  };
}

// 고른 이미지를 data URL 로 반환하고, 취소하면 null.
// runJavaScript 로 base64 를 넘기므로 크기를 줄여서 보낸다.
Future<String?> _pickImage(Object? source) async {
  final imageSource = switch (source) {
    'camera' => ImageSource.camera,
    'gallery' => ImageSource.gallery,
    _ => throw ArgumentError('source 는 camera 또는 gallery 여야 함: $source'),
  };
  final file = await ImagePicker().pickImage(
    source: imageSource,
    maxWidth: 1024,
    imageQuality: 80,
    requestFullMetadata: false,
  );
  if (file == null) return null;

  final bytes = await file.readAsBytes();
  final mimeType = file.path.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';
  return 'data:$mimeType;base64,${base64Encode(bytes)}';
}

Future<Map<String, Object?>> _getDeviceInfo() async {
  final plugin = DeviceInfoPlugin();
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    final info = await plugin.iosInfo;
    return {
      'platform': 'ios',
      'model': info.modelName,
      'osVersion': info.systemVersion,
    };
  }
  final info = await plugin.androidInfo;
  return {
    'platform': 'android',
    'model': '${info.manufacturer} ${info.model}',
    'osVersion': info.version.release,
  };
}
