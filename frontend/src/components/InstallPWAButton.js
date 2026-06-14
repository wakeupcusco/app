import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadSimple, X } from "@phosphor-icons/react";

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");
    setIsStandalone(standalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showInstall) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#4A5D23] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md mx-4"
      data-testid="install-pwa-banner"
    >
      <div className="flex-1">
        <p className="font-semibold text-sm">Instalar Plantástika</p>
        <p className="text-xs text-white/80">Acceso rápido desde la pantalla de inicio</p>
      </div>
      <Button
        onClick={handleInstall}
        size="sm"
        variant="secondary"
        className="bg-white text-[#4A5D23] hover:bg-white/90"
        data-testid="install-pwa-button"
      >
        <DownloadSimple size={16} weight="bold" className="mr-1" />
        Instalar
      </Button>
      <button
        onClick={() => setShowInstall(false)}
        className="text-white/80 hover:text-white"
        data-testid="dismiss-install-button"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default InstallPWAButton;
