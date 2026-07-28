import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, IconButton, TextArea } from "@/shared";
import { Pencil, FileText } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import returnableMaterialService from "../services/returnableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

const IMG_BASE = "http://localhost:5000";

export default function ReturnableMaterialViewRight({ id }) {
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    if (!id) return;
    returnableMaterialService.getById(id).then(setMaterial).catch(() => {});
  }, [id]);

  if (!material) return <p className="text-gray-500">Cargando...</p>;

  const cm = material.consumableMaterial;
  const cuentadante = cm.user
    ? `${cm.user.userFirstName} ${cm.user.userLastName}`
    : "—";
  const dateFormatted = cm.purchaseDate
    ? new Date(cm.purchaseDate).toLocaleDateString("es-CO")
    : "—";

  const openTechSheet = () => {
    if (material.technicalSheet)
      window.open(`${IMG_BASE}${material.technicalSheet}`, "_blank");
  };

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Material Retornable
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">
          <Input label="Nombre del material"   value={cm.materialName}                  readOnly />
          <Input label="Marca"                 value={cm.brand?.brandName ?? "—"}       readOnly />
          <Input label="Modelo"                value={material.model}                   readOnly />
          <Input label="Serial"                value={material.serial}                  readOnly />
          <Input label="Placa SENA"            value={cm.senaPlate ?? "—"}              readOnly />
          <Input label="Cantidad"              value={cm.quantity ?? "—"}               readOnly />
          <Input label="Estado"                value={getStatusLabel(cm.status)}        readOnly />
          <Input label="Cuentadante"           value={cuentadante}                      readOnly />
        </div>
        <div className="grid gap-6 justify-items-center lg:h-max">
          <Input label="Categoría"             value={material.category?.categoryName ?? "—"} readOnly />
          <Input label="Ubicación"             value={cm.location}                      readOnly />
          <Input label="Dimensiones"           value={material.dimensions ?? "—"}       readOnly />
          <Input label="Valor unitario"        value={cm.unitPrice}                     prefix="$" readOnly />
          <Input label="Valor total"           value={cm.totalPrice}                    prefix="$" readOnly />
          <Input label="Fecha de compra"       value={dateFormatted}                    readOnly />
          {/* Descripción: TextArea (ancho de input, alto fijo) */}
          <TextArea label="Descripción"        value={cm.description}                   readOnly />
        </div>
      </div>

      <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-between lg:grid lg:grid-cols-2 lg:gap-6 lg:w-full">
        <div className="flex items-center gap-2 lg:justify-self-center">
          <IconButton ariaLabel="Ver ficha técnica" onClick={openTechSheet}>
            <FileText size={20} />
          </IconButton>
          <span className="text-sm font-medium">Ficha técnica</span>
        </div>

        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={() => navigate(`/view/returnable-materials/${id}/edit`)}
        >
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}
