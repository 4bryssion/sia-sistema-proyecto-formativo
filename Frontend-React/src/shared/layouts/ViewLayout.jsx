import { Link, Outlet, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";

import {  
    IconButton 
} from "@/shared";

// import bg from "@/assets/images/background-claro.jpg"


export default function ViewLayout(){

    const navigate = useNavigate();

    return(
        <div
            className="
                relative min-h-screen text-text-primary
            "
        >
            {/* Fondo con imagen */}
            <div
                className="
                    absolute inset-0 -z-10 bg-cover bg-center bg-(--color-cuaternario-400)
                "
                // style={{ backgroundImage: `url(${bg})` }}
            />

            <IconButton
                variant="secondary"
                ariaLabel = "Devolverse"
                onClick={() => navigate(-1)}
            >
                <Undo2 strokeWidth={2.8} />
            </IconButton>

            <main>
                <Outlet/>
            </main>
            
        </div>
    );
}