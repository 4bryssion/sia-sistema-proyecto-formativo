import {
    createContext, // Define un contenedor de datos
    useContext, // Consume el estado en cualquier subcomponente (Button, menu, item)
    useEffect,
    useRef,
    useState,
    cloneElement
} from "react"
import { createPortal } from "react-dom"

export const DropdownContext = createContext(null)

export function Dropdown({
    children,
    open: controlledOpen,
    onOpenChange,
    className= ""

}) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

    // triggerRef: referencia al elemento trigger para que DropdownContent
    // pueda calcular su posición con getBoundingClientRect (necesario para el portal)
    const triggerRef = useRef(null)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen

    // value: representa la opcion activa actual
    const setOpen = (value) => {
        if(isControlled){
            onOpenChange?.(value)
        }else{
            setUncontrolledOpen(value)
            onOpenChange?.(value)
        }
    }

    // useRef: Se usa para referenciar el trigger o menú del DropDown
    // El trigger es el elemento que abre o cierra el componente
    const containerRef = useRef(null)

    // Click outside o fuera del componente
    // Excluye el portal (data-dropdown-portal) para no cerrar el menú antes de
    // que el DropdownItem dispare su onClick (el portal vive fuera del containerRef)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if(
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                !e.target.closest("[data-dropdown-portal]")
            ) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Escape key o tecla escape
    useEffect(() => {
        const handleEscape = (e) => {
            if(e.key === "Escape") setOpen(false)
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [])

    // Cierra el menú al hacer scroll para que no quede flotando
    // desconectado del trigger (el portal usa posición fija calculada al abrir)
    useEffect(() => {
        if(!open) return
        const handleScroll = () => setOpen(false)
        window.addEventListener("scroll", handleScroll, true)
        return () => window.removeEventListener("scroll", handleScroll, true)
    }, [open])

    return (
        // Inyecta el estado compartido al dropdown
        <DropdownContext.Provider
            value={{ open, setOpen, triggerRef }}
        >
            <div
                ref={containerRef}
                className={`relative inline-block ${className} font-main`}
            >
                {children}
            </div>
        </DropdownContext.Provider>
    )
}

// Trigger (asChild pattern)
// Adjunta triggerRef al elemento hijo para que DropdownContent pueda leer su posición
export function DropdownTrigger({ children }){
    const { open, setOpen, triggerRef } = useContext(DropdownContext)

    if(!children) return null

    return cloneElement(children, {
        ref: triggerRef,
        onClick: (e) => {
            children.props.onClick?.(e)
            setOpen(!open)
        },
        "aria-expanded": open,
        "aria-haspopup": "menu"
    })
}

// Context
// Se renderiza en un portal (document.body) para escapar del overflow:hidden/auto
// de la tabla y evitar que el menú quede clippeado. La posición se calcula con
// getBoundingClientRect sobre triggerRef y se aplica como position:fixed.
export function DropdownContent({ children, className = "" }) {
    const { open, triggerRef } = useContext(DropdownContext)
    const [style, setStyle] = useState({})

    useEffect(() => {
        if(open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setStyle({
                top: rect.bottom + 4,
                // Alinea el borde derecho del menú con el borde derecho del trigger
                // (equivalente al antiguo right-0 en posicionamiento absoluto)
                right: window.innerWidth - rect.right,
            })
        }
    }, [open])

    if(!open) return null

    return createPortal(
        <div
            data-dropdown-portal
            role="menu"
            style={style}
            className={`fixed z-9999 min-w-48 border text-text-inverse p-1 dark:bg-neutral-950/80 backdrop-blur-[1px] shadow-lg rounded-2xl overflow-hidden hover:shadow-black transition-shadow duration-700 ${className}`}
        >
            {children}
        </div>,
        document.body
    )
}

// Item
export function DropdownItem({
    children,
    onClick,
    keepOpen,
    // (p50) Un item que solo informa ("Devolución ya autorizada", "Sin permiso
    // para autorizar") no es pulsable: se marca así para que no se comporte ni
    // se vea como si lo fuera.
    disabled = false,
    className = ""
}) {
    const { setOpen } = useContext(DropdownContext)

    const handleClick = (e) => {
        if (disabled) return
        onClick?.(e)
        if(keepOpen) return
        setOpen(false)
    }

    return(
        <button
            role="menuitem"
            onClick={handleClick}
            disabled={disabled}
            // (p50) El cursor de mano se decide AQUÍ y no en cada consumidor: un
            // item de menú es pulsable, y repartir esa clase por los sitios que
            // usan el dropdown garantizaba que alguno se quedara sin ella — que
            // es justo lo que pasaba en la navbar.
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors
                cursor-pointer hover:bg-gray-500 focus:bg-gray-100
                disabled:cursor-default disabled:hover:bg-transparent ${className}`}
        >
            {children}
        </button>
    )

}