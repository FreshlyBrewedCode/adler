import { Command } from "commander"
import { spanListCmd } from "./list"
import { spanGetCmd } from "./get"

export const spanCmd = new Command("span")
  .description("Span inspection commands")
  .addCommand(spanListCmd)
  .addCommand(spanGetCmd)
