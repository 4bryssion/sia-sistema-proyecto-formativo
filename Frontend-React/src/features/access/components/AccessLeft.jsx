import {
  Select,
  Alert,
  PermissionGate,
  usePermissions
} from "@/shared";

export default function AccessLeft({
  groups,
  users,
  selectedGroupId,
  selectedUserId,
  onGroupChange,
  onUserChange,
  userGroups,
  onAssignGroup,
  onRemoveGroup,
}) {
  const { can } = usePermissions();

  const groupOptions = [
    ...groups.map((g) => ({ value: String(g.id), label: g.groupName })),
  ];

  const userOptions = [
    ...users.map((u) => ({
      value: String(u.id),
      label: `${u.userFirstName} ${u.userLastName}`,
    })),
  ];

  // (p51) La pertenencia a grupos se gestiona con UN solo control: el select
  // con buscador y selección múltiple, el mismo que el resto del sistema. Antes
  // eran dos cosas distintas —una lista de recuadros con una ✕ para quitar, y
  // debajo un select básico con un botón para añadir—, lo que obligaba a
  // aprender dos gestos para una sola idea: a qué grupos pertenece esta persona.
  //
  // El componente ya pone los marcados de primeros, así que lo que el usuario
  // tiene ahora mismo se lee de un vistazo sin desplegar nada.
  const gruposActuales = userGroups.map((ug) => String(ug.groupId));

  const puedeAsignar = can("assign_group_to_user");
  const puedeRemover = can("remove_group_from_user");

  // Marcar y desmarcar son DOS permisos distintos, y el control es uno solo. El
  // gate de fuera deja pasar a quien tenga al menos uno; aquí se comprueba la
  // dirección concreta, para que a quien solo puede asignar no se le deshaga en
  // silencio un intento de quitar.
  const cambiarGrupos = async (e) => {
    const siguiente = (e.target.value ?? []).map(String);
    const agregados = siguiente.filter((id) => !gruposActuales.includes(id));
    const quitados = gruposActuales.filter((id) => !siguiente.includes(id));

    for (const id of agregados) {
      if (!puedeAsignar) { Alert.sinPermiso("asignarle un grupo a un usuario"); continue; }
      await onAssignGroup(id);
    }
    for (const id of quitados) {
      if (!puedeRemover) { Alert.sinPermiso("quitarle un grupo a un usuario"); continue; }
      await onRemoveGroup(Number(id));
    }
  };

  return (

    <div className="font-main space-y-6 grid min-w-0 min-[768px]:max-[1023px]:grid-cols-2 min-[768px]:max-[1023px]:gap-4 min-[768px]:max-[1023px]:space-y-0">

      {/* Sección Grupos */}
      <div className="justify-items-center w-full max-w-[320px] justify-self-center min-w-0">

        <h3 className="text-h3 text-text-inverse text-center font-main">
          Grupos usuarios
        </h3>

        {/* (p50) Variante de búsqueda, como el de usuario que va justo debajo:
            con un grupo por cada rol del sistema, la lista nativa obligaba a
            recorrerla entera. 4 filas a la vista por el mismo motivo que allí:
            con 5 el desplegable tapa lo que viene abajo. Las demás siguen ahí,
            desplazándose. */}
        <Select
          variant="search"
          name="groupId"
          value={selectedGroupId ? String(selectedGroupId) : ""}
          onChange={(e) => onGroupChange(e.target.value)}
          options={groupOptions}
          filasVisibles={4}
          className="w-full min-w-0"
        />

      </div>

      {/* Sección Usuario individual */}
      <div className="grid gap-2 justify-items-center w-full max-w-[320px] justify-self-center min-w-0">

        <h3 className="text-h3 text-text-inverse text-center font-main">
          Usuario individual
        </h3>

        {/* 4 filas a la vista y no las 5 por defecto: justo debajo va la lista
            de grupos del usuario, y con 5 el desplegable la tapaba entera */}
        <Select
          variant="search"
          name="userId"
          value={selectedUserId ? String(selectedUserId) : ""}
          onChange={(e) => onUserChange(e.target.value)}
          options={userOptions}
          filasVisibles={4}
          className="w-full min-w-0 justify-self-center"
        />

        {selectedUserId && (
          <div className="w-full grid gap-1.5 mt-1 justify-self-center min-w-0">
            <span className="font-secondary text-small text-text-inverse/70">
              Grupos del usuario
            </span>

            {/* Un solo gate, con los dos permisos: basta tener uno para que el
                control sirva de algo, y la dirección que falte se avisa dentro. */}
            <PermissionGate
              codename={["assign_group_to_user", "remove_group_from_user"]}
              accion="gestionar los grupos de un usuario"
              className="w-full min-w-0"
            >
              <Select
                variant="search"
                multiple
                name="userGroupIds"
                value={gruposActuales}
                onChange={cambiarGrupos}
                options={groupOptions}
                placeholder="Sin grupos asignados"
                filasVisibles={4}
                className="w-full min-w-0 justify-self-center"
              />
            </PermissionGate>
          </div>
        )}
      </div>
    </div>
  );
}