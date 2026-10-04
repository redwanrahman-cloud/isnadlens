import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export async function applicationTreeHash(){
 const paths=['package.json','package-lock.json','next.config.ts'];
 async function visit(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=`${directory}/${entry.name}`;if(entry.isDirectory())await visit(path);else paths.push(path);}}
 await visit('src');paths.sort();
 const rows=await Promise.all(paths.map(async path=>`${path}:${hash(await readFile(path))}`));
 return hash(rows.join('\n'));
}
