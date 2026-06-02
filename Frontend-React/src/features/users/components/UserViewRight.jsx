import { 
    Input,
    Button,

} from "@/shared";

import { Pencil } from "lucide-react";

import logo from "@/assets/logos/logo-sena-negro.png";

export default function UserViewRight(){



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
                    Usuario
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
                     {/* Inputs */}
                    <Input 
                        label = "Nombre"
                        name = "userName"
                        placeholder = "Sofia Cardona"
                       
                    />

                    <Input 
                        label = "Tipo de documento"
                        name="userDocumentType"
                        placeholder = "C.C"

                        
                    />

                    <Input 
                        label = "Número de documento"
                        name = "userDocumentNumber"
                        placeholder = "1078546789"
                       
                    />

                    {/* Por default es activo */}
                    {/* Esto ira bloqueado para el admin o usuario */}
                    <Input 
                        label = "Estado"
                        name="userState"
                        placeholder = "Activo"
                        type="text"
                        
                    />
                     <Input 
                        label = "Teléfono"
                        name = "userPhone"
                        placeholder = "3125667890"
                        type="tel"
                       
                    />

                    <Input 
                        label = "Rol del usuario"
                        placeholder = "Administrador"
                        name="userRole"
                       
                    />
                </div>

                {/* Columna izquierda */}
                <div
                    className="
                        grid gap-6 justify-items-center lg:h-max
                    "
                >
                    {/* Inputs */}
                   

                    {/* Por default es por parte del sistema */}
                    {/* Esto ira bloqueado para el admin o usuario */}
                    <Input 
                        label = "Fecha de inicio"
                        name="userStartDate"
                        // type="date"
                        placeholder="01/09/2023"

                        
                    />

                    {/* Esta si la ingresa el usuario */}
                    <Input 
                        label = "Fecha de finalización"
                        name="userEndDate"
                        // type="date"
                        placeholder="01/12/2023"

                        
                    />

                    <Input 
                        label = "Correo personal"
                        name="userEmail"
                        placeholder = "sofia@gmail.com"
                        type="email"
                      
                    />

                    <Input 
                        label = "Correo institucional"
                        name="userEmailInstitutional"
                        placeholder = "sofia@soy.sena.edu.co"
                        type="email"
                        
                    />

                    <Input 
                        label = "Dirección"
                        name="userDirection"
                        placeholder="Calle 12 # 5 D 8"
                      
                    />

                    <Input 
                        label = "Contraseña"
                        name  = "userPassword"
                        placeholder = "********"
                        type="password"
                        
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