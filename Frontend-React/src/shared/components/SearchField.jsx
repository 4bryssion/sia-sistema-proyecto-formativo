import { forwardRef } from "react";
import { Search, X, LoaderCircle } from "lucide-react";
import clsx from "clsx";

const baseStyles = "search flex items-center rounded-xl px-3 transition-all border";

const sizeStyles = {
    sm: "h-9 text-sm",
    md: "h-11 text-sm",
    lg: "h-12 text-base",
};

const variantStyles = {
    // Filled: campo con fondo relleno, borde mínimo o sutil (Material "Filled TextField")
    filled: "bg-neutral-100 border-blue-500 hover:border-blue-700 focus-within:bg-white",

    // Outlined: campo con fondo transparente y borde visible siempre
    outlined: "bg-transparent border-green-500 hover:border-green-600",
};

const SearchField = forwardRef(
    (
        {
            value = "",
            placeholder = "Buscar",
            onChange = () => {},
            onSubmit,
            onClear = () => {},
            size = "md",
            variant = "filled",
            fullWidth = false,
            disabled = false,
            loading = false,
            error = false,
            name = "search",
            ariaLabel = "Campo de búsqueda",
            autoComplete = "off",
            icon,
            className,
        },
        ref
    ) => {
        const SearchIcon = icon || Search;

        const handleClear = () => {
            onChange("");
            onClear();
        };

        const handleSubmit = (e) => {
            e.preventDefault();

            if (disabled || loading) return;

            onSubmit?.(value);
        };

        return(
            <form 
                onSubmit={handleSubmit}
                className={clsx(
                    baseStyles,
                    sizeStyles[size],
                    variantStyles[variant],
                    fullWidth && "w-full",
                    disabled && "opacity-60 pointer-events-none",
                    error
                        ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
                        : "focus-within:ring-2 focus-within:ring-text-primary",
                    className,
                )}
            >
                {loading ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin text-neutral-500" />
                ): (
                    <SearchIcon className="size-4 shrink-0 text-neutral-500" />
                )}

                <input
                    ref={ref}
                    type="search"
                    name={name}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    className="search__input flex-1 bg-transparent px-2 outline-none"
                />
                
                {!!value && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Limpiar búsqueda"
                        className="search__clear rounded-full p-1 hover:bg-neutral-200"
                    >
                        <X className="size-4 text-neutral-500" />
                    </button>
                )}

            </form>
        );
    }
);

SearchField.displayName = "SearchField";

export default SearchField;