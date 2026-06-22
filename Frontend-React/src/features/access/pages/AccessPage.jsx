import AccessLeft from "../components/AccessLeft";
import AccessRight from "../components/AccessRight";
import { Undo2 } from "lucide-react";
import { IconButton } from "@/shared";
import { useNavigate } from "react-router-dom";



export default function AccessPage() {

    const navigate = useNavigate();

    return(
        <div className="p-2">
         {/* Botón de regreso */}
            <div className="mb-2">
                <IconButton
                    ariaLabel="Devolverse"
                    onClick={() => navigate(-1)}
                    
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>
            </div>
            <div
                className="
                    p-6 grid 1400:grid-cols-[380px_1fr]
                "
            >
                
                <div
                    className="
                        bg-black p-16 1400:h-full
                    "
                >
                    <AccessLeft/>
                </div>
    
                <div
                    className="
                        bg-white p-4
                    "
                >
                    <AccessRight/>
                </div>
            </div>
            </div>
        );
}