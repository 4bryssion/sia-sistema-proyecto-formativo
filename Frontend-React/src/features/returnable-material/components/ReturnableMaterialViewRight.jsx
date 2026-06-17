import {
    Input,
    Button,

} from "@/shared";

import { Pencil } from "lucide-react";

import logo from "@/assets/logos/logo-sena-negro.png";

export default function ReturnableMaterialViewRight(){



    return(
        <div
            className="
               relative
            "
        >
            <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
                <h2
                    className="
                        font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]
                    "
                >
                    Material Retornable
                </h2>
            </div>

            {/* Inputs */}
            <div
                className="
                    grid lg:grid-cols-2 gap-6 w-full
                "
            >
                <div
                    className="
                        grid gap-6 justify-items-center
                    "
                >
                    <Input
                        label="Nombre del retornable"
                        name="returnableName"
                        placeholder="Taladro percutor industrial"
                    />

                    <Input
                        label="Marca"
                        name="returnableBrand"
                        placeholder="Bosch"
                    />

                    <Input
                        label="Modelo"
                        name="returnableModel"
                        placeholder="GSB 13 RE"
                    />

                    <Input
                        label="Serial"
                        name="returnableSerial"
                        placeholder="SN-20230915-001"
                    />

                    <Input
                        label="Placa SENA"
                        name="returnableSenaPlate"
                        placeholder="SENA-2023-001"
                    />

                    <Input
                        label="Estado"
                        name="returnableState"
                        placeholder="Disponible"
                    />

                    <Input
                        label="Cuentadante"
                        name="returnableAccountant"
                        placeholder="Santiago Acevedo"
                    />

                </div>

                <div
                    className="
                        grid gap-6 justify-items-center lg:h-max
                    "
                >
                    <Input
                        label="Ubicación"
                        name="returnableLocation"
                        placeholder="ADSO - Zona 6"
                    />

                    <Input
                        label="Dimensiones"
                        name="returnableDimensions"
                        placeholder="30cm x 20cm x 10cm"
                    />

                    <Input
                        label="Cantidad"
                        name="returnableQuantity"
                        placeholder="5"
                    />

                    <Input
                        label="Valor unitario"
                        name="returnableUnitValue"
                        placeholder="250.000"
                    />

                    <Input
                        label="Valor total"
                        name="returnableTotalValue"
                        placeholder="1.250.000"
                    />

                    <Input
                        label="Descripción"
                        name="returnableDescrption"
                        placeholder="Taladro para uso en taller de metalmecánica"
                    />

                </div>
            </div>

            {/* Acciones */}
            <div
                className="
                    grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-between lg:grid lg:grid-cols-2 lg:gap-6 lg:w-full
                "
            >
                <div className="lg:w-[320px] lg:justify-self-center">
                    <Button
                        variant="toggle"
                        activeLabel="Activo"
                        inactiveLabel="Desactivado"
                    />
                </div>

                <Button variant="primary" className="gap-2 lg:justify-self-end lg:mr-24">
                    <Pencil size={16} />
                    Editar
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