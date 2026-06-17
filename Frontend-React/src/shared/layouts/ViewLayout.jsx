import { Link, Outlet, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";

import {  
    IconButton 
} from "@/shared";

import bg from "@/assets/images/background-oscuro.jpg"


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
                    fixed inset-0 -z-10 bg-cover bg-center
                "
                style={{ backgroundImage: `url(${bg})` }}
            />

            <IconButton
                variant="primary"
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