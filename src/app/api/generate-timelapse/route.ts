import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { requireUser } from "@/lib/auth";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  await requireUser();

  const { date } = await req.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "올바른 날짜 형식이 아닙니다" }, { status: 400 });
  }

  const scriptPath = path.join(process.cwd(), "backend", "timelapse.py");

  try {
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" ${date}`,
      { timeout: 180_000, env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" } }
    );
    return NextResponse.json({ ok: true, output: stdout + stderr });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
