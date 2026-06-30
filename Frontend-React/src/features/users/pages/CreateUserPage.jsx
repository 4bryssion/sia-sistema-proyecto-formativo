
import { useNavigate } from "react-router-dom";

import { IconButton } from "@/shared";

import UserRegisterForm 
from "../components/UserRegisterForm";

// import formBg from "@/assets/images/background-claro.jpg"

import { Undo2 } from "lucide-react";

export default function CreateUserPage(){

    const navigate = useNavigate();

    return(
        <div
            className="
                1400:min-h-[calc(100vh-4rem)]
                1400:flex 1400:flex-col 1400:justify-center 1400:relative pb-4
            "
        >
            {/* Fondo con imagen */}
            {/* <div
                className="
                    absolute inset-0 -z-10 bg-cover bg-center
                "
                style={{ backgroundImage: `url(${formBg})` }}
            /> */}

            <div
                className="
                     flex items-center gap-4 mt-2 mb-3 1400:absolute 1400:top-0
                "
            >
                <IconButton
                    ariaLabel = "Devolverse"
                    onClick={() => navigate(-1)}
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>

                <h1 
                    className="
                        text-xl font-semibold text-h3 sm:text-h2
                    "
                >
                    Crear Usuario
                </h1>
            </div>

            <UserRegisterForm/>

        </div>
    )
}