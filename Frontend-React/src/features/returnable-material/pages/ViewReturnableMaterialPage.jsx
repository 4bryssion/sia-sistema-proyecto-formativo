import { useParams } from "react-router-dom";
import ReturnableMaterialViewLeft from "../components/ReturnableMaterialViewLeft";
import ReturnableMaterialViewRight from "../components/ReturnableMaterialViewRight";

export default function ViewReturnableMaterialPage() {
  const { id } = useParams();

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <ReturnableMaterialViewLeft id={id} />
      </div>
      <div className="bg-white p-4">
        <ReturnableMaterialViewRight id={id} />
      </div>
    </div>
  );
}
