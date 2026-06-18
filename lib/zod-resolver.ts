import { zodResolver } from "@hookform/resolvers/zod"
import type { ZodType } from "zod"
import type { Resolver, FieldValues } from "react-hook-form"

/**
 * Wrapper para contornar a incompatibilidade de tipos entre
 * zod v4 e @hookform/resolvers v5. Em runtime funciona normalmente.
 */
export function resolver<T extends FieldValues>(schema: ZodType): Resolver<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema as any) as unknown as Resolver<T>
}
