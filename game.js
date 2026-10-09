import {randomUUID,randomInt} from 'node:crypto';
import {pickQuestion,isCorrect,normalized,bankInfo} from './questions.js';
import {validAvatar} from './avatars.js';
import {makeDecoy,botVote} from './bots.js';
const between=g=>['lobby','reveal','finished'].includes(g.phase);
const log=(g,text)=>{g.log=[...g.log.slice(-39),text];};
function player(id,name,avatar='fox',bot=false){return {id,name:String(name).trim().slice(0,24)||'Player',avatar:validAvatar(avatar)?avatar:'fox',bot,score:0,lastPoints:0,correct:0,fooled:0,votesReceived:0};}
export function create(id,name,avatar){return {host:id,players:[player(id,name,avatar)],settings:{mode:'party',rounds:8,seconds:60,pack:'mixed',funnyPack:'mixed'},phase:'lobby',round:0,deadline:null,question:null,mode:null,featuredPlayer:null,friendTurns:{},searchTurns:{},lastFeaturedByMode:{},lastFeatured:null,used:[],answers:{},votes:{},options:[],roundPlayers:[],log:['Table opened. Add friends or practice bots.'],result:null};}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function startRound(g,now,questionOverride){
 g.round++;g.mode=g.settings.mode==='party'?['trivia','funny','friends','search'][(g.round-1)%4]:g.settings.mode==='trio'?['trivia','funny','friends'][(g.round-1)%3]:g.settings.mode==='mixed'?(g.round%2?'trivia':'funny'):g.settings.mode;
 g.featuredPlayer=null;
 if(g.mode==='friends'||g.mode==='search'){
  const humans=g.players.filter(p=>!p.bot);if(!humans.length)throw Error('This mode needs a human player.');
  const turns=g.mode==='search'?g.searchTurns:g.friendTurns;
  const previous=g.lastFeaturedByMode[g.mode];const eligible=humans.length>1?humans.filter(p=>p.id!==previous):humans;
  const least=Math.min(...eligible.map(p=>turns[p.id]||0));let candidates=eligible.filter(p=>(turns[p.id]||0)===least);
  const fresh=candidates.filter(p=>p.id!==g.lastFeatured);if(fresh.length)candidates=fresh;
  const target=candidates[randomInt(candidates.length)];g.featuredPlayer={id:target.id,name:target.name,avatar:target.avatar};turns[target.id]=(turns[target.id]||0)+1;g.lastFeaturedByMode[g.mode]=target.id;g.lastFeatured=target.id;
 }
 g.question=questionOverride||pickQuestion(g.mode,g.settings.pack,g.used,g.featuredPlayer?[g.featuredPlayer]:g.players,g.settings.funnyPack);g.used=g.used.filter(id=>id!==g.question.id);g.used.push(g.question.id);g.answers={};g.votes={};g.options=[];g.result=null;g.roundPlayers=g.players.map(p=>p.id);g.players.forEach(p=>p.lastPoints=0);g.phase='writing';g.deadline=g.settings.seconds?now+g.settings.seconds*1000:null;
 log(g,`Round ${g.round}: ${g.mode==='trivia'?'Find the truth':g.mode==='friends'?'About your friends — '+g.featuredPlayer.name:g.mode==='search'?'Search history — '+g.featuredPlayer.name:'Make them laugh'}.`);
 if(g.question.recycled)log(g,'This selected pack has been used up; questions may repeat.');
 for(const p of g.players.filter(p=>p.bot)){const text=makeDecoy(g.question,g.mode,Object.values(g.answers).map(a=>a.text));g.answers[p.id]={text,correct:false};}
 progress(g,now);
}
function eligibleVoters(g){return g.roundPlayers.filter(id=>!(g.mode==='trivia'&&g.answers[id]?.correct)&&g.options.some(o=>!o.owners.includes(id)));}
function beginVoting(g,now){
 const byText=new Map();
 if(g.mode==='trivia')byText.set(normalized(g.question.answer),{id:randomUUID(),text:g.question.answer,owners:[],truth:true});
 for(const [id,a] of Object.entries(g.answers)){
  if(a.correct)continue;const key=normalized(a.text);let option=byText.get(key);if(option)option.owners.push(id);else byText.set(key,{id:randomUUID(),text:a.text,owners:[id],truth:false});
 }
 if(g.mode==='trivia')while(byText.size<3){const text=makeDecoy(g.question,g.mode,[...byText.values()].map(o=>o.text));const key=normalized(text);if(byText.has(key))break;byText.set(key,{id:randomUUID(),text,owners:[],truth:false});}
 g.options=shuffle([...byText.values()]);g.phase='voting';g.deadline=g.settings.seconds?now+g.settings.seconds*1000:null;log(g,'Answers are locked. Time to vote.');
 const eligible=eligibleVoters(g);for(const p of g.players.filter(p=>p.bot&&eligible.includes(p.id))){const vote=botVote(g.options,p.id);if(vote)g.votes[p.id]=vote;}
 if(!eligible.length||eligible.every(id=>g.votes[id]))reveal(g);
}
function reveal(g){
 const points=Object.fromEntries(g.roundPlayers.map(id=>[id,0]));
 for(const p of g.players){if(g.mode==='trivia'&&g.answers[p.id]?.correct){points[p.id]+=200;p.correct++;}}
 for(const [id,choice] of Object.entries(g.votes)){
  const o=g.options.find(x=>x.id===choice);if(!o)continue;
  const voter=g.players.find(p=>p.id===id);
  if(g.mode==='trivia'&&o.truth){points[id]+=200;if(voter)voter.correct++;}
  else for(const owner of o.owners){points[owner]+=100;const p=g.players.find(p=>p.id===owner);if(p){p.votesReceived++;if(g.mode==='trivia')p.fooled++;}}
 }
 for(const p of g.players){p.lastPoints=points[p.id]||0;p.score+=p.lastPoints;}
 g.result={sourceLabel:g.question.sourceLabel||'Check the source',license:g.question.license||null,source:g.mode==='trivia'?g.question.source:null,answer:g.mode==='trivia'?g.question.answer:null,explanation:g.mode==='trivia'?g.question.explanation:null,options:g.options.map(o=>({...o,authors:o.owners.map(id=>g.players.find(p=>p.id===id)?.name||'Former player'),voters:Object.entries(g.votes).filter(([,v])=>v===o.id).map(([id])=>g.players.find(p=>p.id===id)?.name||'Former player')})),points,alreadyKnew:g.players.filter(p=>g.answers[p.id]?.correct).map(p=>p.name),missedWriting:g.roundPlayers.filter(id=>!g.answers[id]).length,missedVoting:eligibleVoters(g).filter(id=>!g.votes[id]).length};
 g.phase='reveal';g.deadline=null;log(g,`Round ${g.round} revealed. Scores updated.`);
}
export function progress(g,now){
 if(g.phase==='writing'&&(g.roundPlayers.every(id=>g.answers[id])||g.deadline!==null&&now>=g.deadline)){beginVoting(g,now);return true;}
 if(g.phase==='voting'&&(eligibleVoters(g).every(id=>g.votes[id])||g.deadline!==null&&now>=g.deadline)){reveal(g);return true;}
 return false;
}
export function update(g,id,action,data={},now=Date.now()){
 const me=g.players.find(p=>p.id===id);
 if(action==='join'){if(me)return;if(!between(g))throw Error('A round is underway. Join when the results appear.');if(g.players.length>=10)throw Error('This table has ten players already.');g.players.push(player(id,data.name,data.avatar));log(g,`${g.players.at(-1).name} joined.`);return;}
 if(!me)throw Error('Join this table first.');
 if(['bot','remove','settings','start','next','closePhase'].includes(action)&&g.host!==id)throw Error('Only the host can do that.');
 if(action==='avatar'){if(!validAvatar(data.avatar))throw Error('Choose an available avatar.');me.avatar=data.avatar;return;}
 if(action==='settings'){
  if(!between(g))throw Error('Change settings between rounds.');
  const s={...g.settings,...data.settings};if(!['trivia','funny','friends','search','mixed','trio','party'].includes(s.mode)||![5,8,10,15,20].includes(s.rounds)||![0,30,60,90,120].includes(s.seconds)||!['facts','words','community','mixed'].includes(s.pack)||!['mixed','original','remix'].includes(s.funnyPack))throw Error('Invalid table settings.');
  if(g.phase==='reveal'&&s.rounds<g.round)throw Error('Round limit cannot be lower than completed rounds.');g.settings=s;return;
 }
 if(action==='bot'){if(!between(g)||g.players.length>=10)throw Error('Add bots between rounds, up to ten total players.');const names=['Milo','Luna','Rex','Nova','Ace','Pip','Ziggy','Cleo','Otto'];const name=names.find(n=>!g.players.some(p=>p.name===n))||'Bot';const icons=['robot','owl','shark','alien','dragon','panda','penguin','cat','wolf'];g.players.push(player('bot-'+randomUUID(),name,icons[names.indexOf(name)]||'robot',true));return;}
 if(action==='remove'){if(!between(g))throw Error('Remove players between rounds.');if(data.target===g.host)throw Error('The host must stay at the table.');g.players=g.players.filter(p=>p.id!==data.target);return;}
 if(action==='start'){if(!['lobby','finished'].includes(g.phase))throw Error('Finish the current game first.');if(g.players.length<2)throw Error('Add at least one friend or bot.');g.round=0;g.players.forEach(p=>{p.score=0;p.lastPoints=0;p.correct=0;p.fooled=0;p.votesReceived=0;});startRound(g,now);return;}
 if(action==='next'){if(g.phase!=='reveal')throw Error('Wait for the reveal.');if(g.round>=g.settings.rounds){g.phase='finished';log(g,'Game complete.');return;}if(g.players.length<2)throw Error('At least two players are needed.');startRound(g,now);return;}
 if(action==='closePhase'){if(g.phase==='writing'){beginVoting(g,now);return;}if(g.phase==='voting'){reveal(g);return;}throw Error('No active writing or voting phase.');}
 if(action==='answer'){
  if(g.phase!=='writing'||!g.roundPlayers.includes(id))throw Error('Writing has ended.');if(g.answers[id])throw Error('Your answer is already locked.');const text=typeof data.text==='string'?data.text.trim():'';if(!text||text.length>180)throw Error('Use 1–180 characters.');if(!normalized(text))throw Error('Include letters or numbers.');
  g.answers[id]={text,correct:g.mode==='trivia'&&isCorrect(g.question,text)};progress(g,now);return;
 }
 if(action==='vote'){
  if(g.phase!=='voting')throw Error('Voting has ended.');if(g.votes[id])throw Error('Your vote is already locked.');if(!eligibleVoters(g).includes(id))throw Error('You have no vote in this round.');const o=g.options.find(o=>o.id===data.option);if(!o||o.owners.includes(id))throw Error('Choose someone else’s answer.');g.votes[id]=o.id;progress(g,now);return;
 }
 throw Error('Unknown action.');
}
export function view(g,id){
 const me=g.players.find(p=>p.id===id);return {host:g.host,players:g.players,settings:g.settings,phase:g.phase,round:g.round,mode:g.mode,featuredPlayer:g.featuredPlayer,deadline:g.deadline,question:g.question?{id:g.question.id,question:g.question.question,category:g.question.category}:null,
  answerCount:Object.keys(g.answers).length,playerCount:g.roundPlayers.length,voteCount:Object.keys(g.votes).length,voterCount:g.phase==='voting'?eligibleVoters(g).length:0,
  submitted:!!g.answers[id],myAnswer:g.answers[id]?.text||'',knewAnswer:!!g.answers[id]?.correct,voted:!!g.votes[id],myVote:g.votes[id]||null,
  canVote:g.phase==='voting'&&eligibleVoters(g).includes(id)&&!g.votes[id],isMember:!!me,
  options:g.phase==='voting'?g.options.map(o=>({id:o.id,text:o.text,own:o.owners.includes(id)})):[],result:g.phase==='reveal'||g.phase==='finished'?g.result:null,log:g.log,bankInfo};
}
