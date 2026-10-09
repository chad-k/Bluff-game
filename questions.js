import {readFileSync} from 'node:fs';
import {randomInt} from 'node:crypto';
import {trivia as starter} from './data/trivia.js';
import {funny} from './data/funny.js';
import {remixes} from './data/remixes.js';
export const community=JSON.parse(readFileSync(new URL('./data/community.json',import.meta.url),'utf8'));
export const trivia=[...starter,...community];
const all=[...trivia,...funny,...remixes];
const validIds=new Set(all.map(q=>q.id));
export const HISTORY_LIMIT=30000;
export function cleanHistory(input){return Array.isArray(input)?[...new Set(input.slice(-HISTORY_LIMIT).filter(id=>typeof id==='string'&&validIds.has(id)))]:[];}
export function mergeHistory(current,incoming){return [...new Set([...cleanHistory(incoming),...current])].slice(-HISTORY_LIMIT);}
export const bankInfo={total:all.length,trivia:trivia.length,words:starter.filter(q=>q.pack==='words').length,facts:starter.filter(q=>q.pack==='facts').length,community:community.length,funny:funny.length,remixes:remixes.length,categories:new Set(community.map(q=>q.category)).size};
const packs={mixed:trivia,community,words:starter.filter(q=>q.pack==='words'),facts:starter.filter(q=>q.pack==='facts')};
const funnyPacks={mixed:[...funny,...remixes],original:funny,remix:remixes};
export function pickQuestion(mode,pack,used,players,funnyPack='mixed'){
 const source=mode==='funny'?funnyPacks[funnyPack]:packs[pack];
 if(!source?.length)throw Error('That question pack is unavailable.');
 const set=new Set(used);let available=source.filter(q=>!set.has(q.id)),recycled=false;
 if(!available.length){
  // Once exhausted, choose among the oldest questions, not a fully random repeat.
  recycled=true;const lastSeen=new Map(used.map((id,i)=>[id,i]));
  available=[...source].sort((a,b)=>lastSeen.get(a.id)-lastSeen.get(b.id)).slice(0,Math.max(1,Math.floor(source.length*.1)));
 }
 if(mode==='funny'){
  // Mix fully written prompts and remixes, and spread recurring scenarios/formats.
  const recent=used.slice(-20),worlds=new Set(),formats=new Set();
  for(const id of recent){const match=/^remix-(\d+)-(\d+)$/.exec(id);if(match){worlds.add(Number(match[1]));if(recent.indexOf(id)>=recent.length-6)formats.add(Number(match[2]));}}
  const diverse=available.filter(q=>q.pack!=='remix'||!worlds.has(q.world)&&!formats.has(q.format));if(diverse.length)available=diverse;
  const types=[...new Set(available.map(q=>q.pack==='remix'?'remix':'original'))];const type=types[randomInt(types.length)];available=available.filter(q=>(q.pack==='remix'?'remix':'original')===type);
 }else{
  // Give smaller subjects a fair turn rather than letting TV/music dominate.
  const categories=[...new Set(available.map(q=>q.category))];const category=categories[randomInt(categories.length)];available=available.filter(q=>q.category===category);
 }
 const q=available[randomInt(available.length)],target=players.length?players[randomInt(players.length)].name:'someone at the table';
 return {...q,recycled,question:q.question.replaceAll('{player}',target)};
}
export function normalized(value){let s=String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const plain=s.replace(/[$,]/g,'').replace(/\s+(degrees|dollars)$/,'');if(/^-?\d+(\.\d+)?$/.test(plain))return 'n:'+Number(plain);return s.replace(/^the\s+/,'').replace(/[^a-z0-9:]/g,'');}
export function isCorrect(q,text){return [q.answer,...(q.aliases||[])].some(a=>normalized(a)===normalized(text));}
