import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import logo from "@/assets/logos/logo-sena-verde.png";
import bg from "@/assets/images/background-oscuro.jpg";
import { Button, Alert } from "@/shared";
import loanService from "../services/loanService";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";

const fmt = (d) => (d ? String(d).slice(0, 10) : "—");

// Pantalla pública: llega desde el enlace del correo (P40), sin login.
export default function SignLoanPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState(null);
  const [signResult, setSignResult] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setInfo(await loanService.getSignatureInfo(token));
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Enlace de firma inválido o expirado.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSign = async () => {
    setSigning(true);
    setSignError(null);
    try {
      Alert.loading("Registrando firma...");
      const result = await loanService.sign(token);
      Alert.close();
      Alert.success("Préstamo firmado", "Tu firma quedó registrada correctamente.");
      setSignResult(result);
    } catch (err) {
      Alert.close();
      const msg = err.response?.data?.error ?? "Error al firmar el préstamo.";
      Alert.error("No se pudo firmar", msg);
      setSignError(msg);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${bg})` }} />

      <div className="grid gap-4 mx-6 p-8 sm:p-12 justify-items-center max-w-max bg-white border rounded-md my-8">
        <img src={logo} alt="logo" className="h-24" />
        <h1 className="text-h3 font-main font-bold text-center">Firma de Préstamo</h1>

        {!token && (
          <p className="font-secondary text-body text-error text-center max-w-sm">
            Enlace inválido: falta el token de firma.
          </p>
        )}

        {token && loading && (
          <p className="font-secondary text-body text-center">Cargando información del préstamo...</p>
        )}

        {token && !loading && loadError && (
          <p className="font-secondary text-body text-error text-center max-w-sm">{loadError}</p>
        )}

        {token && !loading && !loadError && info && !signResult && (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <div className="font-secondary text-body grid gap-1">
              <p><strong>Firmante:</strong> {info.signerName} ({info.party})</p>
              <p><strong>Grupo:</strong> {info.apprenticeGroup}</p>
              <p><strong>Justificación:</strong> {info.useJustification}</p>
              <p><strong>Fecha de inicio:</strong> {fmt(info.loanDate)}</p>
              <p><strong>Fecha de devolución:</strong> {fmt(info.returnDate)}</p>
              <p><strong>Estado del préstamo:</strong> {getLoanStatusLabel(info.status)}</p>
            </div>

            <div className="font-secondary text-body">
              <strong>Materiales:</strong>
              <ul className="list-disc ml-5">
                {info.materials?.map((m, i) => (
                  <li key={i}>{m.materialName} × {m.borrowedQuantity}</li>
                ))}
              </ul>
            </div>

            {info.alreadySigned && (
              <p className="font-secondary text-caption text-center text-green-700">
                Ya firmaste este préstamo.
              </p>
            )}

            {!info.alreadySigned && info.status !== "Pendiente_confirmacion" && (
              <p className="font-secondary text-caption text-center text-error">
                Este préstamo ya no está pendiente de firma.
              </p>
            )}

            {!info.alreadySigned && info.status === "Pendiente_confirmacion" && (
              <>
                {signError && (
                  <p className="font-secondary text-caption text-error text-center">{signError}</p>
                )}
                <div className="flex items-center justify-center">
                  <Button variant="primary" size="md" disabled={signing} onClick={handleSign}>
                    {signing ? "Firmando..." : "Firmar préstamo"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {signResult && (
          <div className="flex flex-col gap-2 items-center max-w-sm">
            <p className="font-secondary text-body text-center text-green-700">{signResult.mensaje}</p>
            {signResult.status === "Activo" && (
              <p className="font-secondary text-caption text-center">
                Ambas partes firmaron: el préstamo quedó Activo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
