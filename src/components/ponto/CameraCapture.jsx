import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, Loader2 } from "lucide-react";

export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPreview(null);
      setError("");
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;

      let attempts = 0;
      while (!videoRef.current && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        attempts++;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) return resolve();
          videoRef.current.onloadeddata = () => resolve();
          setTimeout(resolve, 3000);
        });
      }
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (w === 0 || h === 0) {
      setError("Câmera não está pronta. Aguarde e tente novamente.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    setPreview(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  const retake = () => {
    setPreview(null);
    setError("");
    startCamera();
  };

  const confirm = async () => {
    setIsUploading(true);
    try {
      const blob = await (await fetch(preview)).blob();
      const file = new File([blob], "professor_foto.jpg", {
        type: "image/jpeg",
      });
      await onCapture(file);
      onClose();
    } catch {
      setError("Erro ao salvar a foto. Tente novamente.");
    }
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tirar foto do professor</DialogTitle>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        ) : (
          <div className="space-y-3">
            {preview ? (
              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {error ? (
            <Button variant="outline" onClick={onClose} className="w-full">
              Fechar
            </Button>
          ) : preview ? (
            <>
              <Button
                variant="outline"
                onClick={retake}
                className="flex-1"
                disabled={isUploading}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Tirar outra
              </Button>
              <Button
                onClick={confirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Confirmar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={capture}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="w-4 h-4 mr-2" /> Capturar foto
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}