import { useState } from "react";
import { Input, Button } from "@/shared";
import { Save } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function TaskEditRight() {
    const [form, setForm] = useState({
        taskTitle: "",
        taskDescription: "",
        taskStartDate: "",
        taskEndDate: "",
        taskStatus: "",
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
                    Tarea
                </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 w-full">
                <div className="grid gap-6 justify-items-center">
                    <Input
                        label="Título de la tarea"
                        name="taskTitle"
                        placeholder="Revisar inventario de marcas"
                        value={form.taskTitle}
                        onChange={handleChange}
                    />
                    <Input
                        label="Descripción de la tarea"
                        name="taskDescription"
                        placeholder="Verificar que las marcas activas coincidan con el catálogo"
                        value={form.taskDescription}
                        onChange={handleChange}
                    />
                    <Input
                        label="Estado"
                        name="taskStatus"
                        placeholder="Pendiente"
                        value={form.taskStatus}
                        onChange={handleChange}

                    />
                </div>

                <div className="grid gap-6 justify-items-center lg:h-max">
                    <Input
                        label="Fecha de inicio"
                        name="taskStartDate"
                        type="date"
                        value={form.taskStartDate}
                        onChange={handleChange}
                    />
                    <Input
                        label="Fecha de fin"
                        name="taskEndDate"
                        type="date"
                        value={form.taskEndDate}
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

            <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
        </div>
    );
}