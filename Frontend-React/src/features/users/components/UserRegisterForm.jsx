import { useState, useEffect } from "react";
import { userSchema } from "../schemas/userSchema.js";

import { Input, Button, Select, FileInput } from "@/shared";

import { getDocumentTypes } from "@/features/users/services/selectService.js";

export default function UserRegisterForm(){

   // Estados:

    const [documentTypes, setDocumentTypes] = useState([]);

    const [formData, setFormData] = useState({
        userName: "", 
        userDocumentType: "",
        userDocumentNumber: "",
        userState: "Activo",

        userPhone: "",
        userRole: "",
        userEndDate: "",
        userEmail: "",
        userEmailInstitutional: "",
        userDirection: "",
        userPassword: ""
    });

    const [errors, setErrors] = useState({})

    const [fecha] = useState(() => {
        const hoy = new Date();
        return hoy.toISOString().split("T")[0];
    });

    // Efectos:

    useEffect (() => {
        getDocumentTypes().then(setDocumentTypes);
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
        const result = userSchema.safeParse(formData);

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
        console.log("Usuario valido:", result.data)

    };


    return(
        <div className="flex justify-center pt-6" >
        

            <form 
            className="grid place-self-center gap-6 mx-6 md:grid-cols-2 md:mx-12 1400:grid-cols-2 1400:mx-0 justify-items-center max-w-max"

                onSubmit={handleSubmit}
            >
                 <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    <div className="flex flex-col">
                        <FileInput
                            className="flex-1 1400:min-h-82.5 md:min-h-82.5"
                            accept="image/*"
                            multiple={false}
                            value={formData.consumableImage}
                            onChange={(files) => setFormData((prev) => ({ ...prev, consumableImage: files }))}
                            children="Cargar imagen"
                        />
                    </div>
                    {/* Inputs */}
                    <Input 
                        label = "Nombre"
                        name = "userName"
                        placeholder = "Ingrese su nombre"
                        value={formData.userName}
                        onChange = {handleChange}
                        error={errors.userName}
                    />

                    <Select 
                        label = "Tipo de documento"
                        name="userDocumentType"
                        options={documentTypes}
                        value={formData.userDocumentType}
                        onChange = {handleChange}
                        error={errors.userDocumentType}
                    />

                    <Input 
                        label = "Número de documento"
                        name = "userDocumentNumber"
                        placeholder = "Ingrese su número de documento"
                        value={formData.userDocumentNumber}
                        onChange = {handleChange}
                        error={errors.userDocumentNumber}
                    />

                    {/* Por default es activo */}
                    {/* Esto ira bloqueado para el admin o usuario */}
                    <Input 
                        label = "Estado"
                        name="userState"
                        placeholder = "Activo/Inactivo"
                        type="text"
                        value={formData.userState}
                        readOnly
                    />
                </div>

                {/* Columna izquierda */}
                <div
                    className="flex flex-col gap-6 my-0 w-[320px]"
                >
                    {/* Inputs */}
                    <Input 
                        label = "Teléfono"
                        name = "userPhone"
                        placeholder = "Ingrese su teléfono"
                        type="tel"
                        value={formData.userPhone}
                        onChange = {handleChange}
                        error={errors.userPhone}
                    />

                    <Select 
                        label = "Rol del usuario"
                        name="userRole"
                        options={documentTypes}
                        value={formData.userDocumentType}
                        onChange = {handleChange}
                        error={errors.userDocumentType}
                    />

                    {/* Por default es por parte del sistema */}
                    {/* Esto ira bloqueado para el admin o usuario */}
                    <Input 
                        label = "Fecha de inicio"
                        name="userStartDate"
                        type="date"
                        value={fecha}
                        readOnly
                    />

                    {/* Esta si la ingresa el usuario */}
                    <Input 
                        label = "Fecha de finalización"
                        name="userEndDate"
                        type="date"
                        value={formData.userEndDate}
                        onChange = {handleChange}
                        error={errors.userEndDate}
                    />

                    <Input 
                        label = "Correo personal"
                        name="userEmail"
                        placeholder = "Ingrese su correo personal"
                        type="email"
                        value={formData.userEmail}
                        onChange = {handleChange}
                        error={errors.userEmail}
                    />

                    <Input 
                        label = "Correo institucional"
                        name="userEmailInstitutional"
                        placeholder = "Ingrese su correo institucional"
                        type="email"
                        value={formData.userEmailInstitutional}
                        onChange = {handleChange}
                        error={errors.userEmailInstitutional}
                    />

                    <Input 
                        label = "Dirección"
                        name="userDirection"
                        placeholder="Dirección de domicilio"
                        value={formData.userDirection}
                        onChange = {handleChange}
                        error={errors.userDirection}
                    />

                    <Input 
                        label = "Contraseña"
                        name  = "userPassword"
                        placeholder = "Ingrese su contraseña"
                        type="password"
                        value={formData.userPassword}
                        onChange = {handleChange}
                        error={errors.userPassword}
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
                            Crear Usuario
                        </Button>
                    </div>
                </div>   
            </form>
        </div>
    )
}