import { Eye } from "lucide-react";
import { Switch, Alert, usePermissions, IconButton} from "@/shared";
import quotationService from "@/shared/services/quotationService";
import { quotationUrl } from "@/shared/utils/quotationFiles";
import { useState } from "react";

export default function QuotationRowActions({ quotation, onChanged }) {
  const { can } = usePermissions();
  const [toggling, setToggling] = useState(false);

  // Se abre en una pestaña nueva y no en un modal: el navegador ya trae un visor
  // de PDF con zoom, búsqueda e impresión, y meterlo en un <iframe> dentro de un
  // modal sería una versión peor del mismo visor.
  const verCotizacion = () => {
    const url = quotationUrl(quotation);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleToggle = async () => {
    const result = await Alert.warning(
      `¿${quotation.isActive ? "Deshabilitar" : "Habilitar"} cotización?`,
      quotation.isActive
        ? `"${quotation.fileName}" dejará de ofrecerse al crear o editar materiales. Los materiales que ya la tienen asignada la conservan.`
        : `"${quotation.fileName}" volverá a ofrecerse al crear o editar materiales.`,
    );
    if (!result.isConfirmed) return;

    setToggling(true);
    try {
      const actualizada = await quotationService.toggle(quotation.id);
      const asignados = actualizada?.data?.materialesAsignados ?? 0;
      Alert.success(
        `Cotización ${quotation.isActive ? "deshabilitada" : "habilitada"}`,
        quotation.isActive && asignados > 0
          ? `Sigue respaldando ${asignados} material(es).`
          : "",
      );
      onChanged?.();
    } catch (err) {
      Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
      onChanged?.();
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {can("toggle_quotation") && (
        <Switch
          checked={quotation.isActive}
          onChange={handleToggle}
          disabled={toggling}
          size="sm"
          className="inline-flex"
        />
      )}

      <IconButton onClick={verCotizacion} ariaLabel={`Ver ${quotation.fileName}`} title="Ver cotización" hitSize={36} iconSize={16}><Eye size={16} /></IconButton>
    </div>
  );
}
