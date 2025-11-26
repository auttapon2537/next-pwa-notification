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
- ปุ่มเดโม:
  - แจ้งเตือนทันที (client) / พร้อมภาพ
  - แจ้งเตือนผ่าน service worker (คงอยู่แม้ย่อแท็บ)
  - แจ้งเตือนมีปุ่ม action (เปิดแอป/เลื่อน)
  - Badge + vibrate pattern
  - ตั้งเวลา/จำลอง push ด้วย postMessage -> service worker
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
