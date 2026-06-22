import { useState } from "react";
import { brandSchema } from "../schemas/brandSchema.js";

import logo from "@/assets/logos/logo-sena-verde.png";

import { Input, Button } from "@/shared";

export default function BrandRegisterForm() {

    const [formData, setFormData] = useState({
        brandName: "", 
    });

    const [errors, setErrors] = useState({})

    // Efectos:

    

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
        const result = brandSchema.safeParse(formData);

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
        console.log("Marca valida:", result.data)

    };

    return (
        <div className="mt-12">
            <h1
                className="
                    text-text-inverse
                    text-2xl mb-6
                    text-center
                "
            >
                Agregar marca
            </h1>

            <form
                className="
                    flex
                    flex-col
                    place-self-center
                    items-center
                    gap-6
                    w-max
                   
                "

                onSubmit={handleSubmit}
            >
                <Input
                className="bg-white"
                    name="brandName"
                    placeholder="Nombre de la marca"
                    value={formData.brandName}
                    onChange = {handleChange}
                    error={errors.brandName}
                />

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
                        Agregar marca
                    </Button>
                </div>
                {/* Logo SENA */}
            <img
                src={logo}
                alt="Logo SENA"
                className=" w-16"
            />
            </form>
            
        </div>
    );
}