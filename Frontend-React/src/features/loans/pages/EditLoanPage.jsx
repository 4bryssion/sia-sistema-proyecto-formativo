import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import loanService from "../services/loanService";
import userService from "@/features/users/services/userService";
import consumableMaterialService from "@/features/consumable-material/services/consumableMaterialService";
import returnableMaterialService from "@/features/returnable-material/services/returnableMaterialService";
import { loanUpdateSchema } from "../schemas/loanSchema";
import { buildMaterialOptions } from "../utils/materialOptions";
import LoanEditLeft from "../components/LoanEditLeft";
import LoanEditRight from "../components/LoanEditRight";

export default function EditLoanPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan]                       = useState(null);
  const [form, setForm]                       = useState(null);
  const [materials, setMaterials]             = useState([]);
  const [userOptions, setUserOptions]         = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [errors, setErrors]                   = useState({});
  const [materialErrors, setMaterialErrors]   = useState([]);
  const [saving, setSaving]                   = useState(false);
  const [loadError, setLoadError]             = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [l, users, consumables, returnables] = await Promise.all([
          loanService.getById(id),
          userService.getAll(),
          consumableMaterialService.getAll("active"),
          returnableMaterialService.getAll("active").catch(() => []),
        ]);
        setLoan(l);

        const lender   = l.signatures?.find((s) => s.party === "Prestador");
        const receiver = l.signatures?.find((s) => s.party === "Receptor");

        setForm({
          apprenticeGroup:  String(l.apprenticeGroup ?? ""),
          useJustification: l.useJustification ?? "",
          returnDate:       l.returnDate ? String(l.returnDate).slice(0, 10) : "",
          lenderId:         String(lender?.userId ?? ""),
          receiverId:       String(receiver?.userId ?? ""),
          status:           l.status ?? "",
        });

        setMaterials(
          (l.materials ?? []).map((lm) => ({
            materialId:       String(lm.materialId),
            borrowedQuantity: String(lm.borrowedQuantity),
          }))
        );

        setUserOptions(
          users.map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` }))
        );

        // Disponibles (consumo + devolutivo) + los que el préstamo ya tiene
        const optionMap = new Map();
        buildMaterialOptions(consumables, returnables).forEach((o) => optionMap.set(o.value, o));
        (l.materials ?? []).forEach((lm) =>
          optionMap.set(String(lm.materialId), {
            value: String(lm.materialId),
            label: lm.consumableMaterial?.materialName ?? `#${lm.materialId}`,
            type: "consumible",
          })
        );
        setMaterialOptions([...optionMap.values()]);
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el préstamo");
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialChange = (idx, field, value) =>
    setMaterials((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

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

  const handleSubmit = async () => {
    const result = loanUpdateSchema.safeParse({ ...form, materials });
    if (!result.success) {
      mapErrors(result.error.issues);
      return;
    }
    setErrors({});
    setMaterialErrors([]);
    setSaving(true);
    try {
      const d = result.data;
      await loanService.update(id, {
        apprenticeGroup:  Number(d.apprenticeGroup),
        useJustification: d.useJustification,
        returnDate:       d.returnDate,
        lenderId:         Number(d.lenderId),
        receiverId:       Number(d.receiverId),
        ...(d.status ? { status: d.status } : {}),
        materials: d.materials.map((m) => ({
          materialId:       Number(m.materialId),
          borrowedQuantity: Number(m.borrowedQuantity),
        })),
      });
      navigate(`/view/loans/${id}`);
    } catch (err) {
      const det = err.response?.data?.detalles;
      setErrors({
        form: det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <p className="p-6 text-error">{loadError}</p>;
  if (!form)     return <p className="p-6 text-gray-600">Cargando préstamo...</p>;
  if (loan && loan.status !== "Activo")
    return (
      <p className="p-6 text-error">
        Solo los préstamos en estado Activo pueden editarse. Estado actual: {loan.status}.
      </p>
    );

  return (
    <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
      <div className="bg-black p-16 1400:h-full">
        <LoanEditLeft loan={loan} />
      </div>
      <div className="bg-white p-4">
        <LoanEditRight
          form={form}
          onChange={handleChange}
          userOptions={userOptions}
          materialOptions={materialOptions}
          materials={materials}
          onMaterialChange={handleMaterialChange}
          onAddMaterial={addMaterial}
          onRemoveMaterial={removeMaterial}
          materialErrors={materialErrors}
          errors={errors}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </div>
  );
}
