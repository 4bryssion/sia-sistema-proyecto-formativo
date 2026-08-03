import { useState } from "react";
import { Select, Input, Button, IconButton } from "@/shared";
import { Trash2 } from "lucide-react";
import { getTypeLabel } from "../utils/materialOptions";

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "consumible", label: "Consumible" },
  { value: "devolutivo", label: "Devolutivo" },
];

export default function LoanMaterialLines({
  lines,
  options,          // [{ value, label, type, available }] consumibles + devolutivos
  onChange,         // (idx, field, value) => void
  onAdd,            // () => void
  onRemove,         // (idx) => void
  errors = [],
  generalError,
}) {
  const [typeFilter, setTypeFilter] = useState("all");

  const byType =
    typeFilter === "all" ? options : options.filter((o) => o.type === typeFilter);

  const opcionDe = (materialId) =>
    options.find((o) => String(o.value) === String(materialId));

  return (
    <div className="flex flex-col gap-4 w-full">
      <span className="font-secondary text-h3">Materiales del préstamo</span>

      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="border rounded px-3 py-2 font-secondary bg-white text-text-primary"
      >
        {TYPE_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {lines.map((line, idx) => {
        const taken = lines
          .filter((_, i) => i !== idx)
          .map((l) => l.materialId)
          .filter(Boolean);

        let lineOptions = byType.filter((o) => !taken.includes(String(o.value)));

        // El material ya elegido en ESTA línea debe seguir en su propia lista
        // aunque el filtro de tipo lo excluya; si no, el select se vaciaría solo
        if (line.materialId && !lineOptions.some((o) => String(o.value) === String(line.materialId))) {
          const current = opcionDe(line.materialId);
          if (current) lineOptions = [current, ...lineOptions];
        }

        const seleccionado = opcionDe(line.materialId);

        return (
          // La cantidad ya no es un número suelto: muestra "0/28", así que
          // necesita más ancho del 1fr contra 2fr que tenía. El minmax le pone
          // un piso: con topes de tres cifras ("100/250") el select no puede
          // seguir comiéndose el espacio.
          <div key={idx} className="grid grid-cols-[minmax(0,1.4fr)_minmax(104px,1fr)_auto] gap-3 items-end w-full">
            {/* El label solo aparece con material elegido: antes de elegir no hay
                tipo que anunciar, y una etiqueta vacía desalinearía la fila */}
            {/* widthClass="w-full": el tope de 320px que traen Select e Input por
                defecto dejaría el campo corto dentro de una celda más ancha */}
            <Select
              variant="search"
              widthClass="w-full"
              label={seleccionado ? getTypeLabel(seleccionado.type) : undefined}
              name={`materialId-${idx}`}
              value={line.materialId}
              onChange={(e) => onChange(idx, "materialId", e.target.value)}
              options={lineOptions}
              error={errors[idx]?.materialId}
            />

            {/* Cantidad sobre el disponible: se escribe a la izquierda del "/" y
                el tope lo pone el propio material. El recorte al máximo vive en
                el padre (handleMaterialChange), que es quien conoce las opciones */}
            <Input
              widthClass="w-full"
              name={`borrowedQuantity-${idx}`}
              label={seleccionado ? "Cantidad" : undefined}
              type="text"
              inputMode="numeric"
              placeholder="Cantidad"
              suffix={seleccionado ? `/${seleccionado.available}` : undefined}
              value={line.borrowedQuantity}
              onChange={(e) => onChange(idx, "borrowedQuantity", e.target.value)}
              error={errors[idx]?.borrowedQuantity}
            />

            {lines.length > 1 && (
              <IconButton
                ariaLabel="Quitar material"
                onClick={() => onRemove(idx)}
                className="justify-self-center sm:justify-self-end"
              >
                <Trash2 size={18} />
              </IconButton>
            )}
          </div>
        );
      })}

      {/* El botón va DEBAJO de las líneas: al agregar una, la nueva aparece justo
          encima y el botón baja con ella, que es hacia donde sigue el ojo */}
      <Button variant="secondary" size="sm" onClick={onAdd} className="self-start">
        + Agregar material
      </Button>

      {generalError && (
        <p className="text-error text-caption font-secondary">{generalError}</p>
      )}
    </div>
  );
}
