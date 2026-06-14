import { Command } from "commander"
import { contextAddCmd } from "./add"
import { contextListCmd } from "./list"
import { contextGetCmd } from "./get"

export const contextCmd = new Command("context")
  .description("Context management commands")
  .addCommand(contextAddCmd)
  .addCommand(contextListCmd)
  .addCommand(contextGetCmd)
