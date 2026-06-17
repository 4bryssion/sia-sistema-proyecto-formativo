import { useState } from "react";
import { Input, Button } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function ReturnableMaterialEditRight() {
    const [form, setForm] = useState({
        returnableName: "",
        returnableBrand: "",
        returnableModel: "",
        returnableSerial: "",
        returnableSenaPlate: "",
        returnableState: "",
        returnableAccountant: "",
        returnableLocation: "",
        returnableDimensions: "",
        returnableQuantity: "",
        returnableUnitValue: "",
        returnableTotalValue: "",
        returnableDescrption: "",
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
                    Material Retornable
                </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 w-full">
                <div className="grid gap-6 justify-items-center">
                    <Input
                        label="Nombre del retornable"
                        name="returnableName"
                        placeholder="Taladro percutor industrial"
                        value={form.returnableName}
                        onChange={handleChange}
                    />
                    <Input
                        label="Marca"
                        name="returnableBrand"
                        placeholder="Bosch"
                        value={form.returnableBrand}
                        onChange={handleChange}
                    />
                    <Input
                        label="Modelo"
                        name="returnableModel"
                        placeholder="GSB 13 RE"
                        value={form.returnableModel}
                        onChange={handleChange}
                    />
                    <Input
                        label="Serial"
                        name="returnableSerial"
                        placeholder="SN-20230915-001"
                        value={form.returnableSerial}
                        onChange={handleChange}
                    />
                    <Input
                        label="Placa SENA"
                        name="returnableSenaPlate"
                        placeholder="SENA-2023-001"
                        value={form.returnableSenaPlate}
                        onChange={handleChange}
                    />
                    <Input
                        label="Estado"
                        name="returnableState"
                        placeholder="Disponible"
                        value={form.returnableState}
                        onChange={handleChange}
                    />
                    <Input
                        label="Cuentadante"
                        name="returnableAccountant"
                        placeholder="Santiago Acevedo"
                        value={form.returnableAccountant}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid gap-6 justify-items-center lg:h-max">
                    <Input
                        label="Ubicación"
                        name="returnableLocation"
                        placeholder="ADSO - Zona 6"
                        value={form.returnableLocation}
                        onChange={handleChange}
                    />
                    <Input
                        label="Dimensiones"
                        name="returnableDimensions"
                        placeholder="30cm x 20cm x 10cm"
                        value={form.returnableDimensions}
                        onChange={handleChange}
                    />
                    <Input
                        label="Cantidad"
                        name="returnableQuantity"
                        placeholder="5"
                        value={form.returnableQuantity}
                        onChange={handleChange}
                    />
                    <Input
                        label="Valor unitario"
                        name="returnableUnitValue"
                        placeholder="250.000"
                        value={form.returnableUnitValue}
                        onChange={handleChange}
                    />
                    <Input
                        label="Valor total"
                        name="returnableTotalValue"
                        placeholder="1.250.000"
                        value={form.returnableTotalValue}
                        onChange={handleChange}
                    />
                    <Input
                        label="Descripción"
                        name="returnableDescrption"
                        placeholder="Taladro para uso en taller de metalmecánica"
                        value={form.returnableDescrption}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid gap-6 mt-6 sm:flex sm:justify-end lg:w-full">
                <Button
                    variant="primary"
                    className="gap-2 lg:justify-self-end lg:mr-24"
                    onClick={handleSubmit}
                >
                    <Pencil size={16} />
                    Guardar
                </Button>
            </div>

            <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
        </div>
    );
}