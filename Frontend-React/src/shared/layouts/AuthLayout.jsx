import { Outlet } from "react-router-dom";
import bg from "@/assets/images/background-oscuro.jpg"
import { AuthLoginForm } from "@/features/auth"


export default function AuthLayout(){
    return(
        <div
            className="
                relative min-h-screen text-text-primary 
            "
        >
            {/* Fondo con imagen */}
            <div
                className="
                    absolute inset-0 -z-10 bg-cover bg-center
                "
                style={{ backgroundImage: `url(${bg})` }}
            />

            <main>
                <AuthLoginForm />
                <Outlet />
            </main>  
        </div>
    );
}