import { calcularTotal } from "./materialTotal";

// (p49) Las dos reglas que ligan entre sí los campos de un material. Estaban
// copiadas palabra por palabra en los cuatro formularios (crear y editar, de
// consumo y devolutivo): cualquier ajuste había que hacerlo cuatro veces, y por
// eso los módulos se fueron separando en el pasado.
//
//  1. Placa SENA ⇒ material serializado. La cantidad se fija en 1 y se bloquea;
//     al borrar la placa se vacía y se habilita de nuevo.
//     OJO: ese 1 es SOLO VISUAL. Al enviar, la cantidad de un serializado viaja
//     vacía para que el backend la guarde como null, porque `quantity == null`
//     es lo que identifica a un serializado en préstamos y devoluciones.
//
//  2. Valor total = cantidad × valor unitario. Se recalcula solo cuando cambia
//     algo que lo afecta, así que quien lo sobrescriba a mano conserva su valor.
//
// @param {object} prev  estado actual del formulario
// @param {string} name  campo que cambió
// @param {string} value nuevo valor
// @returns {object} el estado siguiente
export const aplicarCambioDeMaterial = (prev, name, value) => {
  const next = { ...prev, [name]: value };

  if (name === "senaPlate") {
    next.quantity = value ? "1" : "";
  }

  if (name === "quantity" || name === "unitPrice" || name === "senaPlate") {
    const total = calcularTotal(next.quantity, name === "unitPrice" ? value : prev.unitPrice);
    if (total !== null) next.totalPrice = total;
  }

  return next;
};
