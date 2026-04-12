// เก็บ client writer แยกตาม group
const globalObj = globalThis;
if (!globalObj.__SSE_HUB__) {
  globalObj.__SSE_HUB__ = {
    clientsByGroup: new Map(), // Map<string, Set<WritableStreamDefaultWriter>>
    enc: new TextEncoder(),
  };
}
const HUB = globalObj.__SSE_HUB__;

export function addClient(group, writer) {
  if (!HUB.clientsByGroup.has(group)) HUB.clientsByGroup.set(group, new Set());
  HUB.clientsByGroup.get(group).add(writer);
}

export function removeClient(group, writer) {
  const set = HUB.clientsByGroup.get(group);
  if (!set) return;
  set.delete(writer);
  if (set.size === 0) HUB.clientsByGroup.delete(group);
}

export function broadcast(group, data) {
  const set = HUB.clientsByGroup.get(group);
  if (!set || set.size === 0) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const w of set) {
    w.write(HUB.enc.encode(payload)).catch(() => {
      // ถ้าเขียนไม่สำเร็จ ให้ลบออกจากกลุ่ม
      set.delete(w);
    });
  }
}

// (option) broadcast ทุกกลุ่ม
export function broadcastAll(data) {
  for (const group of HUB.clientsByGroup.keys()) {
    broadcast(group, data);
  }
}
