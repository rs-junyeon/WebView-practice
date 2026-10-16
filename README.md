# WebView-practice

Next.js 웹 애플리케이션을 Flutter 앱의 웹뷰로 띄워보는 연습 프로젝트.

```
web/   Next.js 앱 (웹뷰에 표시될 페이지)
app/   Flutter 앱 (webview_flutter 로 web/ 을 띄우는 껍데기)
```

## 사전 준비

| 도구 | 확인된 버전 | 용도 |
|---|---|---|
| Node.js | 24 | `web/` 실행 |
| Flutter | 3.47 | `app/` 실행 |
| Xcode + iOS 시뮬레이터 | - | iOS 실행 |
| Android Studio + 에뮬레이터 | - | Android 실행 |

설치 상태는 `flutter doctor` 로 확인한다.

처음 한 번만 의존성을 설치한다 (저장소 루트에서).

```sh
(cd web && npm install)
(cd app && flutter pub get)
```

## 실행 순서

터미널 두 개를 사용한다. **Next.js 서버를 먼저 띄운 뒤** 앱을 실행해야 한다.

### 1. Next.js 개발 서버 실행 (터미널 1)

```sh
cd web
npm run dev
```

`http://localhost:3000` 이 브라우저에서 열리면 정상.

### 2. 시뮬레이터 / 에뮬레이터 켜기

```sh
# iOS 시뮬레이터: Device Hub 창이 열리고 사이드바에서 기기를 골라 켜고 조작한다
# (Xcode 27 부터 Simulator.app 대신 Device Hub 가 시뮬레이터 화면을 띄운다)
open -a DeviceHub

# 창 없이 부팅만 하려면 (flutter run 만 할 때)
xcrun simctl list devices available
xcrun simctl boot "iPhone 17"

# Android 에뮬레이터: 목록 확인 후 실행
flutter emulators
flutter emulators --launch <emulator id>
```

### 3. Flutter 앱 실행 (터미널 2)

```sh
cd app
flutter devices          # 연결된 기기 id 확인
flutter run -d <기기 id>
```

기기가 하나만 연결되어 있으면 `flutter run` 만 해도 된다.

앱이 접속하는 주소는 플랫폼별로 자동 선택된다 (`app/lib/main.dart`).

| 실행 환경 | 접속 주소 |
|---|---|
| iOS 시뮬레이터 | `http://localhost:3000` |
| Android 에뮬레이터 | `http://10.0.2.2:3000` (에뮬레이터에서 본 Mac 의 localhost) |

## 개발 중 변경 반영

- **웹 코드 (`web/`)**: 저장하면 웹뷰에 자동 반영된다 (Next.js HMR).
- **앱 코드 (`app/lib/`)**: `flutter run` 터미널에서 `r` (hot reload) 또는 `R` (hot restart).
- **네이티브 설정 (`app/android/`, `app/ios/`)**: `flutter run` 을 종료(`q`)하고 다시 실행해야 한다.

## 웹 ↔ 앱 브리지

메시지는 `{ "type": string, "message": string }` JSON 으로 주고받는다.
형식을 바꾸면 `web/src/app/page.tsx` 와 `app/lib/main.dart` 를 함께 고쳐야 한다.

| 방향 | 보내는 쪽 | 받는 쪽 |
|---|---|---|
| 웹 → 앱 | `window.AppBridge.postMessage(JSON 문자열)` | `addJavaScriptChannel('AppBridge')` → SnackBar 표시 |
| 앱 → 웹 | `runJavaScript('window.onAppMessage(...)')` (우측 하단 버튼) | `window.onAppMessage` → 페이지 목록에 표시 |

`window.AppBridge` 는 앱 웹뷰에서만 주입되므로, 일반 브라우저에서 열면 "앱 밖에서 실행 중" 으로 표시되고 전송 버튼이 비활성화된다.

### 네이티브 기능 호출 (요청/응답)

웹에서 `callNative(method, params)` (`web/src/lib/native-bridge.ts`) 를 호출하면 Promise 로 결과를 받는다.

```
웹  window.NativeBridge.postMessage({ id, method, params })
앱  handleNativeRequest(method, params) 실행 (app/lib/native_bridge.dart)
웹  window.onNativeResponse({ id, result } 또는 { id, error }) → id 로 Promise resolve/reject
```

| method | params | 결과 |
|---|---|---|
| `getDeviceInfo` | 없음 | `{ platform, model, osVersion }` |
| `pickImage` | `{ source: "camera" \| "gallery" }` | 이미지 data URL (가로 1024px, 품질 80). 취소하면 `null` |

새 기능은 `handleNativeRequest` 의 `switch` 에 method 를 추가하고, 웹에서 `callNative` 로 호출하면 된다.
iOS 시뮬레이터에는 카메라가 없어서 `pickImage({ source: "camera" })` 는 image_picker 가 "Camera not available." 알림을 띄운 뒤 `null` 로 응답한다 (취소와 구분되지 않음).

## 실기기에서 실행

실기기는 Mac 의 localhost 에 접근할 수 없으므로 Mac 의 LAN IP 를 직접 지정한다.
Mac 과 기기가 같은 Wi-Fi 에 있어야 한다.

1. Mac IP 확인: `npm run dev` 출력의 `Network:` 주소, 또는 `ipconfig getifaddr en0`
2. `web/next.config.ts` 의 `allowedDevOrigins` 에 해당 IP 추가 (HMR 허용용, 없어도 페이지는 뜬다)
3. URL 을 지정해서 실행

```sh
flutter run -d <기기 id> --dart-define=WEB_URL=http://<Mac IP>:3000
```

## 문제 해결

| 증상 | 원인 / 해결 |
|---|---|
| 웹뷰가 하얀 화면이거나 연결 실패 | Next.js 서버가 꺼져 있음. 터미널 1 에서 `npm run dev` 확인 |
| Android 에서 웹 수정이 반영되지 않음 | 서버 로그에 `Blocked cross-origin request` 가 보이면 해당 호스트를 `allowedDevOrigins` 에 추가 |
| 실기기에서 접속 안 됨 | 같은 Wi-Fi 인지, `WEB_URL` 의 IP 가 맞는지, Mac 방화벽이 3000 포트를 막고 있지 않은지 확인 |
| Android 릴리스 빌드에서 http 페이지가 안 뜸 | 의도된 동작. http 허용은 debug 빌드에만 설정되어 있음 |
