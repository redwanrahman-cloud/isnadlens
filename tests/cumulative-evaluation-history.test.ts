import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import history from '../artifacts/cumulative-evaluation-history-2026-10-05.json';
it('counts each primary evaluation once and verifies retained source artifacts',()=>{
 const questions:string[]=[];const files=new Set<string>();
 for(const run of history.runs){expect(files.has(run.artifact)).toBe(false);files.add(run.artifact);const raw=readFileSync(`artifacts/${run.artifact}`);expect(createHash('sha256').update(raw).digest('hex')).toBe(run.sha256);const data=JSON.parse(raw.toString().replace(/^\uFEFF/,''));expect(data.cases.length).toBe(run.questions);for(const row of data.cases)questions.push(row.claim.normalize('NFKC').toLowerCase().trim());}
 expect(questions.length).toBe(history.question_requests_in_major_sets);expect(new Set(questions).size).toBe(history.distinct_normalized_question_texts);expect(history.runs.length).toBe(history.major_evaluation_sets);expect(history.count_is_lower_bound).toBe(true);
});
it('keeps cumulative coverage separate from the latest benchmark denominator',()=>{
 expect(history.distinct_normalized_question_texts).toBeGreaterThan(history.latest_frozen_benchmark.total);expect(history.latest_frozen_benchmark.satisfactory/history.latest_frozen_benchmark.total*100).toBeCloseTo(history.latest_frozen_benchmark.percentage,1);
});
