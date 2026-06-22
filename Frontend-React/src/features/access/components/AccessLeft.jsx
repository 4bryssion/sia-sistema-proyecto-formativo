import { Input, Button, SearchField } from "@/shared";

export default function AccessLeft() {

    return (
        <div
            className="
                font-main  space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full
            "
        >
            {/* Agregar Grupo */}
            <div
                className="
                    grid gap-6  justify-items-center
                "
            >
                <h3
                    className="
                        text-h3 text-text-inverse text-center
                    "
                >
                    Agregar Grupo
                </h3>
        
                <Input
                className="bg-white"
                    name="groupName"
                    placeholder="Ej: Administrador"
                />
             

                <Button variant="primary">
                    Agregar grupo
                </Button>
            </div>

            {/* Agregar Permiso Individual */}
            <div
                className="
                    grid gap-6 justify-items-center
                "
            >
                <h3
                    className="
                        text-h3 text-text-inverse text-center
                    "
                >
                    Agregar Permiso Individual
                </h3>


                <SearchField/>

                <Button variant="primary">
                    Confirmar
                </Button>
            </div>
        </div>
    );
}