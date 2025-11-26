"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type DemoCard = {
  title: string;
  description: string;
  action: () => Promise<void>;
  tone?: "blue" | "green" | "amber" | "pink";
};

type NotificationActionOption = {
  action: string;
  title: string;
  icon?: string;
};

type NotifyOptions = NotificationOptions & {
  renotify?: boolean;
  image?: string;
  actions?: NotificationActionOption[];
  vibrate?: number | number[];
};

const badgeStyles: Record<NonNullable<DemoCard["tone"]>, string> = {
  blue: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  green: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-100 border border-amber-500/30",
  pink: "bg-pink-500/15 text-pink-100 border border-pink-500/30",
};

export default function Home() {
  const swSupported =
    typeof window !== "undefined" && "serviceWorker" in navigator;
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  );
  const [swStatus, setSwStatus] = useState<
    "checking" | "ready" | "unsupported" | "error"
  >(() => (swSupported ? "checking" : "unsupported"));
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [lastMessage, setLastMessage] = useState(() =>
    swSupported
      ? "พร้อมทดสอบบน localhost หรือ HTTPS"
      : "เบราว์เซอร์นี้ไม่รองรับ service worker",
  );

  useEffect(() => {
    if (!swSupported) return;

    let cancelled = false;
    const registerWorker = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration();
        await (existing ?? navigator.serviceWorker.register("/sw.js"));
        const ready = await navigator.serviceWorker.ready;
        if (cancelled) return;
        setRegistration(ready);
        setSwStatus("ready");
        setLastMessage("Service worker พร้อมแล้ว");
      } catch (error) {
        if (cancelled) return;
        setSwStatus("error");
        setLastMessage(
          error instanceof Error
            ? error.message
            : "ลงทะเบียน service worker ไม่สำเร็จ",
        );
      }
    };

    registerWorker();
    return () => {
      cancelled = true;
    };
  }, [swSupported]);

  const supported =
    typeof window !== "undefined" && "Notification" in window;

  const statusBadges = [
    {
      label: "Permission",
      value: permission,
      tone: permission === "granted" ? "green" : "amber",
    },
    {
      label: "Service Worker",
      value: swStatus,
      tone:
        swStatus === "ready"
          ? "green"
          : swStatus === "unsupported"
            ? "amber"
            : "pink",
    },
    {
      label: "PWA Manifest",
      value: "พร้อมใช้",
      tone: "blue",
    },
  ];

  const ensurePermission = async () => {
    if (!supported) {
      throw new Error("เบราว์เซอร์นี้ไม่รองรับ Notification API");
    }

    let current = Notification.permission;
    if (current === "default") {
      current = await Notification.requestPermission();
    }

    setPermission(current);
    if (current !== "granted") {
      throw new Error("ต้องกด Allow การแจ้งเตือนก่อน");
    }
  };

  const ensureRegistration = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service worker ไม่รองรับบนเบราว์เซอร์นี้");
    }
    if (registration) return registration;
    const ready = await navigator.serviceWorker.ready;
    setRegistration(ready);
    setSwStatus("ready");
    return ready;
  };

  const sendClientNotification = async (
    title: string,
    options?: NotifyOptions,
  ) => {
    await ensurePermission();
    // ใช้ service worker ถ้ามี เพื่อให้ทำงานได้ใน production/bgc
    if (swSupported) {
      const reg = await ensureRegistration();
      await reg.showNotification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        lang: "th",
        ...options,
      });
      setLastMessage(`ส่งแจ้งเตือน (ผ่าน SW): ${title}`);
      return;
    }

    // fallback กรณีไม่มี SW (dev บางกรณี)
    new Notification(title, {
      icon: "/icon-192.png",
      lang: "th",
      ...options,
    });
    setLastMessage(`ส่งแจ้งเตือน: ${title}`);
  };

  const sendSwNotification = async (
    title: string,
    options?: NotifyOptions,
  ) => {
    await ensurePermission();
    const reg = await ensureRegistration();
    await reg.showNotification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      lang: "th",
      ...options,
    });
    setLastMessage(`Service worker ส่งแจ้งเตือน: ${title}`);
  };

  const sendMessageToSw = async (
    title: string,
    options?: NotifyOptions & { data?: Record<string, unknown> },
  ) => {
    await ensurePermission();
    const reg = await ensureRegistration();
    const worker = reg.active ?? reg.waiting ?? reg.installing;
    if (!worker) throw new Error("ยังไม่พบ service worker ที่ทำงานอยู่");
    worker.postMessage({
      type: "demo-notification",
      title,
      options,
      tag: options?.tag,
      data: options?.data,
    });
    setLastMessage(`ส่งข้อความไปยัง service worker: ${title}`);
  };

  const demoCards: DemoCard[] = [
    {
      title: "แจ้งเตือนทันที (Client)",
      description:
        "ยิง Notification จากหน้าเว็บทันที ใช้ได้เมื่อแท็บโฟกัส เหมาะกับ toast-like alert",
      action: () =>
        sendClientNotification("แจ้งเตือนแบบทันที", {
          body: "ตัวอย่างจากหน้าเว็บโดยตรง",
          tag: "client-basic",
          renotify: true,
        }),
      tone: "blue",
    },
    {
      title: "พร้อมภาพตัวอย่าง",
      description:
        "เพิ่มภาพ/ไอคอนเพื่อให้เนื้อหาน่าสนใจ เหมาะกับข่าวสารหรือโปรโมชัน",
      action: () =>
        sendClientNotification("แจ้งเตือนพร้อมภาพ", {
          body: "ภาพถูกโหลดผ่าน Notification API",
          image: "/icon-512.png",
          tag: "with-image",
        }),
      tone: "pink",
    },
    {
      title: "คงอยู่แม้ย่อแท็บ",
      description:
        "ใช้ service worker เพื่อให้การแจ้งเตือนยังคงแสดงแม้ไม่ได้โฟกัสแท็บ",
      action: () =>
        sendSwNotification("แจ้งเตือนแบบ persistent", {
          body: "ยิงจาก service worker (registration.showNotification)",
          requireInteraction: true,
          tag: "persistent",
          renotify: true,
          data: { url: "/" },
        }),
      tone: "green",
    },
    {
      title: "มีปุ่ม Action",
      description:
        "แสดงปุ่มยืนยัน/เลื่อนภายใน notification (รองรับบน service worker เท่านั้น)",
      action: () =>
        sendSwNotification("แจ้งเตือนพร้อมปุ่มตอบกลับ", {
          body: "เลือก Open เพื่อโฟกัสแอป หรือ Snooze เพื่อปิดชั่วคราว",
          actions: [
            { action: "open-app", title: "Open app" },
            { action: "snooze", title: "Snooze" },
          ],
          data: {
            url: "/?notification=open",
            actions: {
              "open-app": "/?notification=open",
              snooze: "/?notification=snooze",
            },
          },
          tag: "actionable",
          requireInteraction: true,
        }),
      tone: "amber",
    },
    {
      title: "Badge + Vibration",
      description:
        "เพิ่ม badge และรูปแบบสั่นเพื่อเน้นความสำคัญ ใช้งานได้ทั้งมือถือและเดสก์ท็อปบางรุ่น",
      action: () =>
        sendSwNotification("แจ้งเตือนพร้อม badge", {
          body: "ตัวอย่าง pattern การสั่น + badge",
          badge: "/icon-192.png",
          vibrate: [80, 30, 120, 30, 80],
          tag: "badge-demo",
          data: { url: "/" },
        }),
      tone: "blue",
    },
    {
      title: "ตั้งเวลา / จำลอง Push",
      description:
        "สั่งงานผ่าน message ไปยัง service worker ให้แสดงผลภายหลัง (ใช้แทน push server ระหว่างพัฒนาได้)",
      action: async () => {
        await ensurePermission();
        setLastMessage("จะยิงแจ้งเตือนใน 5 วินาที...");
        setTimeout(() => {
          sendMessageToSw("แจ้งเตือนแบบตั้งเวลา", {
            body: "ส่งผ่าน postMessage -> service worker",
            data: { url: "/?notification=scheduled" },
            tag: "scheduled-demo",
          }).catch((error) => setLastMessage(error.message));
        }, 5000);
      },
      tone: "pink",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_70px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-lg font-semibold text-white shadow-lg shadow-blue-500/30">
              PWA
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                PWA + Notification Playground
              </h1>
              <p className="text-sm text-slate-200">
                ตัวอย่างการทำ Progressive Web App พร้อมการแจ้งเตือนหลายรูปแบบ
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {statusBadges.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${badgeStyles[item.tone as NonNullable<DemoCard["tone"]>]}`}
              >
                <span className="h-2 w-2 rounded-full bg-current/80" />
                {item.label}: {item.value}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="text-xs uppercase tracking-wide text-slate-300">
                ขั้นตอนเริ่มต้น
              </span>
              <ol className="space-y-2 text-sm text-slate-100">
                <li>1) ใช้บน localhost หรือโฮสต์ HTTPS เพื่อรองรับ Notification</li>
                <li>
                  2) กด Allow เมื่อเบราว์เซอร์ถามสิทธิ์ จากนั้นลองกดปุ่ม demo ด้านล่าง
                </li>
                <li>
                  3) ปิด/ย่อแท็บแล้วกดปุ่มที่ใช้ service worker เพื่อดูการแจ้งเตือนแบบ persistent
                </li>
              </ol>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex flex-col text-sm text-blue-50">
                <span className="font-semibold">สถานะล่าสุด</span>
                <span className="text-blue-100/80">{lastMessage}</span>
              </div>
              <Image
                src="/icon-192.png"
                alt="PWA icon"
                width={56}
                height={56}
                className="rounded-xl border border-blue-500/30 bg-white/10 p-2"
              />
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {demoCards.map((card) => (
            <article
              key={card.title}
              className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_45px_-25px_rgba(0,0,0,0.6)]"
            >
              <div className="flex flex-col gap-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[13px] font-semibold uppercase tracking-wide text-slate-100">
                  {card.title}
                </div>
                <p className="text-sm text-slate-200">{card.description}</p>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:shadow-blue-500/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                onClick={() => card.action().catch((error) => setLastMessage(error.message))}
              >
                ลองแจ้งเตือน
              </button>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-white">
              PWA Checklist (โปรเจ็กต์นี้ทำให้แล้ว)
            </h2>
            <ul className="space-y-2">
              <li>✓ manifest.ts เพิ่มชื่อ, theme color, icon, start_url</li>
              <li>✓ ไอคอน 192/512 px สำหรับติดตั้งบนมือถือ/เดสก์ท็อป</li>
              <li>✓ service worker แคชหน้าแรกและ asset พื้นฐาน</li>
              <li>✓ รองรับ push event, message, notificationclick</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-white">ทริคเพิ่มเติม</h2>
            <ul className="space-y-2">
              <li>- ทดสอบ push จริง: เปิด DevTools → Application → Service Workers → Push</li>
              <li>- ใช้ tag + renotify ป้องกันการแจ้งเตือนซ้ำซ้อน</li>
              <li>- actions ต้องยิงจาก service worker เท่านั้น</li>
              <li>- ตั้งค่า themeColor ให้ตรงกับแอปเพื่อ UX ที่เนียนขึ้น</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
