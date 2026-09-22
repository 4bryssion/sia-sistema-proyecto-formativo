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
// El cuerpo va en un componente aparte que solo se monta con el modal abierto:
// así el campo arranca con el grupo que toca sin el useEffect que hacía setState
// (regla react-hooks/set-state-in-effect).
export default function EditGroupModal({ group, isOpen, onClose, onSave }) {
  if (!isOpen || !group) return null;

  return <EditGroupBody group={group} onClose={onClose} onSave={onSave} />;
}

function EditGroupBody({ group, onClose, onSave }) {
  const [groupName, setGroupName] = useState(group.groupName ?? "");
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
      await groupService.update(group.id, result.data);
      Alert.success("Grupo actualizado");
      onSave?.();
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al actualizar el grupo";
      Alert.error("Error al actualizar el grupo", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar Grupo"
      size="sm"
      closeOnBackdrop={false}
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <Input
        type="text"
        label="Nombre del grupo"
        name="groupName"
        placeholder="Ingrese el nombre del grupo"
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
