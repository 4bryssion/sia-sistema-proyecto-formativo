import { useState } from "react";
import { inventorySchema } from "@/shared/schemas/inventorySchema";
import inventoryService from "@/shared/services/inventoryService";

import logo from "@/assets/logos/logo-sena-verde.png";
import { Input, Button, Alert } from "@/shared";

export default function InventoryRegisterForm({ onSuccess }) {

    const [formData, setFormData] = useState({ inventoryName: "" });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = inventorySchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            await inventoryService.create(result.data);
            setFormData({ inventoryName: "" });
            setErrors({});
            Alert.success("Inventario creado");
            onSuccess?.();
        } catch (error) {
            const msg =
                error.response?.data?.detalles?.join(" · ") ??
                error.response?.data?.error ??
                "Error al crear el inventario";
            Alert.error("Error al crear el inventario", msg);
        }
    };

    return (
        <div className="mt-12">
            <h1 className="font-main text-text-inverse text-h2 mb-6 text-center">
                Agregar inventario
            </h1>

            <form
                className="flex flex-col place-self-center items-center gap-6 w-max"
                onSubmit={handleSubmit}
            >
                <Input
                    className="bg-white py-0.5 rounded-md"
                    name="inventoryName"
                    placeholder="Nombre del inventario"
                    value={formData.inventoryName}
                    onChange={handleChange}
                    error={errors.inventoryName}
                />


                <div className="flex items-center justify-center gap-6">
                    <Button variant="primary" size="sm" type="submit">
                        Agregar inventario
                    </Button>
                </div>

                <img src={logo} alt="Logo SENA" className="w-16" />
            </form>
        </div>
    );
}
