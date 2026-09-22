import { useState } from "react";
import { Button, Input, Alert, Modal } from "@/shared";
import { groupSchema } from "@/shared/schemas/groupSchema";
import groupService from "@/shared/services/groupService";

// (p49) Antes dibujaba su propio overlay a mano: un clic fuera lo cerraba y se
// perdía lo escrito, no atendía Escape, no entraba en la pila de modales y
// repetía el marcado que ya resuelve `Modal`. Ahora usa el componente
// compartido, igual que sus gemelos de inventarios.
//
// La etiqueta del campo pasó a la prop `label` del Input, que ya la dibuja con
// font-secondary y el token de color; antes era un <label> a mano con
// `text-medium font-medium text-gray-700` — sin variable de tipografía y con el
// gris cableado.
//
// El cuerpo va en un componente aparte que solo se monta con isOpen en true: así
// cada apertura arranca con el campo vacío sin el useEffect que hacía setState
// (regla react-hooks/set-state-in-effect).
export default function CreateGroupModal({ isOpen, onClose, onSave }) {
  if (!isOpen) return null;

  return <CreateGroupBody onClose={onClose} onSave={onSave} />;
}

function CreateGroupBody({ onClose, onSave }) {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const result = groupSchema.safeParse({ groupName });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dato inválido");
      return;
    }
    setSaving(true);
    try {
      const res = await groupService.create(result.data);
      // Se pasa el grupo creado al callback (ej. para autoseleccionarlo en crear
      // usuario); los consumidores que lo ignoran (refetch) siguen igual
      Alert.success("Grupo creado");
      onSave?.(res?.data ?? res);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al crear el grupo";
      Alert.error("Error al crear el grupo", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Crear Grupo"
      size="sm"
      closeOnBackdrop={false}
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </Button>
        </>
      }
    >
      <Input
        type="text"
        label="Nombre del grupo"
        name="groupName"
        placeholder="Ej: Administrador"
        value={groupName}
        onChange={(e) => {
          setGroupName(e.target.value);
          setError("");
        }}
        error={error}
      />
    </Modal>
  );
}
