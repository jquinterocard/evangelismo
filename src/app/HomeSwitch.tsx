"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { parseQrParam } from "@/lib/urls";
import { ScanExperience } from "@/features/teachings/ScanExperience";

/** Si la URL trae ?qr=, muestra la experiencia de escaneo; si no, la portada. */
export function HomeSwitch({ landing }: { landing: ReactNode }) {
  const params = useSearchParams();
  const { present, qrId } = parseQrParam(params);
  if (!present) return <>{landing}</>;
  return <ScanExperience qrId={qrId} invalidQr={qrId === null} />;
}
