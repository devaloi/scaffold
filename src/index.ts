#!/usr/bin/env node

import { Command } from "commander";
import { registerCommands } from "./cli/commands.js";

const program = new Command();

program
  .name("scaffold")
  .description(
    "CLI tool that scaffolds project templates from configurable blueprints",
  )
  .version("1.0.0");

registerCommands(program);

program.parse();
