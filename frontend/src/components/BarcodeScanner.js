import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "@phosphor-icons/react";
import { toast } from "sonner";

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const startScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!isMounted) return;
        
        const html5QrCode = new Html5Qrcode("barcode-scanner-region");
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Ignore scan errors
          }
        );
        setScanning(true);
      } catch (error) {
        console.error("Error iniciando escáner:", error);
        toast.error("No se pudo acceder a la cámara. Verifica los permisos.");
        onClose();
      }
    };

    const timer = setTimeout(startScanner, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // Ignore
      }
    }
    setScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="barcode-scanner-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={24} weight="duotone" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            id="barcode-scanner-region"
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ minHeight: "300px" }}
            data-testid="barcode-scanner-region"
          />
          <p className="text-sm text-[#6B705C] text-center">
            Apunta la cámara al código de barras del producto
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full"
            data-testid="close-scanner-button"
          >
            <X size={18} className="mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
