import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

function safeValue(value: string | undefined, fallback = "unknown") {
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

export async function GET() {
  const payload = {
    appName: packageJson.name,
    appVersion: packageJson.version,
    gitSha: safeValue(process.env.APP_GIT_SHA),
    gitRef: safeValue(process.env.APP_GIT_REF),
    buildTime: safeValue(process.env.APP_BUILD_TIME),
    imageRef: safeValue(process.env.APP_IMAGE_REF),
    nodeEnv: safeValue(process.env.NODE_ENV),
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload);
}
