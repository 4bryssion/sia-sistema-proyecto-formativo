import { useCallback, useMemo, useState } from "react";
import { Select, Checkbox } from "@/shared";
import { isoLocal, isoUtc } from "@/shared/utils/formatDate";
import { usePermissions } from "@/shared/context/PermissionsContext";

/**
 * (p51) Elegir encargados de una tarea entre muchos usuarios.
 *
 * Vive en `shared/` y no dentro del módulo de tareas porque lo usan los dos
 * modales —crear y editar— y uno de ellos se abre también desde la ficha de un
 * usuario. Es el MISMO control en los dos sitios a propósito: si los filtros de
 * crear y los de editar divergieran, corregir una asignación sería un trabajo
 * distinto al de hacerla.
 *
 * Los filtros se dibujan DENTRO del desplegable, encima del buscador, porque es
 * ahí donde existe el problema: con una ficha entera en el sistema, buscar por
 * nombre uno a uno es justo lo que había que evitar.
 *
 * - Grupo: el caso de uso real. Si un grupo lleva el número de ficha y dentro
 *   están sus aprendices, elegirlo deja en la lista exactamente a esa ficha.
 * - Solo usuarios activos: oculta a quien tiene el vínculo vencido o aún sin
 *   empezar. Va marcado por defecto; asignarle una tarea a alguien que ya no
 *   puede entrar al sistema es un error que no avisa de sí mismo.
 *
 * (p51) Y una regla que no es un filtro: a quien pertenece a un grupo DEL
 * SISTEMA solo le asigna tareas un superadministrador o alguien de su mismo
 * grupo. Decisión de Santiago —«solo SADMIN puede otorgar tareas a Admin y entre
 * admin»—, extendida al SADMIN, que su enunciado no cubría. Aquí aparece como
 * fila deshabilitada con el motivo al pasar el cursor: esconderla haría creer
 * que esa persona no existe. El backend la vuelve a imponer, que es donde manda.
 */
// Los grupos del sistema de una persona. Se lee del dato (`isSystem`) y no de
// una lista de nombres en el frontend: marcar otro rol como del sistema no tiene
// que obligar a tocar esta pantalla.
const gruposDelSistemaDe = (u) => (u.groups ?? [])
    .map((ug) => ug.group)
    .filter((g) => g?.isSystem);

export default function AssigneeSelect({
    users = [],
    value = [],
    onChange,
    name = "userIds",
    label = "Usuarios asignados",
    error,
    required = false,
    disabled = false,
}) {
    const { isSuperUser, systemGroups } = usePermissions();
    const [grupo, setGrupo] = useState("");
    const [soloActivos, setSoloActivos] = useState(true);

    // Una opción por usuario, con el bloqueo ya resuelto: la usan las dos listas
    // de abajo y tienen que decir exactamente lo mismo.
    const aOpcion = useCallback((u) => {
        const delSistema = gruposDelSistemaDe(u);
        const mismoGrupo = delSistema.some((g) => systemGroups.includes(g.groupName));
        const bloqueado = delSistema.length > 0 && !isSuperUser && !mismoGrupo;
        return {
            value: String(u.id),
            label: `${u.userFirstName} ${u.userLastName}`,
            disabled: bloqueado,
            motivo: bloqueado
                ? "Administra el sistema: solo un superadministrador, o alguien de "
                  + delSistema.map((g) => `«${g.groupName}»`).join(" o ")
                  + ", puede asignarle tareas."
                : undefined,
        };
    }, [isSuperUser, systemGroups]);

    // Los grupos que de verdad aparecen entre los usuarios cargados, sin repetir.
    // Ofrecer uno sin miembros sería ofrecer un filtro que vacía la lista.
    const gruposDisponibles = useMemo(() => {
        const porId = new Map();
        for (const u of users) {
            for (const ug of u.groups ?? []) {
                const g = ug.group;
                if (g && !porId.has(String(g.id))) porId.set(String(g.id), g.groupName);
            }
        }
        return [...porId.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label, "es"));
    }, [users]);

    const opciones = useMemo(() => {
        const hoy = isoLocal();
        return users
            .filter((u) => {
                if (grupo && !(u.groups ?? []).some((ug) => String(ug.group?.id) === grupo)) return false;
                if (!soloActivos) return true;
                // Las dos fechas son DATE: se leen en UTC o el huso local les resta un día.
                const inicio = isoUtc(u.userStartDate);
                const fin = isoUtc(u.userEndDate);
                return (!inicio || inicio <= hoy) && (!fin || fin >= hoy);
            })
            .map(aOpcion);
    }, [users, grupo, soloActivos, aOpcion]);

    // Quien ya está asignado se conserva aunque los filtros lo dejen fuera: si no,
    // marcar un grupo haría desaparecer de la lista a los que llevas elegidos y
    // «marcar todos» los borraría sin que nadie lo pidiera.
    const opcionesConElegidos = useMemo(() => {
        const dentro = new Set(opciones.map((o) => o.value));
        const faltan = users
            .filter((u) => value.map(String).includes(String(u.id)) && !dentro.has(String(u.id)))
            .map(aOpcion);
        return [...opciones, ...faltan];
    }, [opciones, users, value, aOpcion]);

    return (
        <Select
            variant="search"
            multiple
            permitirMarcarTodos
            name={name}
            label={label}
            required={required}
            disabled={disabled}
            value={value}
            onChange={onChange}
            options={opcionesConElegidos}
            error={error}
            placeholder="Seleccione uno o varios usuarios"
            filasVisibles={4}
            filtros={
                <>
                    <Select
                        name="filtroGrupo"
                        value={grupo}
                        onChange={(e) => setGrupo(e.target.value)}
                        options={gruposDisponibles}
                        placeholder="Todos los grupos"
                        widthClass="w-full"
                    />
                    <Checkbox
                        id={`${name}-solo-activos`}
                        checked={soloActivos}
                        onChange={() => setSoloActivos((v) => !v)}
                        label="Solo usuarios activos"
                        labelClassName="text-caption"
                    />
                </>
            }
        />
    );
}
