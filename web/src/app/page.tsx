"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// 앱과 주고받는 메시지 형식. Flutter(app/lib/main.dart)와 맞춰야 한다.
type BridgeMessage = { type: string; message: string };

declare global {
  interface Window {
    // Flutter 의 addJavaScriptChannel('AppBridge') 가 주입한다.
    AppBridge?: { postMessage: (message: string) => void };
    // Flutter 가 runJavaScript 로 호출한다.
    onAppMessage?: (message: BridgeMessage) => void;
  }
}

const subscribe = () => () => {};

export default function Home() {
  const inApp = useSyncExternalStore(
    subscribe,
    () => window.AppBridge !== undefined,
    () => false,
  );
  const [received, setReceived] = useState<BridgeMessage[]>([]);

  useEffect(() => {
    window.onAppMessage = (message) =>
      setReceived((prev) => [message, ...prev]);
    return () => {
      delete window.onAppMessage;
    };
  }, []);

  const sendToApp = () => {
    const message: BridgeMessage = {
      type: "greeting",
      message: `웹에서 보낸 메시지 (${new Date().toLocaleTimeString()})`,
    };
    window.AppBridge?.postMessage(JSON.stringify(message));
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">WebView Practice</h1>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {inApp ? "앱 웹뷰에서 실행 중" : "앱 밖에서 실행 중 (브리지 없음)"}
      </p>

      <button
        type="button"
        onClick={sendToApp}
        disabled={!inApp}
        className="h-12 rounded-full bg-foreground px-5 font-medium text-background disabled:opacity-40"
      >
        앱으로 메시지 보내기
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">앱에서 받은 메시지</h2>
        {received.length === 0 ? (
          <p className="text-sm text-zinc-500">아직 없음</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {received.map((m, i) => (
              <li key={received.length - i}>
                [{m.type}] {m.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
