import ReturnableMaterialViewLeft from "../components/ReturnableMaterialViewLeft";
import ReturnableMaterialViewRight from "../components/ReturnableMaterialViewRight";

export default function ViewReturnableMaterialPage(){


    return(
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
                <ReturnableMaterialViewLeft />
            </div>

            <div
                className="
                    bg-white p-4
                "
            >
                <ReturnableMaterialViewRight />
            </div>
        </div>
    );
}