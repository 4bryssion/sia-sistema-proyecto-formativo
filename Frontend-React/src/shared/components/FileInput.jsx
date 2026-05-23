// Input controlado: soporta imágenes + PDF, preview condicional, reorder y limpieza de memoria

import { useRef, useState, useEffect, useMemo, Children } from "react";
import { Infinity as InfinityLoader } from "ldrs/react";
import "ldrs/react/Infinity.css";

export default function FileInput({
    value = [], // Estado externo (files)
    onChange, // Setter externo
    multiple = false, // Modo selección
    accept = "image/*,application/pdf", // Tipos permitidos
    className = "",
    children,
}){
    // Estados:

    const inputRef = useRef(); // Input oculto
    const [ isLoading, setIsLoading ] = useState(false) // Loader 
    const [ dragIndex, setDragIndex ] = useState(null) // Indice drag

    const isImage = (file) => file.type.startsWith("image/"); // Discriminador MIME 

    // General previews SOLO para imágenes (evita crear URLs inncecesarias)
    const previews = useMemo(
        () => 
            value.map((file) => (isImage(file) ? URL.createObjectURL(file) : null)),
        [value],
    );

    // Limpieza de ObjectURL (prevención memory leak)
    useEffect(() => {
        return () => {
            previews.forEach((url) => {
                if(url) URL.revokeObjectURL(url);
            });
        };
    }, [previews]);

    // Normaliza FileList, simula async y limita a 12
    const handleFiles = async (files) =>  {
        setIsLoading(true);

        const list = Array.from(files);
        await new Promise((r) => setTimeout(r, 500));

        const data = multiple ? [...value, ...list] : [list[0]];
        onChange(data.slice(0,12));

        setIsLoading(false);
    }

    // Eliminación inmutable
    const remove = (i) => {
        const copy = [...value];
        copy.splice(i, 1);
        onChange(copy);
    }

    // Reordenamiento por drag & drop
    const reorder = (from, to) => {
        const copy = [...value];
        const [m] = copy.splice(from, 1);
        copy.splice(to, 0, m);
        onChange(copy);
    }

    const noFiles = value.length === 0;

    return(
        <div
            className={`flex items-center justify-center gap-2 ${className}`}
        >
            {value.map((file, i) => (
                <div
                    key={i}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => reorder(dragIndex, i)}
                    className="relative w-24 h-24 border rounded overflow-hidden group"
                >
                    {/* Render condicional: imagen vs archivo genérico */}
                    {isImage(file) ? (
                        <img src={previews[i]} className="w-full h-full object-cover" />
                    ) : (
                        <div
                            className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-[10px] px-1"
                        >
                            <span               className="font-semibold"
                            >
                                PDF
                            </span>

                            <span
                                className="truncate w-full text-center"
                            >
                                {file.name}
                            </span>
                        </div>
                    )}

                    {/* Acciones hover: reorder visual + eliminar */}
                    <div
                        className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100"
                    >
                        <button
                            className="w-7 h-7 bg-white rounded-full text-black text-xs"
                        >
                            ↔
                        </button>

                        <button
                            className="w-7 h-7 bg-white rounded-full text-black text-xs"

                            onClick={() => remove(i)}
                        >
                            ⨉
                        </button>
                    </div>
                </div>
            ))}

            {/* Trigger de input oculto + loader */}
            <div
                onClick={() => !isLoading && inputRef.current.click()}
                className={`border-2 border-dashed rounded flex items-center justify-center cursor-pointer ${noFiles ? "flex-1 self-stretch min-h-24" : "w-24 h-24"}`}
            >
                {isLoading ? (
                    <InfinityLoader 
                        size="55"
                        stroke="4"
                        strokeLength="0.15"
                        bgOpacity="0.1"
                        speed="1.3"
                        color="black"
                    />
                ) : (
                    <span className="text-blue-500 text-sm font-main">{children}</span>
                )}
            </div>

            {/* Input desacoplado de IU */}
            <input 
                ref={inputRef}
                type="file"
                hidden
                multiple={multiple}
                accept={accept}
                onChange={(e) => handleFiles(e.target.files)}
            />
            
        </div>
    )
}