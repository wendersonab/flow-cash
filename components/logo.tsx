import Image from "next/image"
import brandIcon from "@/src/assets/brand/icon.png"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
}

/**
 * Marca centralizada da aplicação.
 *
 * O símbolo vem de src/assets/brand/icon.png.
 * O texto "FlowCash" continua como texto real para acompanhar tema,
 * responsividade e classes Tailwind sem depender de uma imagem fixa.
 */
export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={brandIcon}
        alt={showText ? "" : "FlowCash"}
        aria-hidden={showText}
        priority
        className={cn("size-8 shrink-0 select-none object-contain", iconClassName)}
      />

      {showText && (
        <span
          className={cn(
            "select-none text-lg font-semibold tracking-tight text-foreground",
            textClassName,
          )}
        >
          FlowCash
        </span>
      )}
    </div>
  )
}
