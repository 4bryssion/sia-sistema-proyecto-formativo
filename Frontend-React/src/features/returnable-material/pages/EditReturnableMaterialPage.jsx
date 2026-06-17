import ReturnableMaterialEditLeft from "../components/ReturnableMaterialEditLeft";
import ReturnableMaterialEditRight from "../components/ReturnableMaterialEditRight";

export default function EditReturnableMaterialPage() {
    return (
        <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
            <div className="bg-black p-16 1400:h-full">
                <ReturnableMaterialEditLeft />
            </div>
            <div className="bg-white p-4">
                <ReturnableMaterialEditRight />
            </div>
        </div>
    );
}