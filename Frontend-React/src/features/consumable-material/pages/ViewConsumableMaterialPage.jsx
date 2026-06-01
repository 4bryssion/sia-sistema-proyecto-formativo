import ConsumableMaterialViewLeft from "../components/ConsumableMaterialViewLeft";
import ConsumableMaterialViewRight from "../components/ConsumableMaterialViewRight";

export default function ViewConsumableMaterialPage(){


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
                <ConsumableMaterialViewLeft />
            </div>

            <div
                className="
                    bg-white p-4
                "
            >
                <ConsumableMaterialViewRight />
            </div>
        </div>
    );
}