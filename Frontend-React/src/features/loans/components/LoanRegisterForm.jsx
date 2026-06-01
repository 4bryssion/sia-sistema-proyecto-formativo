import { useState, useEffect } from "react";
import { loanSchema } from "../schemas/loanSchema.js";

import {
    Input,
    Button,
    Select,
} from "@/shared";

import { getDocumentTypes } from "@/features/users/services/selectService.js";

export default function LoanRegisterForm() {

    // Estados:

    const [documentTypes, setDocumentTypes] = useState([]);

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

    // Efectos:

    useEffect(() => {
        getDocumentTypes().then(setDocumentTypes);
    }, []);

    // ===========================================
    //                 Handles
    // ===========================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const result = loanSchema.safeParse(formData);

        if (!result.success) {

            const fieldErrors = {};

            result.error.issues.forEach((issue) => {

                const field = issue.path[0];

                fieldErrors[field] = issue.message;
            });

            setErrors(fieldErrors);

            return;
        }

        setErrors({});

        console.log("Préstamo válido:", result.data);
    };

    return (
        <div className="flex justify-center">

            <form
                className="
                    grid
                    gap-6

                    mx-6
                    md:mx-12

                    md:grid-cols-2
                    1400:grid-cols-2
                    justify-items-center

                "
                onSubmit={handleSubmit}
            >

                {/* Columna 1 - Material y usuario */}
                <div
                    className="
                        flex
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
                    <Select
                        label="Material"
                        name="loanMaterial"
                        options={documentTypes}
                        value={formData.loanMaterial}
                        onChange={handleChange}
                        error={errors.loanMaterial}
                    />

                    <Select
                        label="Usuario solicitante"
                        name="loanRequestingUser"
                        options={documentTypes}
                        value={formData.loanRequestingUser}
                        onChange={handleChange}
                        error={errors.loanRequestingUser}
                    />
                </div>

                {/* Columna 2 - Cantidad y grupo */}
                <div
                    className="
                        flex
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
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
                <div
                    className="
                        flex
                        flex-col
                        gap-6
                        w-full
                    "
                >
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
                <div
                    className="
                        flex
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
                    <Input
                        label="Justificación de uso"
                        name="loanJustification"
                        placeholder="Escriba aquí la justificación"
                        value={formData.loanJustification}
                        onChange={handleChange}
                        error={errors.loanJustification}
                    />

                    {/* Actions */}
                    <div
                        className="
                            flex
                            items-center
                            justify-center
                            gap-6
                        "
                    >
                        <Button
                            variant="primary"
                            size="sm"
                        >
                            Crear Préstamo
                        </Button>
                    </div>

                </div>

            </form>

        </div>
    );
}