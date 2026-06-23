import { useState, useEffect } from "react";
import { consumableMaterialSchema } from "../schemas/consumableMaterialSchema.js";

import { 
    Input, 
    Button, 
    Select,
    FileInput 

} from "@/shared";

import documentTypeService from "@/features/users/services/documentTypeService.js";

export default function ConsumableMaterialRegisterForm() {

    // Estados:
    
    const [documentTypes, setDocumentTypes] = useState([]);

    const [formData, setFormData] = useState({
        consumableID: "Automático",
        consumableImage: [],

        consumableName: "",
        consumableBrand: "",
        consumableSenaPlate: "",
        consumableLocation: "",

        consumableQuantity: "",
        consumableState: "",
        consumableUnitValue: "",
        consumableTotalValue: "",

        consumableDatePurchase: "",
        consumableAccountant: "",
        consumableDescrption: ""
    });

    const [errors, setErrors] = useState({})

    // Efectos:

    useEffect (() => {
        documentTypeService.getAll().then(setDocumentTypes).catch(() => {});
    }, []);

    // ===========================================
    //                 Handles
    // ===========================================
    // Función que se ejecuta cada vez que cambia el valor de un input del formulario

    // Handle genérico:

    const handleChange = (e) => {
        // Se obtiene el nombre del campo y su valor
        const { name, value } = e.target;

        setFormData((prev) => ({
            // Se copian todos los valores anteriores del estado
            ...prev,

            // Se actualiza únicamente lo que cambió
            [name]: value
        }));
    }

    // Handles personalizados:
    
    // Función que se ejecuta cuando se envía el formulario 
    const handleSubmit = (e) => {
        e.preventDefault();

        // Se valida el objeto de formData usando el esquema definido con Zod
        // safeParse devuelve un objeto indicando si la validacion fue exitosa o no
        const result = consumableMaterialSchema.safeParse(formData);

        // Si la validación falla
        if (!result.success){
            // Objeto donde se almacenarán los errores por campo
            const fieldErrors = {};

            // Zod devuelve los errores en un arreglo llamado issues
            // Se recorren para asociar cada error a su campo correspondiente
            result.error.issues.forEach((issue) => {
                // Issue.path contiene la ruta del campo que falló
                const field = issue.path[0];

                // Se guarda el mensaje de error en el objeto fieldErrors
                fieldErrors[field] = issue.message;
            });

            // Se actualiza el estado de errores para mostrarlos en el formulario
            setErrors(fieldErrors);

            // Se detiene la ejecución porque el formulario tiene errores
            return;
        }

        // Si la validación es exitosa se limpian los errores anteriores 
        setErrors({});

        // result.data contiene los datos ya validados por Zod
        console.log("Material consumible valido:", result.data)

    };

    return (
        <div className="flex justify-center">
            <form
                className="
                    grid gap-6 mx-6 md:grid-cols-2 md:mx-12 1400:grid-cols-4 1400:mx-0 justify-items-center max-w-max
                "

                onSubmit={handleSubmit}
            >
                {/* Columna 1 */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <div className="flex-1 flex">
                        <FileInput
                            className="flex-1"
                            accept="image/*"
                            multiple={false}
                            value={formData.consumableImage}
                            onChange={(files) => setFormData((prev) => ({ ...prev, consumableImage: files }))}
                            children="Cargar imagen"
                        />
                    </div>

                    <Input
                        label="ID del material"
                        name="consumableID"
                        value={formData.consumableID}
                        readOnly
                    />
                </div>

                {/* Columna 2 */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <Input
                        label="Nombre del consumible"
                        name="consumableName"
                        placeholder="Ingrese el nombre del elemento"
                        value={formData.consumableName}
                        onChange = {handleChange}
                        error={errors.consumableName}
                    />

                    <Select
                        label="Marca"
                        name="consumableBrand"
                        options={documentTypes}
                        value={formData.consumableBrand}
                        onChange = {handleChange}
                        error={errors.consumableBrand}
                    />

                    <Input
                        label="Placa SENA"
                        name="consumableSenaPlate"
                        placeholder="Ingrese la placa SENA"
                        value={formData.consumableSenaPlate}
                        onChange = {handleChange}
                        error={errors.consumableSenaPlate}
                    />

                    <Input
                        label="Ubicación"
                        name="consumableLocation"
                        placeholder="Ingrese la ubicación"
                        value={formData.consumableLocation}
                        onChange = {handleChange}
                        error={errors.consumableLocation}
                    />
                </div>

                {/* Columna 3 - Información económica */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <Input
                        label="Cantidad"
                        placeholder="Ingrese la cantidad"
                        name="consumableQuantity"
                        type="number"
                        value={formData.consumableQuantity}
                        onChange = {handleChange}
                        error={errors.consumableQuantity}
                    />

                    <Select
                        label="Estado"
                        name="consumableState"
                        options={documentTypes}
                        value={formData.consumableState}
                        onChange = {handleChange}
                        error={errors.consumableState}
                    />

                    <Input
                        label="Valor unitario"
                        name="consumableUnitValue"
                        placeholder="Ingrese el valor unitario"
                        type="number"
                        value={formData.consumableUnitValue}
                        onChange = {handleChange}
                        error={errors.consumableUnitValue}
                    />

                    <Input
                        label="Valor total"
                        name="consumableTotalValue"
                        placeholder="Ingrese el valor total"
                        type="number"
                        value={formData.consumableTotalValue}
                        onChange = {handleChange}
                        error={errors.consumableTotalValue}
                    />
                </div>

                {/* Columna 4 */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <Input
                        label="Fecha de compra"
                        name="consumableDatePurchase"
                        type="date"
                        value={formData.consumableDatePurchase}
                        onChange = {handleChange}
                        error={errors.consumableDatePurchase}
                    />

                    <Input
                        label="Cuentadante"
                        name="consumableAccountant"
                        placeholder="Ingrese el usuario cuentadante"
                        value={formData.consumableAccountant}
                        onChange = {handleChange}
                        error={errors.consumableAccountant}
                    />

                    {/* Este luego se cambia a un text area */}
                    <Input
                        label="Descripción"
                        name="consumableDescrption"
                        placeholder="Escriba aquí"
                        value={formData.consumableDescrption}
                        onChange = {handleChange}
                        error={errors.consumableDescrption}
                    />

                    {/* Actions */}
                    <div
                        className="
                            flex 
                            items-center justify-center 
                            gap-6
                        "
                    >
                        <Button
                            variant="primary"
                            size="sm"
                        >
                            Crear Material
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}