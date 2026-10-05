import {isAbsolute, join} from 'node:path';

/** Local worktrees may share the original account's ledger and free-tier quota. */
export function privateDirectory(): string {
  const configured = process.env.ISNADLENS_PRIVATE_DIR;
  if (configured && !isAbsolute(configured)) throw new Error('PRIVATE_DIRECTORY_MUST_BE_ABSOLUTE');
  return configured || join(process.cwd(), 'artifacts', 'private');
}
