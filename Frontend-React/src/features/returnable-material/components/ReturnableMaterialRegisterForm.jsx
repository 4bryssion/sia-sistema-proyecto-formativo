import { useState, useEffect } from "react";
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema.js";

import { Input, Button, Select, FileInput } from "@/shared";

import documentTypeService from "@/features/users/services/documentTypeService.js";

export default function ReturnableMaterialRegisterForm(){

    // Estados:
    
    const [documentTypes, setDocumentTypes] = useState([]);

    const [formData, setFormData] = useState({
        returnableID: "Automático",
        returnableFiles: [], 

        returnableCategory: "",
        returnableName: "",
        returnableBrand: "",
        returnableModel: "",
        returnableSerial: "",
        returnableSenaPlate: "",

        returnableDimensions: "",
        returnableAccountant: "",
        returnableLocation: "",
        returnableState: "",
        returnableQuantity: "",

        returnableUnitValue: "",
        returnableTotalValue: "",
        returnableDescrption: ""
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
        const result = returnableMaterialSchema.safeParse(formData);

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
        console.log("Material devolutivo valido:", result.data)

    };

    return(
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
                            accept="image/*,application/pdf"
                            multiple={true}
                            value={formData.returnableFiles}
                            onChange={(files) => setFormData((prev) => ({ ...prev, returnableFiles: files }))}
                            children="Cargar imagen/pdf"
                        />
                    </div>

                    <Input
                        label="ID del material"
                        name="returnableID"
                        value={formData.returnableID}
                        readOnly
                    />         
                </div>

                {/* Columna 2 */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <Select 
                        label="Categoría"
                        name="returnableCategory"
                        options={documentTypes}
                        value={formData.returnableCategory}
                        onChange = {handleChange}
                        error={errors.returnableCategory}
                    />

                    <Input 
                        label="Nombre del devolutivo"
                        name="returnableName"
                        placeholder="Ingrese el nombre del elemento"
                        value={formData.returnableName}
                        onChange = {handleChange}
                        error={errors.returnableName}
                    />

                    <Select
                        label="Marca"
                        name="returnableBrand"
                        options={documentTypes}
                        value={formData.returnableBrand}
                        onChange = {handleChange}
                        error={errors.returnableBrand}
                    />

                    <Input 
                        label = "Modelo"
                        name="returnableModel"
                        placeholder = "Ingrese el modelo"
                        value={formData.returnableModel}
                        onChange = {handleChange}
                        error={errors.returnableModel}
                    />

                    <Input 
                        label = "Serial"
                        name="returnableSerial"
                        placeholder = "Ingrese el serial"
                        value={formData.returnableSerial}
                        onChange = {handleChange}
                        error={errors.returnableSerial}
                    /> 
                </div>

                {/* Columna 3 */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <Input
                        label="Placa SENA"
                        name="returnableSenaPlate"
                        placeholder="Ingrese la placa SENA"
                        value={formData.returnableSenaPlate}
                        onChange = {handleChange}
                        error={errors.returnableSenaPlate}
                    />

                    <Input
                        label = "Dimensiones"
                        name="returnableDimensions"
                        placeholder = "Ingrese las dimensiones"
                        value={formData.returnableDimensions}
                        onChange = {handleChange}
                        error={errors.returnableDimensions}
                    />

                    <Input
                        label="Cuentadante"
                        name="returnableAccountant"
                        placeholder="Ingrese el usuario cuentadante"
                        value={formData.returnableAccountant}
                        onChange = {handleChange}
                        error={errors.returnableAccountant}
                    />

                    <Input
                        label="Ubicación"
                        name="returnableLocation"
                        placeholder="Ingrese la ubicación"
                        value={formData.returnableLocation}
                        onChange = {handleChange}
                        error={errors.returnableLocation}
                    />

                    <Select
                        label="Estado"
                        name="returnableState"
                        options={documentTypes}
                        value={formData.returnableState}
                        onChange = {handleChange}
                        error={errors.returnableState}
                    />
                </div>

                {/* Columna 4 */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <Input
                        label="Cantidad"
                        placeholder="Ingrese la cantidad"
                        name="returnableQuantity"
                        type="number"
                        value={formData.returnableQuantity}
                        onChange = {handleChange}
                        error={errors.returnableQuantity}
                    />
                    
                    <Input
                        label="Valor unitario"
                        name="returnableUnitValue"
                        placeholder="Ingrese el valor unitario"
                        type="number"
                        value={formData.returnableUnitValue}
                        onChange = {handleChange}
                        error={errors.returnableUnitValue}
                    />

                    <Input
                        label="Valor total"
                        name="returnableTotalValue"
                        placeholder="Ingrese el valor total"
                        type="number"
                        value={formData.returnableTotalValue}
                        onChange = {handleChange}
                        error={errors.returnableTotalValue}
                    />

                    {/* Este luego se cambia a un text area */}
                    <Input
                        label="Descripción"
                        name="returnableDescrption"
                        placeholder="Escriba aquí"
                        value={formData.returnableDescrption}
                        onChange = {handleChange}
                        error={errors.returnableDescrption}
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
                            variant = "primary"
                            size = "sm"
                        >
                            Crear Material
                        </Button>
                    </div>
                </div>   
            </form>   
        </div>
    )
}