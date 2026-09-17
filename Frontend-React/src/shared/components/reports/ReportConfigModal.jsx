import { useState } from "react";
import { Modal, Button, Input, Select, Checkbox } from "@/shared";

/**
 * Configuración de un reporte: formato, campos, alcance y filtros.
 *
 * Estaba escrito CINCO veces —usuarios, consumibles, devolutivos, préstamos y
 * tareas— con el mismo formulario y solo cambiando el título, la lista de campos
 * y las opciones de alcance. Cuatro de esas copias además dibujaban el overlay a
 * mano en vez de usar el `Modal` del proyecto, así que ni siquiera se cerraban
 * igual. Al pedir el filtro por inventarios habrían sido cinco sitios que tocar,
 * así que se extrajo aquí.
 *
 * Cada módulo conserva su propio `reports/components/ReportConfigModal.jsx`, pero
 * ahora es un envoltorio de unas pocas líneas: declara sus campos, su alcance y
 * a qué generador llamar.
 *
 * Props:
 * - `fields`: [{ key, label, default }] — los campos disponibles del reporte.
 * - `scopeOptions`: [{ value, label, input?: { label, placeholder } }]. La opción
 *   con `input` despliega un campo de texto cuyo valor viaja como `scopeValue`.
 * - `inventoryOptions`: si se pasa, se dibuja el filtro por inventarios
 *   (selección múltiple) y los ids elegidos viajan como `inventoryIds`.
 * - `onGenerate({ format, selectedFields, scope, scopeValue, inventoryIds })`.
 *
 * El cuerpo va en un componente aparte que solo se monta cuando está abierto:
 * así cada apertura arranca con los campos por defecto sin un useEffect que haga
 * setState (regla react-hooks/set-state-in-effect).
 */
export default function ReportConfigModal({
    isOpen,
    onClose,
    title,
    fields,
    scopeOptions,
    inventoryOptions,
    onGenerate,
}) {
    if (!isOpen) return null;

    return (
        <ReportConfigBody
            onClose={onClose}
            title={title}
            fields={fields}
            scopeOptions={scopeOptions}
            inventoryOptions={inventoryOptions}
            onGenerate={onGenerate}
        />
    );
}

const FORMAT_OPTIONS = [
    { value: "pdf", label: "PDF" },
    { value: "excel", label: "Excel" },
];

function ReportConfigBody({ onClose, title, fields, scopeOptions, inventoryOptions, onGenerate }) {
    const [format, setFormat] = useState("pdf");
    const [selectedKeys, setSelectedKeys] = useState(
        () => fields.filter((f) => f.default).map((f) => f.key),
    );
    const [scope, setScope] = useState(scopeOptions?.[0]?.value ?? "all");
    const [scopeValue, setScopeValue] = useState("");
    const [inventoryIds, setInventoryIds] = useState([]);

    // Se guardan las CLAVES y no los objetos: guardar los objetos obligaba a
    // buscarlos por key para saber si estaban marcados, y el orden de las
    // columnas acababa siendo el de los clics en vez del de la lista.
    const toggle = (key) =>
        setSelectedKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );

    const opcionAlcance = scopeOptions?.find((o) => o.value === scope);

    const handleGenerate = () => {
        // El orden de las columnas es el de `fields`, no el de los clics
        const selectedFields = fields.filter((f) => selectedKeys.includes(f.key));
        onGenerate({
            format,
            selectedFields,
            scope,
            scopeValue,
            inventoryIds,
        });
        onClose?.();
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={title}
            size="md"
            // Formulario: un clic fuera no puede descartar lo elegido
            closeOnBackdrop={false}
            showCloseButton={false}
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={selectedKeys.length === 0}
                        title={selectedKeys.length === 0 ? "Elige al menos un campo" : undefined}
                    >
                        Generar reporte
                    </Button>
                </>
            }
        >
            <div className="grid gap-5">
                <Select
                    label="Formato del reporte"
                    name="format"
                    options={FORMAT_OPTIONS}
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                />

                <div>
                    <p className="font-secondary text-medium font-medium mb-2">Campos del reporte</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {fields.map((field) => (
                            <Checkbox
                                key={field.key}
                                id={`campo-${field.key}`}
                                name={field.key}
                                label={field.label}
                                checked={selectedKeys.includes(field.key)}
                                onChange={() => toggle(field.key)}
                            />
                        ))}
                    </div>
                </div>

                {/* (p48) Filtro por inventarios: selección múltiple con casillas.
                    Sin elegir ninguno entran TODOS, que es lo que la gente espera
                    de un filtro vacío. */}
                {inventoryOptions && (
                    <Select
                        label="Inventarios (vacío = todos)"
                        variant="search"
                        multiple
                        name="inventoryIds"
                        options={inventoryOptions}
                        // El tope por defecto del Select son 5 coincidencias, y
                        // aquí eso haría creer que el sistema solo tiene cinco
                        // inventarios. La lista ya se desplaza (max-h-60), así
                        // que se sube el tope y el buscador sigue estando para
                        // listas largas.
                        maxMatches={50}
                        value={inventoryIds}
                        onChange={(e) => setInventoryIds(e.target.value)}
                    />
                )}

                {scopeOptions && (
                    <Select
                        label="Alcance del reporte"
                        name="scope"
                        options={scopeOptions.map(({ value, label }) => ({ value, label }))}
                        value={scope}
                        onChange={(e) => { setScope(e.target.value); setScopeValue(""); }}
                    />
                )}

                {opcionAlcance?.input && (
                    <Input
                        label={opcionAlcance.input.label}
                        name="scopeValue"
                        placeholder={opcionAlcance.input.placeholder}
                        value={scopeValue}
                        onChange={(e) => setScopeValue(e.target.value)}
                    />
                )}
            </div>
        </Modal>
    );
}
