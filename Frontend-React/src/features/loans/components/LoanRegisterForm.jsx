import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select } from "@/shared";
import { loanSchema } from "../schemas/loanSchema.js";
import loanService from "../services/loanService";
import userService from "@/features/users/services/userService";
import consumableMaterialService from "@/features/consumable-material/services/consumableMaterialService";
import returnableMaterialService from "@/features/returnable-material/services/returnableMaterialService";
import { buildMaterialOptions } from "../utils/materialOptions";
import LoanMaterialLines from "./LoanMaterialLines.jsx";

export default function LoanRegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    apprenticeGroup: "",
    useJustification: "",
    returnDate: "",
    lenderId: "",
    receiverId: "",
  });
  const [materials, setMaterials]               = useState([{ materialId: "", borrowedQuantity: "" }]);
  const [userOptions, setUserOptions]           = useState([]);
  const [materialOptions, setMaterialOptions]   = useState([]);
  const [errors, setErrors]                     = useState({});
  const [materialErrors, setMaterialErrors]     = useState([]);
  const [isSubmitting, setIsSubmitting]         = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [users, consumables, returnables] = await Promise.all([
          userService.getAll(),
          consumableMaterialService.getAll("active"),
          returnableMaterialService.getAll("active").catch(() => []),
        ]);
        setUserOptions(
          users.map((u) => ({ value: u.id, label: `${u.userFirstName} ${u.userLastName}` }))
        );
        setMaterialOptions(buildMaterialOptions(consumables, returnables));
      } catch {
        setErrors((prev) => ({ ...prev, form: "No se pudieron cargar usuarios o materiales." }));
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (idx, field, value) => {
    setMaterials((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };
  const addMaterial    = () => setMaterials((prev) => [...prev, { materialId: "", borrowedQuantity: "" }]);
  const removeMaterial = (idx) => setMaterials((prev) => prev.filter((_, i) => i !== idx));

  const mapErrors = (issues) => {
    const fe = {};
    const me = [];
    for (const issue of issues) {
      if (issue.path[0] === "materials" && typeof issue.path[1] === "number") {
        me[issue.path[1]] = { ...(me[issue.path[1]] || {}), [issue.path[2]]: issue.message };
      } else if (issue.path[0] === "materials") {
        fe.materials = issue.message;
      } else {
        fe[issue.path[0]] = issue.message;
      }
    }
    setErrors(fe);
    setMaterialErrors(me);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = loanSchema.safeParse({ ...formData, materials });
    if (!result.success) {
      mapErrors(result.error.issues);
      return;
    }

    setErrors({});
    setMaterialErrors([]);
    setIsSubmitting(true);
    try {
      const d = result.data;
      await loanService.create({
        apprenticeGroup: Number(d.apprenticeGroup),
        useJustification: d.useJustification,
        returnDate: d.returnDate,
        lenderId: Number(d.lenderId),
        receiverId: Number(d.receiverId),
        materials: d.materials.map((m) => ({
          materialId: Number(m.materialId),
          borrowedQuantity: Number(m.borrowedQuantity),
        })),
      });
      navigate("/dashboard/loans");
    } catch (error) {
      const detalles = error.response?.data?.detalles;
      setErrors({
        form: detalles?.join(" · ") ?? error.response?.data?.error ?? "Error al crear el préstamo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <form
        className="grid gap-6 mx-6 md:mx-12 md:grid-cols-2 justify-items-center w-full max-w-4xl"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-6 w-[320px]">
          <Select
            label="Prestador"
            name="lenderId"
            options={userOptions}
            value={formData.lenderId}
            onChange={handleChange}
            error={errors.lenderId}
          />
          <Select
            label="Receptor"
            name="receiverId"
            options={userOptions}
            value={formData.receiverId}
            onChange={handleChange}
            error={errors.receiverId}
          />
          <Input
            label="Grupo de aprendices"
            name="apprenticeGroup"
            type="number"
            placeholder="Ingrese el número del grupo"
            value={formData.apprenticeGroup}
            onChange={handleChange}
            error={errors.apprenticeGroup}
          />
        </div>

        <div className="flex flex-col gap-6 w-[320px]">
          <Input
            label="Fecha de devolución"
            name="returnDate"
            type="date"
            value={formData.returnDate}
            onChange={handleChange}
            error={errors.returnDate}
          />
          <Input
            label="Justificación de uso"
            name="useJustification"
            placeholder="Escriba aquí la justificación"
            value={formData.useJustification}
            onChange={handleChange}
            error={errors.useJustification}
          />
        </div>

        <div className="md:col-span-2 w-full max-w-170">
          <LoanMaterialLines
            lines={materials}
            options={materialOptions}
            onChange={handleMaterialChange}
            onAdd={addMaterial}
            onRemove={removeMaterial}
            errors={materialErrors}
            generalError={errors.materials}
          />
        </div>

        {errors.form && (
          <p className="md:col-span-2 text-error font-secondary text-center">{errors.form}</p>
        )}

        <div className="md:col-span-2 flex items-center justify-center gap-6">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Préstamo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
