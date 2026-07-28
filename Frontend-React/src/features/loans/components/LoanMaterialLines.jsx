  import { useState } from "react";
  import { Select, Input, Button, IconButton } from "@/shared";
  import { Trash2 } from "lucide-react";

  const TYPE_FILTER_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "consumible", label: "Consumible" },
    { value: "devolutivo", label: "Devolutivo" },
  ];

  export default function LoanMaterialLines({
    lines,
    options,          // [{ value, label, type }] consumibles + devolutivos
    onChange,         // (idx, field, value) => void
    onAdd,            // () => void
    onRemove,         // (idx) => void
    errors = [],
    generalError,
  }) {
    const [typeFilter, setTypeFilter] = useState("all");

    const byType =
      typeFilter === "all" ? options : options.filter((o) => o.type === typeFilter);

    return (
      <div className="flex flex-col gap-4 w-full">
        <span className="font-secondary text-h3">Materiales del préstamo</span>
        <div className="flex items-center justify-between">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded px-3 py-2 font-secondary"
            >
              {TYPE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <Button variant="secondary" size="sm" onClick={onAdd}>
              + Agregar material
            </Button>
          </div>
        </div>
                    {lines.map((line, idx) => {
              const taken = lines
                .filter((_, i) => i !== idx)
                .map((l) => l.materialId)
                .filter(Boolean);

              let lineOptions = byType.filter((o) => !taken.includes(String(o.value)));

              if (line.materialId && !lineOptions.some((o) => String(o.value) === String(line.materialId))) {
                const current = options.find((o) => String(o.value) === String(line.materialId));
                if (current) lineOptions = [current, ...lineOptions];
              }

              return (
                // Cambio: se ajustó la grid para que el select ocupe más espacio que el input
                <div key={idx} className="grid grid-cols-[2fr_1fr_auto] gap-3 items-center w-full">
                  <Select
                    variant="search"
                    name={`materialId-${idx}`}
                    value={line.materialId}
                    onChange={(e) => onChange(idx, "materialId", e.target.value)}
                    options={lineOptions}
                    error={errors[idx]?.materialId}
                  />
                  <Input
                    name={`borrowedQuantity-${idx}`}
                    type="number"
                    placeholder="Cantidad"
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


    


        {generalError && (
          <p className="text-error text-caption font-secondary">{generalError}</p>
        )}
      </div>
    );
  }
