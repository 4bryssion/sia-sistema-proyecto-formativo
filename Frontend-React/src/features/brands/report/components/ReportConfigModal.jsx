// Hook para manejo de estado local en componentes funcionales
import { useState } from "react";

// Configuración de campos disponibles para el reporte
import { brandReportFields } from "../config/brandReportFields";

// Caso de uso que orquesta la generación del reporte
import { generateBrandReport } from "../services/generateBrandReport";

// Componentes UI reutilizables (design system)
import { Button, Input, Select, Checkbox } from "@/shared";

// Componente modal para configuración de reportes
export default function ReportConfigModal({ isOpen, onClose }) {
  // Estado del formato de salida
  const [format, setFormat] = useState("pdf");

  // Estado del alcance del reporte
  const [scope, setScope] = useState("all");

  // Estado para filtro por documento
  const [documentNumber, setDocumentNumber] = useState("");

  // Estado de campos seleccionados (inicialización lazy)
  const [selectedFields, setSelectedFields] = useState(
    () => brandReportFields.filter((f) => f.default), // Solo campos marcados por defecto
  );

  // Control de render: si el modal no está abierto, no se monta en el DOM
  if (!isOpen) return null;

  // Handler para activar/desactivar campos del reporte
  const handleFieldToggle = (field) => {
    // Verifica si el campo ya está seleccionado
    const exists = selectedFields.find((f) => f.key === field.key);

    if (exists) {
      // Elimina el campo si ya existe
      setSelectedFields(selectedFields.filter((f) => f.key !== field.key));
    } else {
      // Agrega el campo si no existe
      setSelectedFields([...selectedFields, field]);
    }
  };

  // Handler principal para generar el reporte
  const handleGenerateReport = () => {
    // Invoca el caso de uso con la configuración actual
    generateBrandReport({
      format,
      selectedFields,
      scope,
      documentNumber,
    });


    // Cierra el modal después de generar el reporte
    onClose();
  };


  return (
    // Overlay del modal
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Contenedor del modal */}
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        {/* Título */}
        <h2 className="mb-6 text-xl font-semibold">
          Generar reporte de marcas
        </h2>


        {/* Selección de formato */}
        <div className="mb-4">
          <Select
            label="Formato del reporte"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={[
              { label: "PDF", value: "pdf" },
              { label: "Excel", value: "excel" },
            ]}
          />
        </div>


        {/* Selección de campos */}
        <div className="mb-4">
          <p className="mb-2 font-medium">Campos del reporte</p>


          {/* Grid de checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            {brandReportFields.map((field) => {
              // Determina si el campo está seleccionado
              const checked = selectedFields.some((f) => f.key === field.key);


              return (
                <Checkbox
                  key={field.key} // Key única para renderizado
                  id={field.key} // Id accesible
                  name={field.key} // Nombre del campo
                  label={field.label} // Texto visible
                  checked={checked} // Estado controlado
                  onChange={() => handleFieldToggle(field)} // Toggle
                />
              );
            })}
          </div>
        </div>


        {/* Selección de alcance */}
        <div className="mb-4">
          <Select
            label="Alcance del reporte"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            options={[
              { label: "Todos los usuarios", value: "all" },
              { label: "Filtrar por documento", value: "document" },
            ]}
          />
        </div>


        {/* Campo condicional para filtro por documento */}
        {scope === "document" && (
          <div className="mb-4">
            <Input
              label="Número de documento"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ingrese número de documento"
            />
          </div>
        )}


        {/* Acciones del modal */}
        <div className="flex justify-end gap-2 mt-6">
          {/* Botón cancelar */}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>


          {/* Botón generar reporte */}
          <Button variant="primary" onClick={handleGenerateReport}>
            Generar reporte
          </Button>
        </div>
      </div>
    </div>
  );
}


