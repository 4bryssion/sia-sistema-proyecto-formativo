import { useState } from "react";
import { brandSchema } from "../schemas/brandSchema.js";
import brandService from "../services/brandService.js";

import logo from "@/assets/logos/logo-sena-verde.png";
import { Input, Button } from "@/shared";

export default function BrandRegisterForm({ onSuccess }) {

    const [formData, setFormData] = useState({ brandName: "" });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = brandSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            await brandService.create(result.data);
            setFormData({ brandName: "" });
            setErrors({});
            onSuccess?.();
        } catch (error) {
            setErrors({ form: error.response?.data?.error ?? "Error al crear la marca" });
        }
    };

    return (
        <div className="mt-12">
            <h1 className="text-text-inverse text-2xl mb-6 text-center">
                Agregar marca
            </h1>

            <form
                className="flex flex-col place-self-center items-center gap-6 w-max"
                onSubmit={handleSubmit}
            >
                <Input
                    className="bg-white py-0.5 rounded-md"
                    name="brandName"
                    placeholder="Nombre de la marca"
                    value={formData.brandName}
                    onChange={handleChange}
                    error={errors.brandName}
                />

                {errors.form && (
                    <p className="text-error text-caption">{errors.form}</p>
                )}

                <div className="flex items-center justify-center gap-6">
                    <Button variant="primary" size="sm" type="submit">
                        Agregar marca
                    </Button>
                </div>

                <img src={logo} alt="Logo SENA" className="w-16" />
            </form>
        </div>
    );
}
