import { Input, Button } from "@/shared";

export default function LoanRegisterForm() {
    return (
        <div>
            <h1
                className="
                    text-text-primary
                    text-2xl mb-6
                "
            >
                Prestamos
            </h1>

            <form
                className="
                    grid
                    grid-cols-4
                    place-self-center
                    gap-6
                    w-max
                "
            >
                {/* Columna 1 - Identificación del elemento */}
                <div
                    className="
                        flex 
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
                    <Input
                        label=""
                        placeholder="ID"
                    />

                    <Input
                        label=""
                        placeholder="Nombre del elemento"
                    />

                    <Input
                        label=""
                        placeholder="Serial"
                    />

                    <Input
                        label=""
                        placeholder="Placa SENA"
                    />

                    <Input
                        label=""
                        placeholder="Modelo"
                    />

                    <Input
                        label=""
                        placeholder="Marca"
                    />
                </div>

                {/* Columna 2 - Detalles del préstamo */}
                <div
                    className="
                        flex 
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
                    <Input
                        label=""
                        placeholder="Selección de categoría"
                    />

                    <Input
                        label=""
                        placeholder="Ubicación"
                    />

                    <Input
                        label=""
                        placeholder="Préstamo"
                    />

                    <Input
                        label=""
                        placeholder="Estado"
                    />
                </div>

                {/* Columna 3 - Fechas */}
                <div
                    className="
                        flex 
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
                    <Input
                        label=""
                        placeholder="Fecha y hora"
                        type="datetime"
                    />

                    <Input
                        label=""
                        placeholder="Fecha entrega de material"
                        type="date"
                    />

                    <Input
                        label=""
                        placeholder="Grupo de aprendices"
                    />
                </div>

                {/* Columna 4 - Descripción y acción */}
                <div
                    className="
                        flex 
                        flex-col
                        gap-6
                        my-0 mx-auto
                    "
                >
                    {/* Descripción como textarea */}
                  <Input
                    labeñ=""
                    placeholder="Descripcion"
                  
                  
                  
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
                            variant="primary"
                            size="sm"
                        >
                            Crear
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}