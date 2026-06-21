import { useState, useEffect } from "react";
import { loanSchema } from "../schemas/loanSchema.js";
import { Input, Button, Select } from "@/shared";
import { getMaterials, getUsers } from "../services/selectService.js";
import { createLoan } from "../services/loanServices.js";
import { useNavigate } from "react-router-dom";

export default function LoanRegisterForm() {

    const navigate = useNavigate();

    // Estados
    const [materials, setMaterials] = useState([]);
    const [users, setUsers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        loanMaterial: "",
        loanQuantity: "",
        loanGroup: "",
        loanDepartureDate: "",
        loanJustification: "",
        loanReturnDate: "",
        loanRequestingUser: "",
    });

    const [errors, setErrors] = useState({});

    // Carga materiales y usuarios del backend al montar el componente
    useEffect(() => {
        getMaterials().then(setMaterials).catch(console.error);
        getUsers().then(setUsers).catch(console.error);
    }, []);

    // Handle genérico para inputs y selects
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle submit con validación y llamada al backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación con Zod
        const result = loanSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            // Envía los datos al backend con los nombres que espera el backend
            const response = await createLoan({
                userId:           Number(formData.loanRequestingUser),
                materialId:       Number(formData.loanMaterial),
                borrowedQuantity: Number(formData.loanQuantity),
                apprenticeGroup:  Number(formData.loanGroup),
                useJustification: formData.loanJustification,
                returnDate:       formData.loanReturnDate,
            });

            console.log("Préstamo creado:", response);
            alert("Préstamo creado exitosamente.");
            navigate(-1);

        } catch (error) {
            console.error("Error:", error.message);
            alert(error.message);

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center">
            <form
                className="
                    grid gap-6 mx-6 md:mx-12
                    md:grid-cols-2 1400:grid-cols-2
                    justify-items-center
                "
                onSubmit={handleSubmit}
            >

                {/* Columna 1 - Material y usuario */}
                <div className="flex flex-col gap-6 my-0 w-[320px]">

                    {/* Select de materiales traídos del backend */}
                    <Select
                        label="Material"
                        name="loanMaterial"
                        options={materials}
                        value={formData.loanMaterial}
                        onChange={handleChange}
                        error={errors.loanMaterial}
                    />

                    {/* Select de usuarios traídos del backend */}
                    <Select
                        label="Usuario solicitante"
                        name="loanRequestingUser"
                        options={users}
                        value={formData.loanRequestingUser}
                        onChange={handleChange}
                        error={errors.loanRequestingUser}
                    />
                </div>

                {/* Columna 2 - Cantidad y grupo */}
                <div className="flex flex-col gap-6 my-0 w-[320px]">
                    <Input
                        label="Cantidad"
                        name="loanQuantity"
                        placeholder="Ingrese la cantidad"
                        type="number"
                        value={formData.loanQuantity}
                        onChange={handleChange}
                        error={errors.loanQuantity}
                    />
                    <Input
                        label="Grupo de aprendices"
                        name="loanGroup"
                        placeholder="Ingrese el número del grupo"
                        type="number"
                        value={formData.loanGroup}
                        onChange={handleChange}
                        error={errors.loanGroup}
                    />
                </div>

                {/* Columna 3 - Fechas */}
                <div className="flex flex-col gap-6 w-[320px]">
                    <Input
                        label="Fecha de salida"
                        name="loanDepartureDate"
                        type="date"
                        value={formData.loanDepartureDate}
                        onChange={handleChange}
                        error={errors.loanDepartureDate}
                    />
                    <Input
                        label="Fecha de entrega del material"
                        name="loanReturnDate"
                        type="date"
                        value={formData.loanReturnDate}
                        onChange={handleChange}
                        error={errors.loanReturnDate}
                    />
                </div>

                {/* Columna 4 - Justificación y acción */}
                <div className="flex flex-col gap-6 my-0 w-[320px]">
                    <Input
                        label="Justificación de uso"
                        name="loanJustification"
                        placeholder="Escriba aquí la justificación"
                        value={formData.loanJustification}
                        onChange={handleChange}
                        error={errors.loanJustification}
                    />

                    {/* Botón crear préstamo */}
                    <div className="flex items-center justify-center gap-6">
                        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? "Creando..." : "Crear Préstamo"}
                        </Button>
                    </div>

                </div>

            </form>
        </div>
    );
}