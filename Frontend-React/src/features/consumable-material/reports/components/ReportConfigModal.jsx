// Hook para manejo de estado local en componentes funcionales
import { useState } from "react";


// Configuración de campos disponibles para el reporte
import { consumableReportFields } from "../config/consumableReportFields";


// Caso de uso que orquesta la generación del reporte
import { generateConsumableReport } from "../services/generateConsumableReport";


// Componentes UI reutilizables (design system)
import {
    Button,
    Input,
    Select,
    Checkbox
} from "@/shared";



// Componente modal para configuración de reportes de materiales consumibles
export default function ReportConfigModal({ isOpen, onClose, materials = [], statusLabel }) {
    // Estado del formato de salida
    const [format, setFormat] = useState("pdf");


    // Estado del alcance del reporte
    const [scope, setScope] = useState("all");


    // Estado para filtro por placa SENA
    const [documentNumber, setDocumentNumber] = useState("");


    // Estado de campos seleccionados (inicialización lazy)
    const [selectedFields, setSelectedFields] = useState(
        () => consumableReportFields.filter((f) => f.default), // Solo campos marcados por defecto
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
        generateConsumableReport({
            materials,
            format,
            selectedFields,
            scope,
            documentNumber,
            statusLabel,
        });


        // Cierra el modal después de generar el reporte
        onClose();
    };


    return (
    // Overlay del modal
    <div
        className="
            fixed inset-0 z-50 flex items-center justify-center bg-black/40
        "
    >
        {/* Contenedor del modal */}
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
        >
        {/* Título */}
        <h2 className="mb-6 text-xl font-semibold">
            Generar reporte de materiales consumibles
        </h2>


        {/* Selección de formato */}
        <div className="mb-4">
            <Select
            label="Formato del reporte"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={[
                { id: "pdf", label: "PDF", value: "pdf" },
                { id: "excel", label: "Excel", value: "excel" },
            ]}
            />
        </div>


        {/* Selección de campos */}
        <div className="mb-4">
            <p className="mb-2 font-medium">Campos del reporte</p>


            {/* Grid de checkboxes */}
            <div className="grid grid-cols-2 gap-2">
            {consumableReportFields.map((field) => {
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
                { id: "all", label: "Todos los materiales", value: "all" },
                { id: "placa_sena", label: "Filtrar por placa SENA", value: "placa_sena" },
            ]}
            />
        </div>


        {/* Campo condicional para filtro por placa SENA */}
        {scope === "placa_sena" && (
            <div className="mb-4">
            <Input
                label="Placa SENA"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ingrese la placa SENA"
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