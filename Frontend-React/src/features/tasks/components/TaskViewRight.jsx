import { Input, Button } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { useNavigate } from "react-router-dom";

export default function TaskViewRight() {

    const navigate = useNavigate();

    return (
        <div className="relative">

            <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
                <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
                    Tarea
                </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 w-full">

                <div className="grid gap-6 justify-items-center">
                    <Input
                        label="Título de la tarea"
                        name="taskTitle"
                        placeholder="Revisar inventario de marcas"
                    />

                    <Input
                        label="Descripción de la tarea"
                        name="taskDescription"
                        placeholder="Verificar que las marcas activas coincidan con el catálogo"
                    />

                    <Input
                        label="Estado"
                        name="taskStatus"
                        placeholder="Pendiente"
                    />
                </div>

                <div className="grid gap-6 justify-items-center lg:h-max">
                    <Input
                        label="Fecha de inicio"
                        name="taskStartDate"
                        placeholder="01/09/2026"
                    />

                    <Input
                        label="Fecha de fin"
                        name="taskEndDate"
                        placeholder="15/09/2026"
                    />
                </div>
            </div>

            <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-end lg:flex lg:w-full">
                <Button
                    variant="primary"
                    className="gap-2 lg:justify-self-end lg:mr-24"
                    onClick={() => navigate(`/view/tasks/${"id-temporal"}/edit`)}
                >
                    <Pencil size={16} />
                    Editar
                </Button>
            </div>

            <img
                src={logo}
                alt="Logo SENA"
                className="absolute right-0 bottom-0 w-16"
            />
        </div>
    );
}