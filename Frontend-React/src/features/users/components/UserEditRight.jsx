import { useState } from "react";
import { Input, Button } from "@/shared";
import { Save } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function UserEditRight() {
    const [form, setForm] = useState({
        userName: "",
        userDocumentType: "",
        userDocumentNumber: "",
        userState: "",
        userPhone: "",
        userRole: "",
        userStartDate: "",
        userEndDate: "",
        userEmail: "",
        userEmailInstitutional: "",
        userDirection: "",
        userPassword: "",
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
                    Usuario
                </h2>
            </div>

            {/* Inputs */}
            <div className="grid lg:grid-cols-2 gap-6 w-full">
                <div className="grid gap-6 justify-items-center">
                    {/* Inputs */}
                    <Input
                        label="Nombre"
                        name="userName"
                        placeholder="Sofia Cardona"
                        value={form.userName}
                        onChange={handleChange}
                    />

                    <Input
                        label="Tipo de documento"
                        name="userDocumentType"
                        placeholder="C.C"
                        value={form.userDocumentType}
                        onChange={handleChange}
                    />

                    <Input
                        label="Número de documento"
                        name="userDocumentNumber"
                        placeholder="1078546789"
                        value={form.userDocumentNumber}
                        onChange={handleChange}
                    />

                    {/* Por default es activo */}
                    {/* Esto ira bloqueado para el admin o usuario */}
                    <Input
                        label="Estado"
                        name="userState"
                        placeholder="Activo"
                        type="text"
                        value={form.userState}
                        onChange={handleChange}
                    />

                    <Input
                        label="Teléfono"
                        name="userPhone"
                        placeholder="3125667890"
                        type="tel"
                        value={form.userPhone}
                        onChange={handleChange}
                    />

                    <Input
                        label="Rol del usuario"
                        placeholder="Administrador"
                        name="userRole"
                        value={form.userRole}
                        onChange={handleChange}
                    />
                </div>

                {/* Columna izquierda */}
                <div className="grid gap-6 justify-items-center lg:h-max">
                    {/* Por default es por parte del sistema */}
                    {/* Esto ira bloqueado para el admin o usuario */}
                    <Input
                        label="Fecha de inicio"
                        name="userStartDate"
                        // type="date"
                        placeholder="01/09/2023"
                        value={form.userStartDate}
                        onChange={handleChange}
                    />

                    {/* Esta si la ingresa el usuario */}
                    <Input
                        label="Fecha de finalización"
                        name="userEndDate"
                        // type="date"
                        placeholder="01/12/2023"
                        value={form.userEndDate}
                        onChange={handleChange}
                    />

                    <Input
                        label="Correo personal"
                        name="userEmail"
                        placeholder="sofia@gmail.com"
                        type="email"
                        value={form.userEmail}
                        onChange={handleChange}
                    />

                    <Input
                        label="Correo institucional"
                        name="userEmailInstitutional"
                        placeholder="sofia@soy.sena.edu.co"
                        type="email"
                        value={form.userEmailInstitutional}
                        onChange={handleChange}
                    />

                    <Input
                        label="Dirección"
                        name="userDirection"
                        placeholder="Calle 12 # 5 D 8"
                        value={form.userDirection}
                        onChange={handleChange}
                    />

                    <Input
                        label="Contraseña"
                        name="userPassword"
                        placeholder="********"
                        type="password"
                        value={form.userPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Acciones */}
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