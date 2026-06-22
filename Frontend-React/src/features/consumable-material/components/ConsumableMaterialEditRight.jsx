import { useState } from "react";
import { Input, Button } from "@/shared";
import { Save } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function ConsumableMaterialEditRight() {
    const [form, setForm] = useState({
        consumableName: "",
        consumableBrand: "",
        consumableState: "",
        consumableAccountant: "",
        consumableLocation: "",
        consumableDatePurchase: "",
        consumableQuantity: "",
        consumableUnitValue: "",
        consumableTotalValue: "",
        consumableDescrption: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        console.log("Datos editados:", form);
    };

    return (
        <div className="relative">
            <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
                <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
                    Material Consumible
                </h2>
            </div>

            {/* Inputs */}
            <div className="grid lg:grid-cols-2 gap-6 w-full">
                <div className="grid gap-6 justify-items-center">
                    <Input
                        label="Nombre del consumible"
                        name="consumableName"
                        placeholder="Tornillo de tungsteno"
                        value={form.consumableName}
                        onChange={handleChange}
                    />

                    <Input
                        label="Marca"
                        name="consumableBrand"
                        placeholder="UltraTornillos"
                        value={form.consumableBrand}
                        onChange={handleChange}
                    />

                    <Input
                        label="Estado"
                        name="consumableState"
                        placeholder="Disponible"
                        value={form.consumableState}
                        onChange={handleChange}
                    />

                    <Input
                        label="Cuentadante"
                        name="consumableAccountant"
                        placeholder="Santiago Acevedo"
                        value={form.consumableAccountant}
                        onChange={handleChange}
                    />

                    <Input
                        label="Ubicación"
                        name="consumableLocation"
                        placeholder="ADSO - Zona 6"
                        value={form.consumableLocation}
                        onChange={handleChange}
                    />

                    <Input
                        label="Fecha de compra"
                        name="consumableDatePurchase"
                        placeholder="01/09/2023"
                        value={form.consumableDatePurchase}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid gap-6 justify-items-center lg:h-max">
                    <Input
                        label="Cantidad"
                        name="consumableQuantity"
                        placeholder="140"
                        value={form.consumableQuantity}
                        onChange={handleChange}
                    />

                    <Input
                        label="Valor unitario"
                        name="consumableUnitValue"
                        placeholder="31.000"
                        value={form.consumableUnitValue}
                        onChange={handleChange}
                    />

                    <Input
                        label="Valor total"
                        name="consumableTotalValue"
                        placeholder="4.340.000"
                        value={form.consumableTotalValue}
                        onChange={handleChange}
                    />

                    <Input
                        label="Descripción"
                        name="consumableDescrption"
                        placeholder="Descripción del material"
                        value={form.consumableDescrption}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-end lg:flex lg:w-full">
                <Button
                    variant="primary"
                    className="gap-2 lg:justify-self-end lg:mr-24"
                    onClick={handleSubmit}
                >
                    <Save size={16} />
                    Guardar
                </Button>
            </div>

            {/* Logo SENA */}
            <img
                src={logo}
                alt="Logo SENA"
                className="absolute right-0 bottom-0 w-16"
            />
        </div>
    );
}