import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, Alert } from "@/shared";
import { loanSchema, todayLocalISO } from "../schemas/loanSchema.js";
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
        // El SADMIN ya viene excluido por el backend (systemIdentities.js)
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
      Alert.success(
        "Préstamo creado",
        "Se enviaron los correos de firma al prestador y al receptor."
      );
      navigate("/dashboard/loans");
    } catch (error) {
      const detalles = error.response?.data?.detalles;
      const msg = detalles?.join(" · ") ?? error.response?.data?.error ?? "Error al crear el préstamo.";
      Alert.error("Error al crear el préstamo", msg);
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cuadro blanco que envuelve el formulario sobrepasándolo 32px (p-8),
          igual que en los módulos de materiales */}
      <div className="bg-white rounded-xl shadow-sm p-8 w-full">
      <form
        className="grid gap-6 md:grid-cols-2 justify-items-center w-full"
        onSubmit={handleSubmit}
      >
        {/* Columna izquierda: datos del préstamo */}
        <div className="flex flex-col gap-6 w-full md:w-[320px]">
          <Select
            label="Prestador" variant="search"
            name="lenderId"
            required
            options={userOptions}
            value={formData.lenderId}
            onChange={handleChange}
            error={errors.lenderId}
          />
          <Select
            label="Receptor" variant="search"
            name="receiverId"
            required
            options={userOptions}
            value={formData.receiverId}
            onChange={handleChange}
            error={errors.receiverId}
          />
          <Input
            label="Grupo de aprendices"
            name="apprenticeGroup"
            required
            type="number"
            placeholder="Ingrese el número del grupo"
            value={formData.apprenticeGroup}
            onChange={handleChange}
            error={errors.apprenticeGroup}
          />
          <Input
            label="Fecha de devolución"
            name="returnDate"
            required
            type="date"
            min={todayLocalISO()}
            value={formData.returnDate}
            onChange={handleChange}
            error={errors.returnDate}
          />
          <Input
            label="Justificación de uso"
            name="useJustification"
            required
            placeholder="Escriba aquí la justificación"
            value={formData.useJustification}
            onChange={handleChange}
            error={errors.useJustification}
          />
        </div>

        {/* Columna derecha: materiales */}
        <div className="flex flex-col gap-6 w-full md:w-[320px]">
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

        {/* Mensajes de error generales */}
        {errors.form && (
          <p className="md:col-span-2 text-error font-secondary text-center">{errors.form}</p>
        )}

        {/* Botones de acción */}
        <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-between gap-3 mt-8 sm:mt-4 lg:px-10 w-full">
          <Button
            variant="secondary"
            size="sm" onClick={() => navigate(-1)}
            className="w-full sm:w-auto sm:self-start">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm" type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:self-end"
            >
            {isSubmitting ? "Creando..." : "Crear Préstamo"}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
