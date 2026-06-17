import ConsumableMaterialEditLeft from "../components/ConsumableMaterialEditLeft";
import ConsumableMaterialEditRight from "../components/ConsumableMaterialEditRight";

export default function EditConsumableMaterialPage(){


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
                <ConsumableMaterialEditLeft />
            </div>

            <div
                className="
                    bg-white p-4
                "
            >
                <ConsumableMaterialEditRight />
            </div>
        </div>
    );
}