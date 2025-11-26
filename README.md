## Next.js PWA Notifications Playground

ตัวอย่าง Progressive Web App ที่มี service worker, manifest, ไอคอน และเดโมการแจ้งเตือนหลายแบบ (client, service worker, actions, badge/vibrate, ตั้งเวลา/จำลอง push)

## รันโปรเจ็กต์
```bash
npm run dev         # โหมดพัฒนา http://localhost:3000
npm run build && npm run start   # โปรดเลือกพอร์ตว่าง ถ้า 3000 ถูกใช้ให้ตั้ง PORT=3001
```

## ใช้งานเดโมการแจ้งเตือน
- เปิดบน `http://localhost` หรือ HTTPS เท่านั้น (Notification API ถูกบล็อกบน HTTP ปกติ)
- เมื่อโหลดหน้าแรก จะมีสถานะ Permission / Service Worker / Manifest ให้ดู
- กด Allow Notifications ในเบราว์เซอร์ ถ้าเคย Block ต้องเข้า Site settings แล้วเปลี่ยนเป็น Allow
- ปุ่มเดโม (ระบุ API/ออปชันที่ใช้):
  - แจ้งเตือนทันที (Client) → ใช้ `ServiceWorkerRegistration.showNotification` (fallback เป็น `new Notification`) พร้อม `tag` สำหรับรวมซ้ำ
  - พร้อมภาพตัวอย่าง → ใช้ `showNotification` + `image`
  - คงอยู่แม้ย่อแท็บ → ใช้ `showNotification` + `requireInteraction`
  - มีปุ่ม Action → ใช้ `showNotification` + `actions` และ handle ใน `notificationclick` ของ `sw.js`
  - Badge + Vibration → ใช้ `showNotification` + `badge` + `vibrate`
  - ตั้งเวลา/จำลอง Push → ส่ง `postMessage` ไป `sw.js` ให้เรียก `showNotification` หลัง `setTimeout`
  - แจ้งเตือนเมื่อออกจากหน้า (หน่วง 3 วิ) → รอ 3 วินาที ถ้ายัง `document.visibilityState === "visible"` และ `document.hasFocus()` จะไม่แจ้งเตือน; ถ้าไม่อยู่หน้าแอปจะยิงผ่าน `showNotification`
- ตรวจสอบ service worker: DevTools → Application → Service Workers ต้องเห็น `sw.js` เป็น activated

## โครงสร้าง PWA
- `app/manifest.ts` - ข้อมูลแอป, icons, theme color
- `public/icon-192.png`, `public/icon-512.png` - ไอคอนสำหรับติดตั้ง
- `public/sw.js` - แคชพื้นฐาน, handle push/message/notificationclick
- `app/page.tsx` - UI เดโมและฟังก์ชันส่งแจ้งเตือน

## ทดสอบและ lint
```bash
npm run lint
```

## ข้อจำกัด/ทิปส์
- เสียง custom ยังตั้งผ่าน Notification API ไม่ได้ (ใช้เสียงระบบเท่านั้น)
- ถ้าแจ้งเตือนยังไม่ขึ้น: ปิดโหมดห้ามรบกวน, ใช้หน้าต่างปกติ (ไม่ incognito), และอนุญาตที่ OS/เบราว์เซอร์
