import type { Metadata } from "next";
import { ScanExperience } from "@/features/teachings/ScanExperience";

export const metadata: Metadata = {
  title: "Recibir una enseñanza",
  description: "Una enseñanza bíblica elegida al azar, con reflexión, aplicación práctica y oración.",
};

export default function RandomTeachingPage() {
  return <ScanExperience qrId={null} />;
}
