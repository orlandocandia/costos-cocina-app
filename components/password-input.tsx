"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  /** Ícono opcional a la izquierda (ej. candado). */
  leftIcon?: React.ReactNode;
};

/**
 * Input de contraseña con botón de "ojo" para mostrar/ocultar.
 *
 * Reemplaza a `<Input type="password" />` con la misma API, así que se puede
 * usar como drop-in. El botón tiene `tabIndex={-1}` para no interferir con
 * la navegación por teclado del formulario.
 */
export function PasswordInput({
  className,
  leftIcon,
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const type = show ? "text" : "password";

  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leftIcon}
        </span>
      )}
      <Input
        type={type}
        className={cn(leftIcon && "pl-9", "pr-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
        tabIndex={-1}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
