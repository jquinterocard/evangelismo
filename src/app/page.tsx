import { Suspense } from "react";
import { HomeLanding } from "./HomeLanding";
import { HomeSwitch } from "./HomeSwitch";

export default function HomePage() {
  return (
    <>
      <Suspense
        fallback={
          <>
            <div className="qr-loading hidden container-page py-24 text-center text-muted" role="status">
              Preparando una enseñanza para ti…
            </div>
            <div className="landing-static">
              <HomeLanding />
            </div>
          </>
        }
      >
        <HomeSwitch landing={<HomeLanding />} />
      </Suspense>
    </>
  );
}
