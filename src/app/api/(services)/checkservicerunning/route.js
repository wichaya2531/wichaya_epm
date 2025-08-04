'use server'
import { NextResponse } from "next/server";
import os from 'os';

function getCpuTimes() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type]; // ✅ แก้ตรงนี้
    }
    totalIdle += cpu.times.idle;
  }

  return { idle: totalIdle, total: totalTick };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const GET = async (req) => {
  const start = getCpuTimes();
  await sleep(100);
  const end = getCpuTimes();

  const idleDiff = end.idle - start.idle;
  const totalDiff = end.total - start.total;
  const cpuUsage = (1 - idleDiff / totalDiff) * 100;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

  const loadAverage = os.loadavg();

  return NextResponse.json({
    status: 200,
    ram: {
      percent: memUsagePercent,
    },
    cpu: {
      usagePercent: cpuUsage.toFixed(2),
      //loadAverage,
    }
  });
};
