import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import consumableMaterialService from "../services/consumableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

export default function ConsumableMaterialViewRight({ id }) {
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    if (!id) return;
    consumableMaterialService.getById(id).then(setMaterial).catch(() => {});
  }, [id]);

  if (!material) return <p className="text-gray-500">Cargando...</p>;

  const cuentadante = material.user
    ? `${material.user.userFirstName} ${material.user.userLastName}`
    : "—";

  const dateFormatted = material.purchaseDate
    ? new Date(material.purchaseDate).toLocaleDateString("es-CO")
    : "—";

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Material Consumible
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">
          <Input label="Nombre del material"   value={material.materialName}          readOnly />
          <Input label="Marca"                 value={material.brand?.brandName ?? "—"} readOnly />
          <Input label="Estado"                value={getStatusLabel(material.status)} readOnly />
          <Input label="Cuentadante"           value={cuentadante}                    readOnly />
          <Input label="Ubicación"             value={material.location}              readOnly />
          <Input label="Fecha de compra"       value={dateFormatted}                  readOnly />
        </div>
        <div className="grid gap-6 justify-items-center lg:h-max">
          <Input label="Placa SENA"            value={material.senaPlate ?? "—"}      readOnly />
          <Input label="Cantidad"              value={material.quantity ?? "—"}       readOnly />
          <Input label="Valor unitario"        value={material.unitPrice}             readOnly />
          <Input label="Valor total"           value={material.totalPrice}            readOnly />
          <Input label="Descripción"           value={material.description}           readOnly />
        </div>
      </div>

      {/* Solo botón Editar — toggle movido a la página Edit */}
      <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto lg:justify-end justify-center lg:flex lg:w-full">
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={() => navigate(`/view/consumable-materials/${id}/edit`)}
        >
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 -bottom-3 w-16" />
    </div>
  );
}
