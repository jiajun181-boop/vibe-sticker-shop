import { Suspense } from "react";
import DesignPageClient from "./DesignPageClient";

export default function DesignPage() {
  return (
    <Suspense>
      <DesignPageClient />
    </Suspense>
  );
}
