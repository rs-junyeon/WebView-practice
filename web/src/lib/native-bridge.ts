// 앱(app/lib/main.dart)의 NativeBridge 채널과 요청/응답을 주고받는다.
// 요청: { id, method, params } → 응답: { id, result } 또는 { id, error }
type NativeResponse =
  | { id: number; result: unknown }
  | { id: number; error: string };

declare global {
  interface Window {
    // Flutter 의 addJavaScriptChannel('NativeBridge') 가 주입한다.
    NativeBridge?: { postMessage: (message: string) => void };
    // Flutter 가 runJavaScript 로 호출한다.
    onNativeResponse?: (response: NativeResponse) => void;
  }
}

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

const pending = new Map<number, Pending>();
let nextId = 1;

function handleResponse(response: NativeResponse) {
  const request = pending.get(response.id);
  if (!request) return;
  pending.delete(response.id);
  if ("error" in response) request.reject(new Error(response.error));
  else request.resolve(response.result);
}

export function callNative<T>(
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const bridge = window.NativeBridge;
  if (!bridge) {
    return Promise.reject(new Error("앱 밖에서는 네이티브 기능을 쓸 수 없음"));
  }
  // HMR 로 모듈이 다시 로드돼도 현재 pending 맵을 쓰도록 매번 등록한다.
  window.onNativeResponse = handleResponse;

  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    bridge.postMessage(JSON.stringify({ id, method, params }));
  });
}
