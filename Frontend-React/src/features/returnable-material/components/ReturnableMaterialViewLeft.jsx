export default function ReturnableMaterialViewLeft (){



    return(
        <div
            className="
                font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full 1400:content-between
            "
        >
            <div
                className="
                    grid items-center justify-center justify-items-center 1400:content-between
                "
            >
                <div
                    className="
                        w-32 h-32 bg-white 
                    "
                />

                <h3
                    className="
                        text-h3 text-center
                    "
                >
                    @Nombre material
                </h3>
            </div>

            <div
                className="
                    grid text-center
                "
            >
                <h4>
                    ID:
                </h4>

                <p>XXXXXXX</p>
            </div>

            <div
                className="
                    grid text-center
                "
            >
                <h4>
                    Placa SENA:
                </h4>

                <p>XXXXXXXXX</p>
            </div>

            <div
                className="
                    grid text-center
                "
            >
                <h4>
                    Categoría:
                </h4>

                <p>XXXXXXXXX</p>
            </div>
        </div>
    );
}