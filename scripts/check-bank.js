import assert from 'node:assert/strict';
import {searchPrompts} from '../data/search.js';
import {friends} from '../data/friends.js';
import {funny} from '../data/funny.js';
import {remixes} from '../data/remixes.js';
import {bankInfo,trivia,isCorrect,normalized} from '../questions.js';
import {makeDecoy} from '../bots.js';
const all=[...trivia,...funny,...remixes,...friends,...searchPrompts];
assert.equal(new Set(all.map(q=>q.id)).size,all.length,'duplicate IDs');
assert.equal(new Set(all.map(q=>normalized(q.question))).size,all.length,'duplicate prompts');
assert.equal(bankInfo.total,all.length);
for(const q of all)assert.ok(q.id&&q.question&&q.category);
assert.equal(friends.length,500);assert.equal(searchPrompts.length,500);
for(const q of [...friends,...searchPrompts]){assert.ok(q.question.includes('{player}'));assert.ok(!q.answer);}
for(const q of trivia){
 assert.ok(['facts','words','community'].includes(q.pack));assert.ok(q.answer&&q.explanation);
 assert.equal(new URL(q.source).protocol,'https:');assert.ok(q.decoys.length>=3);
 assert.ok(q.decoys.every(d=>typeof d==='string'&&d.length<=180&&!isCorrect(q,d)),q.id);
 const used=[];
 for(let i=0;i<9;i++){const d=makeDecoy(q,'trivia',used);assert.ok(d&&!isCorrect(q,d),q.id);if(i<new Set(q.decoys.map(normalized)).size)assert.ok(!used.map(normalized).includes(normalized(d)),q.id);used.push(d);}
}
console.log(`Validated ${bankInfo.trivia} trivia questions, ${bankInfo.funny} original funny prompts, ${bankInfo.friends} friends prompts, ${bankInfo.search} search-history prompts, and ${bankInfo.remixes} scenario remixes. IDs/prompts are unique; source links and bot bluffs pass structural checks. This does not independently fact-check community answers.`);
