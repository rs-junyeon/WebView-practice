import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

// 웹의 callNative(method, params) 요청을 처리한다. (web/src/lib/native-bridge.ts)
// 반환값은 jsonEncode 가능한 값이어야 하고, 실패는 예외로 던진다.
Future<Object?> handleNativeRequest(
  String method,
  Map<String, dynamic> params,
) {
  return switch (method) {
    'getDeviceInfo' => _getDeviceInfo(),
    _ => throw UnsupportedError('알 수 없는 method: $method'),
  };
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
