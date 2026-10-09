import test from 'node:test';import assert from 'node:assert/strict';
import {create,update,startRound,progress,view} from '../game.js';
import {normalized,bankInfo,pickQuestion,community,cleanHistory,mergeHistory} from '../questions.js';
const q={id:'test',category:'Test',question:'What colour is the test flag?',answer:'Blue',aliases:['Azure'],explanation:'It is blue.'};
function table(n=3){const g=create('a','Alice','panda');for(let i=1;i<n;i++)update(g,String.fromCharCode(97+i),'join',{name:['Alice','Bob','Cat','Dan'][i]},0);g.settings.mode='trivia';return g;}
function submit(g,id,text){update(g,id,'answer',{text},1);}
function vote(g,id,owner){const o=g.options.find(o=>owner==='truth'?o.truth:o.owners.includes(owner));update(g,id,'vote',{option:o.id},2);}
test('bank counts and answer normalization',()=>{assert.equal(bankInfo.community,community.length);assert.ok(bankInfo.community>20000);assert.equal(bankInfo.total,community.length+44+300+2000);assert.equal(bankInfo.funny,300);assert.equal(bankInfo.remixes,2000);assert.equal(normalized(' $1,200.00 '),normalized('1200'));assert.equal(normalized('Brasília'),normalized('Brasilia'));});
test('correct answer and authors never appear in writing/voting views',()=>{const g=table();startRound(g,0,q);submit(g,'a','Red');const early=view(g,'b');assert.equal(early.question.answer,undefined);assert.equal(early.answers,undefined);assert.equal(early.myAnswer,'');assert.equal(early.result,null);submit(g,'b','Green');submit(g,'c','Purple');assert.equal(g.phase,'voting');const v=view(g,'a');assert.ok(v.options.every(o=>!('truth'in o)&&!('owners'in o)));assert.equal(v.result,null);assert.equal(v.myAnswer,'Red');assert.ok(v.options.find(o=>o.text==='Red').own);});
test('truth earns 200 and each fooled opponent earns bluff author 100',()=>{const g=table();startRound(g,0,q);submit(g,'a','Red');submit(g,'b','Green');submit(g,'c','Purple');vote(g,'a','truth');vote(g,'b','a');vote(g,'c','a');assert.equal(g.phase,'reveal');assert.equal(g.players[0].score,400);assert.equal(g.players[0].fooled,2);assert.equal(g.players[0].correct,1);assert.equal(g.result.answer,'Blue');const before=g.players[0].score;assert.equal(progress(g,90000),false);assert.equal(g.players[0].score,before);});
test('knowing the truth earns one bonus and does not allow a second vote',()=>{const g=table();startRound(g,0,q);submit(g,'a','Azure');submit(g,'b','Red');submit(g,'c','Green');assert.equal(view(g,'a').canVote,false);assert.throws(()=>vote(g,'a','truth'));vote(g,'b','truth');vote(g,'c','b');assert.equal(g.players[0].score,200);assert.equal(g.players[1].score,300);});
test('duplicate bluffs merge and every coauthor gets the eligible vote',()=>{const g=table();startRound(g,0,q);submit(g,'a','RED');submit(g,'b','red!');submit(g,'c','Green');assert.equal(g.options.filter(o=>o.owners.length===2).length,1);assert.throws(()=>vote(g,'a','a'));vote(g,'a','truth');vote(g,'b','truth');vote(g,'c','a');assert.equal(g.players[0].score,300);assert.equal(g.players[1].score,300);});
test('funny mode has no correct answer and scores only audience votes',()=>{const g=table();g.settings.mode='funny';startRound(g,0,{id:'fun',question:'Name a silly hat.',category:'Funny prompts'});submit(g,'a','Pasta helmet');submit(g,'b','Dancing pancake');submit(g,'c','Formal banana');assert.throws(()=>vote(g,'a','a'));vote(g,'a','b');vote(g,'b','a');vote(g,'c','a');assert.equal(g.players[0].score,200);assert.equal(g.players[1].score,100);assert.equal(g.result.answer,null);});
test('timer skips missing answers/votes and uses a fresh voting deadline',()=>{const g=table();startRound(g,0,q);submit(g,'a','Red');assert.equal(progress(g,60000),true);assert.equal(g.phase,'voting');assert.equal(g.deadline,120000);assert.equal(progress(g,119999),false);assert.equal(progress(g,120000),true);assert.equal(g.phase,'reveal');assert.equal(g.result.missedWriting,2);assert.equal(g.result.missedVoting,3);assert.ok(g.players.every(p=>p.score===0));});
test('empty funny round reveals gracefully after deadline',()=>{const g=table();g.settings.mode='funny';startRound(g,0,{id:'f',question:'Hello?',category:'Funny prompts'});progress(g,60000);assert.equal(g.phase,'reveal');assert.equal(g.options.length,0);});
test('settings validate, remain host-only, and mixed mode alternates',()=>{const g=table(2);assert.throws(()=>update(g,'b','settings',{settings:{seconds:30}}));assert.throws(()=>update(g,'a','settings',{settings:{rounds:-1}}));update(g,'a','settings',{settings:{mode:'mixed',seconds:30,rounds:5}},0);update(g,'a','start',{},0);assert.equal(g.mode,'trivia');assert.throws(()=>update(g,'a','settings',{settings:{seconds:60}}));update(g,'a','closePhase',{},1);if(g.phase==='voting')update(g,'a','closePhase',{},2);update(g,'a','next',{},3);assert.equal(g.mode,'funny');});
test('bots fill seats and a complete mixed game finishes',()=>{const g=create('a','Alice');for(let i=0;i<5;i++)update(g,'a','bot',{},0);update(g,'a','settings',{settings:{rounds:5}},0);update(g,'a','start',{},0);for(let i=1;i<=5;i++){assert.equal(g.phase,'writing');submit(g,'a','A really suspicious answer');assert.equal(g.phase,'voting');const o=view(g,'a').options.find(o=>!o.own);update(g,'a','vote',{option:o.id},2);assert.equal(g.phase,'reveal');update(g,'a','next',{},3);}assert.equal(g.phase,'finished');assert.ok(g.players.every(p=>p.score>=0));assert.equal(new Set(g.used).size,g.used.length);});
test('late joins wait until reveal; repeated submissions and votes are rejected',()=>{const g=table();startRound(g,0,q);assert.throws(()=>update(g,'d','join',{name:'Dan'}));submit(g,'a','Red');assert.throws(()=>submit(g,'a','Green'));submit(g,'b','Green');submit(g,'c','Purple');vote(g,'a','truth');assert.throws(()=>vote(g,'a','truth'));vote(g,'b','truth');vote(g,'c','truth');update(g,'d','join',{name:'Dan'});assert.equal(g.players.length,4);});

test('each new pack exhausts before repeating and permits the new settings',()=>{
 for(const [pack,count] of [['words',24],['facts',20]]){
  const g=table();update(g,'a','settings',{settings:{pack}});
  const used=[];
  for(let i=0;i<count;i++){const chosen=pickQuestion('trivia',pack,used,g.players);assert.equal(chosen.recycled,false);assert.ok(!used.includes(chosen.id));if(pack!=='mixed')assert.equal(chosen.pack,pack);used.push(chosen.id);}
  assert.equal(pickQuestion('trivia',pack,used,g.players).recycled,true);
 }
 assert.throws(()=>update(table(),'a','settings',{settings:{pack:'puzzles'}}));
});
test('sources and decoys stay secret until the reveal',()=>{
 const g=table();const chosen=pickQuestion('trivia','words',[],g.players);startRound(g,0,chosen);
 for(const phase of ['writing','voting']){
  assert.equal(g.phase,phase);const v=view(g,'a');assert.equal(v.question.source,undefined);assert.equal(v.question.decoys,undefined);assert.equal(v.result,null);
  update(g,'a','closePhase',{},1);
 }
 assert.equal(view(g,'a').result.source,chosen.source);
});
test('all trivia questions support nine bots at a full table',async()=>{
 const {trivia}=await import('../data/trivia.js');
 for(const question of trivia){
  const g=create('a','Alice');g.settings.mode='trivia';for(let i=0;i<9;i++)update(g,'a','bot',{},0);
  startRound(g,0,question);assert.equal(Object.keys(g.answers).length,9);
  assert.equal(new Set(Object.values(g.answers).map(a=>normalized(a.text))).size,9);
  submit(g,'a','A suspicious invention');assert.equal(g.phase,'voting');
  vote(g,'a','truth');assert.equal(g.phase,'reveal');assert.equal(g.players[0].correct,1);assert.ok(g.players[0].score>=200);
 }
});

 test('large pack samples new questions and history validation ignores unknown IDs',()=>{const used=[];for(let i=0;i<100;i++){const q=pickQuestion('trivia','community',used,[{name:'Alice'}]);assert.equal(q.pack,'community');assert.equal(q.recycled,false);assert.ok(!used.includes(q.id));used.push(q.id);}assert.deepEqual(cleanHistory([used[0],'fake',null,used[0]]),[used[0]]);assert.deepEqual(mergeHistory([used[1]],[used[0],used[1]]),[used[0],used[1]]);});
 test('funny packs are independent and remix scenarios vary',()=>{const players=[{name:'Alice'}],used=[];for(let i=0;i<30;i++){const q=pickQuestion('funny','mixed',used,players,'original');assert.ok(q.id.startsWith('funny-'));assert.ok(!used.includes(q.id));used.push(q.id);}const worlds=[];for(let i=0;i<30;i++){const q=pickQuestion('funny','mixed',used,players,'remix');assert.ok(q.id.startsWith('remix-'));assert.ok(!used.includes(q.id));assert.ok(!worlds.slice(-20).includes(q.world));worlds.push(q.world);used.push(q.id);}});
 test('exhausted packs recycle old questions before recent ones',()=>{const players=[{name:'Alice'}],used=[];for(let i=0;i<20;i++)used.push(pickQuestion('trivia','facts',used,players).id);const q=pickQuestion('trivia','facts',used,players);assert.equal(q.recycled,true);assert.ok(used.slice(0,2).includes(q.id));});
 test('community bots reuse valid decoys gracefully at full capacity',()=>{const g=create('a','Alice');g.settings.mode='trivia';for(let i=0;i<9;i++)update(g,'a','bot',{},0);startRound(g,0,community[0]);assert.ok(Object.values(g.answers).every(a=>typeof a.text==='string'&&community[0].decoys.includes(a.text)));submit(g,'a','Suspicious invention');vote(g,'a','truth');assert.equal(g.phase,'reveal');});
