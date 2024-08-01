import * as fs from "fs";
import * as types from "@babel/types";
import * as parser from "@babel/parser";
import getMapping from "./utils/getMapping";
import traverse, { NodePath } from "@babel/traverse";
import { transformFromAstSync } from "@babel/core";

import { Command } from "commander";

// Define Commander.js program
const program = new Command()
  .version("0.1.0")
  .description("Transform code based on mappings")
  .argument("<source>", "Source file path")
  .argument("<target>", "Target file path")
  .action((source: string, target: string) => {
    // Check if both arguments are provided
    if (!source || !target) {
      console.error("Please provide both source and target file paths.");
      program.help();
    }

    const code = fs.readFileSync(source, "utf8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "decorators-legacy"],
    });

    // Traverse AST nodes and apply transformations
    traverse(ast, {
      ExportNamedDeclaration(path: NodePath<types.ExportNamedDeclaration>) {
        const { declaration } = path.node;
        if (types.isFunctionDeclaration(declaration) && declaration.id) {
          const mapping = getMapping(declaration.id.type, declaration.id.name);
          if (mapping) {
            console.log(`Mapping ${declaration.id.name} to ${mapping}`);
            declaration.id.name = mapping;
          }
        }
      },

      VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
        path.node.declarations.forEach((declaration) => {
          if (types.isIdentifier(declaration.id)) {
            const mapping = getMapping(
              declaration.id.type,
              declaration.id.name,
            );
            if (mapping) {
              console.log(`Mapping ${declaration.id.name} to ${mapping}`);
              declaration.id.name = mapping;
              return;
            }
            console.log(declaration.id.name);
          }
        });
      },

      Function(path: NodePath<types.Function>) {
        path.node.params.forEach((param) => {
          if (types.isIdentifier(param)) {
            const mapping = getMapping(param.type, param.name);
            if (mapping) {
              console.log(`Mapping ${param.name} to ${mapping}`);
              param.name = mapping;
              return;
            }
            types.addComment(path.node, "inner", `@${param.name}`, false);
            console.log(param.name);
          }
        });
      },
    });

    const result = transformFromAstSync(ast, code);
    if (!result || !result.code) {
      throw new Error("Failed to transform code");
    }

    fs.writeFileSync(target, result.code, "utf8");
    console.log("Done");
  });

// Parse command line arguments
program.parse(process.argv);

// If no command is given, print help message
if (!process.argv.slice(2).length) {
  program.help();
}

export default program;
