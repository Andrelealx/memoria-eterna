import * as React from "react";
import { cn } from "@/lib/utils";

// Label real associado a campos (acessibilidade, seção 19). Mínimo 14px.
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none text-foreground", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
