import { Checkbox } from "@/shared";

// Datos de ejemplo, solo visual (sin fetch todavía)
const modules = [
    {
        title: "Gestión usuarios",
        permissions: [
            { codename: "create_user", label: "Crear usuarios" },
            { codename: "list_user", label: "Listar usuarios" },
            { codename: "edit_user", label: "Editar usuarios" },


        ],
    },
    {
        title: "Gestión materiales",
        permissions: [
            { codename: "create_material", label: "Crear materiales" },
            { codename: "list_material", label: "Listar materiales" },
            { codename: "edit_material", label: "Editar materiales" },
  
        ],
    },
    {
        title: "Gestión marcas",
        permissions: [
            { codename: "create_brand", label: "Crear marcas" },
            { codename: "list_brand", label: "Listar marcas" },
            { codename: "edit_brand", label: "Editar marcas" },
        ],
    },
];

export default function AccessRight() {

    return (
        <div
            className="
                relative mt-24
            "
        >
            <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
                <h2
                    className="
                        font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]
                    "
                >
                    Permisos
                </h2>
            </div>

            {/* Columnas de módulos */}
            <div
                className="
                    grid lg:grid-cols-3 gap-6 
                "
            >
                {modules.map((module) => (
                    <div
                        key={module.title}
                        className="
                            grid gap-6 justify-items-center
                        "
                    >
                        <h4 className="text-center font-medium">
                            {module.title}
                        </h4>

                        {module.permissions.map((permission) => (
                            <Checkbox
                                key={permission.codename}
                                id={permission.codename}
                                name={permission.codename}
                                label={permission.label}
                                checked={false}
                                onChange={() => {}}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}