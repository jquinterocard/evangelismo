import { Suspense } from "react";
import { HomeLanding } from "./HomeLanding";
import { HomeSwitch } from "./HomeSwitch";

// Evita mostrar la portada un instante a quien llega desde un QR (antes de hidratar).
const qrPreload = `try{if(/[?&]qr=/.test(location.search))document.documentElement.classList.add("from-qr")}catch(e){}`;

export default function HomePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: qrPreload }} />
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
