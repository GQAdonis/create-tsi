// SPDX-FileCopyrightText: 2024 Deutsche Telekom AG, LlamaIndex, Vercel, Inc.
//
// SPDX-License-Identifier: MIT

/* eslint-disable import/no-extraneous-dependencies */
import { async as glob } from "fast-glob";
import fs from "fs";
import path from "path";

interface CopyOption {
  cwd?: string;
  rename?: (basename: string) => string;
  parents?: boolean;
}

const identity = (x: string) => x;

export const copy = async (
  src: string | string[],
  dest: string,
  { cwd, rename = identity, parents = true }: CopyOption = {},
) => {
  const source = typeof src === "string" ? [src] : src;

  if (source.length === 0 || !dest) {
    throw new TypeError("`src` and `dest` are required");
  }

  const sourceFiles = await glob(source, {
    cwd,
    dot: true,
    absolute: false,
    stats: false,
  });

  const destRelativeToCwd = cwd ? path.resolve(cwd, dest) : dest;

  return Promise.all(
    sourceFiles.map(async (p) => {
      const dirname = path.dirname(p);
      const basename = rename(path.basename(p));

      const from = cwd ? path.resolve(cwd, p) : p;
      const to = parents
        ? path.join(destRelativeToCwd, dirname, basename)
        : path.join(destRelativeToCwd, basename);

      // Ensure the destination directory exists
      await fs.promises.mkdir(path.dirname(to), { recursive: true });

      return fs.promises.copyFile(from, to);
    }),
  );
};
