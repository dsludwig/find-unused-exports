#!/usr/bin/env node

import { relative } from 'path';
import arg from 'arg';
import kleur from 'kleur';
import CliError from '../private/CliError.mjs';
import errorConsole from '../private/errorConsole.mjs';
import reportCliError from '../private/reportCliError.mjs';
import parseMapping from '../private/parseMapping.mjs';
import findUnusedExports from '../public/findUnusedExports.mjs';

/**
 * Runs the `find-unused-exports` CLI.
 * @kind function
 * @name findUnusedExportsCli
 * @returns {Promise<void>} Resolves once the operation is done.
 * @ignore
 */
async function findUnusedExportsCli() {
  try {
    const {
      '--module-glob': moduleGlob,
      '--resolve-file-extensions': resolveFileExtensionsList,
      '--resolve-index-files': resolveIndexFiles,
      '--aliases': aliasList,
    } = arg({
      '--module-glob': String,
      '--resolve-file-extensions': String,
      '--resolve-index-files': Boolean,
      '--aliases': String,
    });

    if (resolveIndexFiles && !resolveFileExtensionsList)
      throw new CliError(
        'The `--resolve-index-files` flag can only be used with the `--resolve-file-extensions` argument.'
      );

    const unusedExports = await findUnusedExports({
      moduleGlob,
      resolveFileExtensions: resolveFileExtensionsList
        ? resolveFileExtensionsList.split(',')
        : undefined,
      resolveIndexFiles,
      aliases: aliasList
        ? parseMapping(aliasList)
        : undefined
    });

    // Sort the list so that the results will be deterministic (important for
    // snapshot tests) and tidy (for output readability).
    const unusedExportsModulePaths = Object.keys(unusedExports).sort();
    const countUnusedExportsModules = unusedExportsModulePaths.length;

    let countUnusedExports = 0;

    if (countUnusedExportsModules) {
      const cwd = process.cwd();

      for (const path of unusedExportsModulePaths) {
        const exports = unusedExports[path];

        countUnusedExports += exports.size;

        errorConsole.group(`\n${kleur.underline().red(relative(cwd, path))}`);
        errorConsole.error(kleur.dim().red(Array.from(exports).join(', ')));
        errorConsole.groupEnd();
      }

      errorConsole.error(
        `\n${kleur
          .bold()
          .red(
            `${countUnusedExports} unused export${
              countUnusedExports === 1 ? '' : 's'
            } in ${countUnusedExportsModules} module${
              countUnusedExportsModules === 1 ? '' : 's'
            }.`
          )}\n`
      );

      process.exitCode = 1;
    } else console.info(`\n${kleur.bold().green(`0 unused exports.`)}\n`);
  } catch (error) {
    reportCliError('find-unused-exports', error);

    process.exitCode = 1;
  }
}

findUnusedExportsCli();
