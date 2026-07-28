import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, Checkbox, Alert } from "@/shared";
import { CornerDownLeft } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import loanReturnService from "../services/loanReturnService";
import loanService from "@/features/loans/services/loanService";
import { loanReturnLineSchema } from "../schemas/loanReturnSchema";

// Espejo del enum MaterialStatus del backend admitido para retornos serializados (§7.1 P41).
const MATERIAL_STATUS_OPTIONS = [
  { value: "Disponible", label: "Disponible" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "Baja", label: "Baja" },
];

export default function LoanReturnRight({ loan }) {
  const navigate = useNavigate();

  const [lines, setLines]         = useState([]);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors]       = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Determina qué materiales ya tienen retorno activo registrado, consultando los retornos
  // existentes y filtrando por este préstamo (el detalle de préstamo no incluye loanReturns).
  useEffect(() => {
    (async () => {
      setLoadingLines(true);
      setLoadError(null);
      try {
        const allReturns = await loanReturnService.getAll();
        const returnedMaterialIds = new Set(
          allReturns
            .filter((r) => r.loanId === Number(loan.id) && r.isActive)
            .map((r) => r.materialId)
        );

        setLines(
          (loan.materials ?? []).map((lm) => {
            const material = lm.consumableMaterial;
            const isQuantityType = material?.quantity != null;
            const alreadyReturned = returnedMaterialIds.has(lm.materialId);
            return {
              materialId: lm.materialId,
              materialName: material?.materialName ?? `#${lm.materialId}`,
              borrowedQuantity: lm.borrowedQuantity,
              isQuantityType,
              alreadyReturned,
              selected: false,
              remainingQuantity: "",
              materialStatus: "",
              observations: "",
            };
          })
        );
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar los retornos del préstamo.");
      } finally {
        setLoadingLines(false);
      }
    })();
  }, [loan]);

  const handleLineField = (idx, field, value) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const handleToggleSelected = (idx) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, selected: !l.selected } : l)));

  const handleSubmit = async () => {
    setFormError(null);

    const selectedLines = lines
      .map((l, idx) => ({ ...l, idx }))
      .filter((l) => l.selected && !l.alreadyReturned);

    if (selectedLines.length === 0) {
      setFormError("Marque al menos un material para registrar su retorno.");
      return;
    }

    // Validar todas las líneas marcadas antes de enviar nada.
    const lineErrors = {};
    for (const line of selectedLines) {
      const result = loanReturnLineSchema.safeParse(line);
      if (!result.success) {
        const fe = {};
        result.error.issues.forEach((issue) => { fe[issue.path[0]] = issue.message; });
        lineErrors[line.idx] = fe;
      }
    }
    if (Object.keys(lineErrors).length > 0) {
      setErrors(lineErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const failedLines = [];

    // Secuencial con try/catch por línea: una línea fallida no bloquea las demás.
    for (const line of selectedLines) {
      try {
        await loanReturnService.create({
          loanId: Number(loan.id),
          materialId: Number(line.materialId),
          ...(line.isQuantityType
            ? { remainingQuantity: Number(line.remainingQuantity) }
            : { materialStatus: line.materialStatus }),
          ...(line.observations ? { observations: line.observations } : {}),
        });
      } catch (err) {
        failedLines.push(`${line.materialName}: ${err.response?.data?.error ?? "Error al registrar el retorno."}`);
      }
    }

    if (failedLines.length > 0) {
      setSubmitting(false);
      Alert.error("Error al registrar el retorno", failedLines.join(" · "));
      setFormError(failedLines.join(" · "));
      return;
    }

    // La respuesta del retorno no incluye el estado del préstamo (el include del backend no lo
    // selecciona) — se confirma re-consultando el préstamo tras registrar todas las líneas.
    let finalized = false;
    try {
      const refreshed = await loanService.getById(loan.id);
      finalized = refreshed.status === "Finalizado";
    } catch {
      // Si la relectura falla, se continúa sin bloquear al usuario con un retorno ya registrado.
    }
    setSubmitting(false);

await Alert.success(
      "Retorno registrado",
      finalized
        ? "Todos los materiales fueron devueltos: el préstamo quedó Finalizado."
        : "Retorno(s) registrado(s) correctamente."
    );
    navigate("/dashboard/loans");
  };

  return (
    <div className="relative">
      {/* Título */}
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Retorno de Préstamo
        </h2>
      </div>

      {loadingLines && <p className="font-secondary text-body text-center">Cargando materiales...</p>}
      {loadError && <p className="font-secondary text-body text-error text-center">{loadError}</p>}

      {!loadingLines && !loadError && (
        <div className="flex flex-col gap-6 w-full">
          {lines.map((line, idx) => (
            <div key={line.materialId} className="border border-border rounded-md p-4 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Checkbox
                  id={`return-${line.materialId}`}
                  label={`${line.materialName} — prestado ${line.borrowedQuantity}`}
                  checked={line.selected}
                  disable={line.alreadyReturned}
                  onChange={() => handleToggleSelected(idx)}
                />
                {line.alreadyReturned && (
                  <span className="font-secondary text-caption text-green-700">Retornado</span>
                )}
              </div>

              {!line.alreadyReturned && line.selected && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {line.isQuantityType ? (
                    <Input
                      label="Cantidad sobrante"
                      type="number"
                      min={0}
                      max={line.borrowedQuantity}
                      value={line.remainingQuantity}
                      onChange={(e) => handleLineField(idx, "remainingQuantity", e.target.value)}
                      error={errors[idx]?.remainingQuantity}
                    />
                  ) : (
                    <div>
                      <Select
                        label="Estado del material"
                        options={MATERIAL_STATUS_OPTIONS}
                        value={line.materialStatus}
                        onChange={(e) => handleLineField(idx, "materialStatus", e.target.value)}
                        error={errors[idx]?.materialStatus}
                      />
                      <p className="font-secondary text-caption text-gray-600 mt-1">
                        Este será el nuevo estado reflejado del material una vez devuelto.
                      </p>
                    </div>
                  )}

                  <Input
                    label="Observaciones"
                    placeholder="Observaciones (opcional)"
                    value={line.observations}
                    onChange={(e) => handleLineField(idx, "observations", e.target.value)}
                    error={errors[idx]?.observations}
                  />
                </div>
              )}
            </div>
          ))}

          {lines.length === 0 && (
            <p className="font-secondary text-body text-center">Este préstamo no tiene materiales.</p>
          )}
        </div>
      )}

      {formError && <p className="text-error font-secondary text-center mt-4">{formError}</p>}

      {/* Acciones + Logo: en un mismo contenedor flex con wrap para que
          nunca se superpongan, sin importar el ancho de pantalla */}
      <div className="flex flex-wrap items-center justify-end gap-6 mt-6">
        <div className="flex flex-wrap justify-end gap-3 flex-1 min-w-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            className="gap-2"
            disabled={submitting || loadingLines}
            onClick={handleSubmit}
          >
            <CornerDownLeft size={16} />
            {submitting ? "Registrando..." : "Registrar retorno"}
          </Button>
        </div>

        {/* Logo SENA */}
        <img src={logo} alt="Logo SENA" className="w-16 shrink-0" />
      </div>
    </div>
  );
}
