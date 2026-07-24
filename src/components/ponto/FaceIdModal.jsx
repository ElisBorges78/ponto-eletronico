import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, XCircle, Loader2, UserCheck } from "lucide-react";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { Professor } from "@/entities/Professor";
import { RegistroPonto } from "@/entities/RegistroPonto";
import {
  getDataHoje,
  formatarHora,
  getProximaAcao,
} from "@/lib/pontoUtils";

export default function FaceIdModal({ open, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState("camera");
  const [matchedProfessor, setMatchedProfessor] = useState(null);
  const [acaoRegistrada, setAcaoRegistrada] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  useEffect(() => {
    if (open) {
      setStep("camera");
      setMatchedProfessor(null);
      setErrorMessage("");
      setAcaoRegistrada("");
      setCapturedPhoto(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      // Aguarda o elemento de vídeo estar disponível no DOM
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;

      // Tenta anexar o stream ao vídeo, com retry caso o elemento ainda não exista
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
    } catch (error) {
      setErrorMessage(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      );
      setStep("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (width === 0 || height === 0) {
      setErrorMessage("Câmera não está pronta. Aguarde o vídeo aparecer e tente novamente.");
      setStep("error");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    // Gera pré-visualização da foto capturada
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
    setStep("preview");
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setStep("camera");
    startCamera();
  };

  const confirmAndProcess = async () => {
    setStep("verifying");

    try {
      const blob = await new Promise((resolve) =>
        canvasRef.current.toBlob(resolve, "image/jpeg", 0.8)
      );

      if (!blob) {
        setErrorMessage("Falha ao processar a imagem. Tente novamente.");
        setStep("error");
        return;
      }

      const file = new File([blob], "face_id.jpg", { type: "image/jpeg" });
      const { file_url } = await UploadFile({ file });

      const professors = await Professor.filter({ ativo: true });
      const profsWithPhotos = professors.filter((p) => p.foto_url);

      if (profsWithPhotos.length === 0) {
        setErrorMessage(
          "Nenhum professor com foto cadastrada. Cadastre professores na aba Professores."
        );
        setStep("error");
        return;
      }

      const allPhotos = [file_url, ...profsWithPhotos.map((p) => p.foto_url)];
      const professorList = profsWithPhotos
        .map((p, i) => `Imagem ${i + 2}: ${p.nome}`)
        .join("\n");

      const result = await InvokeLLM({
        prompt: `A Imagem 1 é uma foto capturada agora em um relógio de ponto. As imagens seguintes são fotos de referência de professores cadastrados:\n${professorList}\n\nCompare a foto capturada (Imagem 1) com cada foto de referência. Identifique qual professor corresponde à pessoa na foto capturada. Se houver correspondência, retorne o nome exato do professor. Responda em JSON: { "match": boolean, "professor_nome": string ou null, "confianca": number de 0 a 1 }`,
        file_urls: allPhotos,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            match: { type: "boolean" },
            professor_nome: { type: ["string", "null"] },
            confianca: { type: "number" },
          },
        },
      });

      if (result.match && result.professor_nome) {
        const matchedProf = profsWithPhotos.find(
          (p) =>
            p.nome === result.professor_nome ||
            p.nome
              .toLowerCase()
              .includes(result.professor_nome.toLowerCase()) ||
            result.professor_nome
              .toLowerCase()
              .includes(p.nome.toLowerCase())
        );

        if (matchedProf) {
          const acao = await registrarPonto(matchedProf);
          if (acao) {
            setMatchedProfessor(matchedProf);
            setAcaoRegistrada(acao);
            setStep("success");
            if (onSuccess) onSuccess();
          }
        } else {
          setErrorMessage(
            "Professor identificado mas não encontrado no cadastro."
          );
          setStep("error");
        }
      } else {
        setErrorMessage(
          "Não foi possível identificar o professor. Tente novamente."
        );
        setStep("error");
      }
    } catch (error) {
      console.error("Erro na verificação facial:", error);
      setErrorMessage("Erro ao processar verificação facial. Tente novamente.");
      setStep("error");
    }
  };

  const registrarPonto = async (professor) => {
    const hoje = getDataHoje();
    const existing = await RegistroPonto.filter({
      data: hoje,
      professor_id: professor.id,
    });

    const agora = new Date().toISOString();

    if (existing.length === 0) {
      await RegistroPonto.create({
        data: hoje,
        professor_id: professor.id,
        professor_nome: professor.nome,
        entrada: agora,
      });
      return "Entrada registrada";
    }

    const registro = existing[0];
    const proximaAcao = getProximaAcao(registro);

    if (proximaAcao === "nenhuma") {
      setErrorMessage(
        `${professor.nome} já completou o expediente de hoje.`
      );
      setStep("error");
      return null;
    }

    const acaoLabels = {
      saida_almoco: "Saída para almoço registrada",
      retorno_almoco: "Retorno do almoço registrado",
      saida: "Saída registrada",
    };

    await RegistroPonto.update(registro.id, {
      [proximaAcao]: agora,
    });

    return acaoLabels[proximaAcao] || "Ponto registrado";
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleRetry = () => {
    setStep("camera");
    setMatchedProfessor(null);
    setErrorMessage("");
    setCapturedPhoto(null);
    startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            Batida por Face ID
          </DialogTitle>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        {step === "camera" && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-44 border-2 border-white/40 rounded-[50%]"></div>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Posicione o rosto no círculo e clique em capturar
            </p>
            <Button
              onClick={capturePhoto}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar Foto
            </Button>
          </div>
        )}

        {step === "preview" && capturedPhoto && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
              <img
                src={capturedPhoto}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 text-center">
              Confirme se a foto está nítida e o rosto visível
            </p>
            <div className="flex gap-2">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
              >
                Tirar outra
              </Button>
              <Button
                onClick={confirmAndProcess}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Confirmar e verificar
              </Button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto" />
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Verificando...
              </p>
              <p className="text-sm text-slate-500">
                Comparando foto com professores cadastrados
              </p>
            </div>
          </div>
        )}

        {step === "success" && matchedProfessor && (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                Ponto registrado!
              </p>
              <p className="text-slate-600 mt-1">{matchedProfessor.nome}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">
                {acaoRegistrada}
              </p>
              <p className="text-sm text-slate-400">
                {formatarHora(new Date().toISOString())}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Concluir
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                Não foi possível registrar
              </p>
              <p className="text-sm text-slate-500 mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                Tentar novamente
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}