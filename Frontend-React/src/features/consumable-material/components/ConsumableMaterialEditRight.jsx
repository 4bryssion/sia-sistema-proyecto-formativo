import { 
    Input,
    Button,

} from "@/shared";

import { Pencil } from "lucide-react";

import logo from "@/assets/logos/logo-sena-negro.png";

export default function ConsumableMaterialEditRight(){



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
                    Material Consumible
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
                        label="Nombre del consumible"
                        name="consumableName"
                        placeholder="Tornillo de tungsteno"
                    />

                    <Input
                        label="Marca"
                        name="consumableBrand"
                        placeholder="UltraTornillos"
                    />

                    <Input
                        label="Estado"
                        name="consumableState"
                        placeholder="Disponible"
                    />

                    <Input
                        label="Cuentadante"
                        name="consumableAccountant"
                        placeholder="Santiago Acevedo"
                    />

                    <Input
                        label="Ubicación"
                        name="consumableLocation"
                        placeholder="ADSO - Zona 6"
                    />

                    <Input
                        label="Fecha de compra"
                        name="consumableDatePurchase"
                        placeholder="01/09/2023"
                    />

                </div>

                <div
                    className="
                        grid gap-6 justify-items-center lg:h-max
                    "
                >
                    <Input
                        label="Cantidad"
                        name="consumableQuantity"
                        placeholder="140"
                    />

                    <Input
                        label="Valor unitario"
                        name="consumableUnitValue"
                        placeholder="31.000"
                    />
                    
                    <Input
                        label="Valor total"
                        name="consumableTotalValue"
                        placeholder="4.340.000"
                    />

                    <Input
                        label="Descripción"
                        name="consumableDescrption"
                        placeholder="klk"
                    />

                </div>
            </div>

            {/* Acciones */}
            <Button variant="primary" className=" mt-6 sm:flex
                 gap-2 lg:justify-self-end lg:mr-24">
                    <Pencil size={16} />
                    Editar
                </Button>

            {/* Logo SENA */}
            <img
                src={logo}
                alt="Logo SENA"
                className="absolute right-0 bottom-0 w-16"
            />
        </div>
    );
}