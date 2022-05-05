import * as fs from 'fs';
import { Dirent, readdirSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import postcss from "postcss";
// @ts-ignore
import { validate } from 'csstree-validator';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide a project path.");
    return;
  }
  const unnecessaryLessFiles = await getUnnecessaryLessFiles(args[0]);
  await modifyImport({ dir: args[0], unnecessaryLessFiles });
  unnecessaryLessFiles.map(f => {
    fs.renameSync(f, f.replace(/\.less$/, '.css'));
  });
}

async function getUnnecessaryLessFiles(dir: string): Promise<string[]> {
  const candidates: string[] = [];
  const a = readdirSync(dir, { withFileTypes: true });
  const rootLength = dir.split('/').length - 1;
  for (const file of a) {
    if (file.isDirectory()) {
      await checkLessFilesInDirectory({
        rootLength,
        baseName: dir,
        dir: file,
        candidates
      });
    }
    if (file.isFile()) {
      await checkLessFile({
        rootLength,
        baseName: dir,
        file,
        candidates,
        verbose: true,
      });
    }
  }
  return candidates;
}

interface CheckDirectoryOptions {
  rootLength: number
  baseName: string
  dir: Dirent
  candidates: string[]
}

async function checkLessFilesInDirectory(opts: CheckDirectoryOptions) {
  const { rootLength, baseName, dir, candidates } = opts;
  if (!dir.isDirectory() || dir.name === 'node_modules') {
    return;
  }
  for (const file of readdirSync(resolve(baseName, dir.name), { withFileTypes: true })) {
    if (file.isDirectory()) {
      await checkLessFilesInDirectory({
        rootLength,
        baseName: resolve(baseName, dir.name),
        dir: file,
        candidates
      });
    }
    if (file.isFile()) {
      await checkLessFile({
        rootLength,
        baseName: resolve(baseName, dir.name),
        file,
        candidates
      });
    }
  }
}

interface CheckLessFileOptions {
  rootLength: number
  baseName: string
  file: Dirent
  candidates: string[]
  verbose?: boolean
}

async function checkLessFile(opts: CheckLessFileOptions) {
  const { verbose, baseName, file, candidates } = opts;
  const absPath = resolve(baseName, file.name);
  if (!file.isFile() || !file.name.endsWith(".less")) {
    return
  }
  const data = await readFile(resolve(baseName, file.name));
  try {
    // @ts-ignore
    const res = await postcss([require('postcss-nested')]).process(data, { from: absPath });
    const v = validate(res.css);
    if (v.length > 0) {
      if (verbose) console.info('❌', absPath);
      return;
    }
    candidates.push(resolve(baseName, file.name));
    if (verbose) console.info('✅', absPath);
  } catch (err) {
    console.log(err);
    if (verbose) console.info('❌', absPath);
  }
}

interface ModifyImportOptions {
  dir: string
  unnecessaryLessFiles: string[]
}

async function modifyImport(opts: ModifyImportOptions) {
  const { dir, unnecessaryLessFiles } = opts;
  const a = readdirSync(dir, { withFileTypes: true });
  for (const file of a) {
    if (file.isDirectory()) {
      await modifyImport({
        dir: resolve(dir, file.name),
        unnecessaryLessFiles
      });
    }
    if (file.isFile() && ['.js', '.jsx', '.ts', '.tsx'].some(ext => file.name.endsWith(ext))) {
      const data = (await readFile(resolve(dir, file.name))).toString();
      const res = data.replace(/import(\s+[^\s]+\s+)?(from)?\s+['"](.+?)['"]/g, (match, p1, _p2, p3) => {
        if (unnecessaryLessFiles.includes(resolve(dir, p3))) {
          if (p1) return `import${p1}from '${p3.replace(/\.less$/, '.css')}'`;
          else return `import '${p3.replace(/\.less$/, '.css')}'`;
        }
        return match;
      });
      if (res !== data) writeFileSync(resolve(dir, file.name), res);
    }
  }
}

main();
