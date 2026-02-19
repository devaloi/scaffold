#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("scaffold")
  .description("CLI tool that scaffolds project templates from configurable blueprints")
  .version("1.0.0");

program.parse();
