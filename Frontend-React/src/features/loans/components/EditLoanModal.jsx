// Editar préstamo — modal (reemplaza a /view/loans/:id/edit).
//
// Al ser un formulario NO se cierra con clic fuera: solo con Cancelar o con la X,
// que va por fuera del modal en una esquina.
//
// El guard de estado se repite aquí aunque la fila de la tabla ya lo aplique: el
// modal se puede abrir desde el de visualizar, y un préstamo puede cambiar de
// estado entre que se cargó la tabla y se pulsa editar.

import { useEffect, useState } from "react";
import { Modal, Input, Select, Button, Alert } from "@/shared";
import { Save } from "lucide-react";
import loanService from "@/shared/services/loanService";
import userService from "@/shared/services/userService";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import returnableMaterialService from "@/shared/services/returnableMaterialService";
import { loanUpdateSchema, todayLocalISO, LOAN_TYPE_OPTIONS } from "../schemas/loanSchema";
import LoanReceiverField from "@/shared/components/loans/LoanReceiverField";
import { buildMaterialOptions } from "../utils/materialOptions";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";
import LoanMaterialLines from "./LoanMaterialLines.jsx";

export default function EditLoanModal({ isOpen, loanId, onClose, onSaved }) {
  const [loan, setLoan]                       = useState(null);
  const [form, setForm]                       = useState(null);
  const [materials, setMaterials]             = useState([]);
  const [userOptions, setUserOptions]         = useState([]);
  // El prestador responde por el material: solo cuentadantes, igual que en crear
  const [lenderOptions, setLenderOptions]     = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [errors, setErrors]                   = useState({});
  const [materialErrors, setMaterialErrors]   = useState([]);
  const [saving, setSaving]                   = useState(false);
  const [loadError, setLoadError]             = useState(null);

  useEffect(() => {
    if (!isOpen || !loanId) return;

    (async () => {
      // Estado limpio en cada apertura: si no, al abrir un segundo préstamo se
      // verían por un instante los datos del anterior
      setForm(null);
      setLoan(null);
      setMaterials([]);
      setErrors({});
      setMaterialErrors([]);
      setLoadError(null);
      try {
        const [l, users, consumables, returnables] = await Promise.all([
          loanService.getById(loanId),
          userService.getAll(),
          consumableMaterialService.getAll("active"),
          returnableMaterialService.getAll("active").catch(() => []),
        ]);
        setLoan(l);

        const lender   = l.signatures?.find((s) => s.party === "Prestador");
        const receiver = l.signatures?.find((s) => s.party === "Receptor");

        setForm({
          // (p48) El grupo es opcional: null se muestra como vacío, no como "0"
          apprenticeGroup:  l.apprenticeGroup != null ? String(l.apprenticeGroup) : "",
          loanType:         l.loanType ?? "",
          useJustification: l.useJustification ?? "",
          returnDate:       l.returnDate ? String(l.returnDate).slice(0, 10) : "",
          lenderId:         String(lender?.userId ?? ""),
          // (p48) La firma del receptor externo guarda userId null + externalEmail:
          // de ahí se deduce con cuál de los dos campos se creó el préstamo
          receiverRegistered: receiver?.userId != null,
          receiverId:       receiver?.userId != null ? String(receiver.userId) : "",
          receiverEmail:    receiver?.externalEmail ?? "",
        });

        setMaterials(
          (l.materials ?? []).map((lm) => ({
            materialId:       String(lm.materialId),
            borrowedQuantity: String(lm.borrowedQuantity),
          })),
        );

        // El SADMIN ya viene excluido por el backend (systemIdentities.js)
        setUserOptions(
          users.map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` })),
        );
        setLenderOptions(
          users
            .filter((u) => u.userAccountType === "Cuentadante")
            .map((u) => ({ value: String(u.id), label: `${u.userFirstName} ${u.userLastName}` })),
        );

        // Disponibles + los que el préstamo ya tiene. Los que ya están en la
        // lista de disponibles NO se sobrescriben: su entrada trae el tipo y el
        // disponible reales.
        const optionMap = new Map();
        buildMaterialOptions(consumables, returnables).forEach((o) => optionMap.set(o.value, o));
        (l.materials ?? []).forEach((lm) => {
          if (optionMap.has(String(lm.materialId))) return;
          optionMap.set(String(lm.materialId), {
            value: String(lm.materialId),
            label: lm.consumableMaterial?.materialName ?? `#${lm.materialId}`,
            type: lm.consumableMaterial?.returnable ? "devolutivo" : "consumible",
            // Ya no figura como disponible porque está prestado justo aquí: lo
            // reasignable sin tocar stock es lo ya prestado
            available: lm.borrowedQuantity,
          });
        });
        setMaterialOptions([...optionMap.values()]);
      } catch (err) {
        setLoadError(err.response?.data?.error ?? "Error al cargar el préstamo");
      }
    })();
  }, [isOpen, loanId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      // Al cambiar de tipo de receptor se limpia el campo que deja de aplicar:
      // el backend recibe uno u otro (xor), nunca los dos
      setForm((prev) => ({
        ...prev,
        [name]: checked,
        ...(name === "receiverRegistered"
          ? checked
            ? { receiverEmail: "" }
            : { receiverId: "" }
          : {}),
      }));
      return;
    }
    // El grupo de aprendices es numérico pero el campo es de texto, para no
    // arrastrar las flechas del type="number"
    const limpio = name === "apprenticeGroup" ? value.replace(/\D/g, "") : value;
    setForm((prev) => ({ ...prev, [name]: limpio }));
  };

  const disponibleDe = (materialId) =>
    materialOptions.find((o) => String(o.value) === String(materialId))?.available ?? null;

  const handleMaterialChange = (idx, field, value) =>
    setMaterials((prev) =>
      prev.map((linea, i) => {
        if (i !== idx) return linea;

        if (field === "materialId") {
          const tope = disponibleDe(value);
          const actual = linea.borrowedQuantity;
          return {
            materialId: value,
            borrowedQuantity: !value
              ? ""
              : actual === ""
                ? "0"
                : tope != null && Number(actual) > tope
                  ? String(tope)
                  : actual,
          };
        }

        const tope = disponibleDe(linea.materialId);
        let cantidad = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        if (cantidad === "") cantidad = linea.materialId ? "0" : "";
        if (tope != null && Number(cantidad) > tope) cantidad = String(tope);
        return { ...linea, borrowedQuantity: cantidad };
      }),
    );

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
    e?.preventDefault();

    const result = loanUpdateSchema.safeParse({ ...form, materials });
    if (!result.success) {
      mapErrors(result.error.issues);
      return;
    }

    setErrors({});
    setMaterialErrors([]);
    setSaving(true);
    try {
      Alert.loading("Actualizando préstamo...");
      const d = result.data;
      await loanService.update(loanId, {
        // (p48) Grupo opcional: vacío se OMITE para que quede null en BD
        ...(d.apprenticeGroup ? { apprenticeGroup: Number(d.apprenticeGroup) } : {}),
        loanType:         d.loanType,
        useJustification: d.useJustification,
        returnDate:       d.returnDate,
        lenderId:         Number(d.lenderId),
        // (p48) Uno u otro, nunca ambos: es lo que exige el `xor` del backend
        ...(d.receiverRegistered
          ? { receiverId: Number(d.receiverId) }
          : { receiverEmail: d.receiverEmail }),
        ...(d.status ? { status: d.status } : {}),
        materials: d.materials.map((m) => ({
          materialId:       Number(m.materialId),
          borrowedQuantity: Number(m.borrowedQuantity),
        })),
      });
      Alert.close();
      Alert.success("Préstamo actualizado");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al actualizar el préstamo.");
      Alert.error("Error al actualizar el préstamo", msg);
    } finally {
      setSaving(false);
    }
  };

  // Solo los préstamos Activos se editan: uno pendiente de firma todavía no
  // existe como compromiso y uno finalizado ya movió stock
  const bloqueado = loan && loan.status !== "Activo";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar préstamo"
      size="xl"
      // Formulario: un clic fuera no puede descartar lo escrito
      closeOnBackdrop={false}
      closeButtonOutside
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={handleSubmit}
            disabled={saving || !form || bloqueado}
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      {loadError ? (
        <p className="text-error font-secondary">{loadError}</p>
      ) : bloqueado ? (
        <p className="text-error font-secondary">
          Solo los préstamos en estado Activo pueden editarse. Estado actual:{" "}
          {getLoanStatusLabel(loan.status)}.
        </p>
      ) : !form ? (
        <p className="text-text-muted font-secondary">Cargando préstamo...</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

          {/* Datos del préstamo */}
          <div className="flex flex-col gap-4 w-full">
            <Select
              widthClass="w-full"
              label="Prestador"
              variant="search"
              name="lenderId"
              required
              options={lenderOptions}
              value={form.lenderId}
              onChange={handleChange}
              error={errors.lenderId}
            />
            <LoanReceiverField
              idCasilla="receiverRegisteredEdit"
              registered={form.receiverRegistered}
              receiverId={form.receiverId}
              receiverEmail={form.receiverEmail}
              userOptions={userOptions}
              onChange={handleChange}
              errors={errors}
            />
            {/* (p48) Tipo de préstamo: independiente de si el receptor está
                registrado */}
            <Select
              widthClass="w-full"
              label="Tipo de préstamo"
              name="loanType"
              required
              options={LOAN_TYPE_OPTIONS}
              value={form.loanType}
              onChange={handleChange}
              error={errors.loanType}
            />
            <Input
              widthClass="w-full"
              label="Grupo de aprendices (opcional)"
              name="apprenticeGroup"
              type="text"
              inputMode="numeric"
              value={form.apprenticeGroup}
              onChange={handleChange}
              error={errors.apprenticeGroup}
            />
            <Input
              widthClass="w-full"
              label="Fecha de devolución"
              name="returnDate"
              required
              type="date"
              min={todayLocalISO()}
              value={form.returnDate}
              onChange={handleChange}
              error={errors.returnDate}
            />
            <Input
              widthClass="w-full"
              label="Justificación de uso"
              name="useJustification"
              required
              value={form.useJustification}
              onChange={handleChange}
              error={errors.useJustification}
            />
          </div>

          {/* Materiales: el mismo componente del formulario de crear */}
          <div className="flex flex-col gap-4 w-full">
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

        </form>
      )}
    </Modal>
  );
}
