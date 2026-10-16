import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

// 실기기에서는 --dart-define=WEB_URL=http://<Mac IP>:3000 으로 덮어쓴다.
const _webUrlOverride = String.fromEnvironment('WEB_URL');

String get _webUrl {
  if (_webUrlOverride.isNotEmpty) return _webUrlOverride;
  // Android 에뮬레이터에서는 10.0.2.2 가 호스트 Mac 의 localhost 를 가리킨다.
  return defaultTargetPlatform == TargetPlatform.android
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000';
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: WebViewPage());
  }
}

class WebViewPage extends StatefulWidget {
  const WebViewPage({super.key});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _controller = WebViewController()
    ..setJavaScriptMode(JavaScriptMode.unrestricted)
    // 웹 → 앱: 웹에서 window.AppBridge.postMessage(JSON 문자열) 로 호출한다.
    ..addJavaScriptChannel('AppBridge', onMessageReceived: _onWebMessage)
    ..loadRequest(Uri.parse(_webUrl));

  int _sentCount = 0;

  // 메시지 형식 { type, message } 는 web/src/app/page.tsx 와 맞춰야 한다.
  void _onWebMessage(JavaScriptMessage message) {
    final data = jsonDecode(message.message) as Map<String, dynamic>;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('[${data['type']}] ${data['message']}')),
    );
  }

  // 앱 → 웹: 웹이 등록한 window.onAppMessage 를 호출한다.
  Future<void> _sendToWeb() async {
    _sentCount++;
    final payload = jsonEncode({
      'type': 'greeting',
      'message': '앱에서 보낸 메시지 #$_sentCount',
    });
    await _controller.runJavaScript('window.onAppMessage?.($payload)');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: WebViewWidget(controller: _controller)),
      floatingActionButton: FloatingActionButton(
        onPressed: _sendToWeb,
        tooltip: '웹으로 메시지 보내기',
        child: const Icon(Icons.send),
      ),
    );
  }
}
