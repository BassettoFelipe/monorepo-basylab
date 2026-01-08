"use client";

import { Suspense } from "react";
import { ReferralModal } from "./ReferralModal";

export function ReferralModalWrapper() {
  return (
    <Suspense fallback={null}>
      <ReferralModal />
    </Suspense>
  );
}
