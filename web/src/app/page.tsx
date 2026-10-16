"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { callNative } from "@/lib/native-bridge";

// 앱과 주고받는 메시지 형식. Flutter(app/lib/main.dart)와 맞춰야 한다.
type BridgeMessage = { type: string; message: string };

// getDeviceInfo 응답 형식. Flutter(app/lib/native_bridge.dart)와 맞춰야 한다.
type DeviceInfo = { platform: string; model: string; osVersion: string };

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
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);

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

  const loadDeviceInfo = async () => {
    setError(null);
    try {
      setDeviceInfo(await callNative<DeviceInfo>("getDeviceInfo"));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 앱이 data URL 을 돌려주고, 사용자가 취소하면 null 이 온다.
  const pickImage = async (source: "camera" | "gallery") => {
    setError(null);
    try {
      const dataUrl = await callNative<string | null>("pickImage", { source });
      if (dataUrl) setImage(dataUrl);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">WebView Practice</h1>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {inApp ? "앱 웹뷰에서 실행 중" : "앱 밖에서 실행 중 (브리지 없음)"}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

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

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">기기 정보</h2>
        <button
          type="button"
          onClick={loadDeviceInfo}
          disabled={!inApp}
          className="h-12 rounded-full border border-black/[.08] px-5 font-medium disabled:opacity-40 dark:border-white/[.145]"
        >
          기기 정보 가져오기
        </button>
        {deviceInfo && (
          <p className="text-sm">
            {deviceInfo.platform} · {deviceInfo.model} · OS{" "}
            {deviceInfo.osVersion}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">사진 첨부</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => pickImage("camera")}
            disabled={!inApp}
            className="h-12 flex-1 rounded-full border border-black/[.08] px-5 font-medium disabled:opacity-40 dark:border-white/[.145]"
          >
            카메라
          </button>
          <button
            type="button"
            onClick={() => pickImage("gallery")}
            disabled={!inApp}
            className="h-12 flex-1 rounded-full border border-black/[.08] px-5 font-medium disabled:opacity-40 dark:border-white/[.145]"
          >
            갤러리
          </button>
        </div>
        {image && (
          // data URL 은 next/image 최적화 대상이 아니므로 img 를 그대로 쓴다.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="선택한 사진" className="w-full rounded-lg" />
        )}
      </section>
    </main>
  );
}
