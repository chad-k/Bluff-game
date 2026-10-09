import {randomInt} from 'node:crypto';
import {isCorrect,normalized} from './questions.js';
const funnyLines=[
 'It worked perfectly during the rehearsal.','Now available with 40% more unnecessary buttons.','Please allow three to five business years.','I thought this was the practice round.','A subscription nobody remembers signing up for.','The meeting that could have been a nap.','Some assembly, courage, and snacks required.','Professionally unprepared since this morning.','One small step for me. One large invoice for everyone else.','If found, please return to the nearest couch.','It is a feature. The manual says so.','Tomorrow’s problem, available today.','No refunds after the dramatic reveal.','Just a spreadsheet wearing a tiny hat.','The Wi-Fi password is a closely guarded accident.','Powered entirely by misplaced confidence.','It comes with a complimentary awkward silence.','A five-star review written by my mum.','The instructions were more of a suggestion.','Legally, this counts as a plan.'
];
export function makeDecoy(question,mode,existing=[]){
 const used=new Set(existing.map(normalized));
 const valid=s=>!used.has(normalized(s))&&(mode!=='trivia'||!isCorrect(question,s));
 if(mode==='funny'){
  const available=funnyLines.filter(valid);return available.length?available[randomInt(available.length)]:'The backup plan for the backup plan.';
 }
 const pool=question.decoys||['A turning point','An inversion','A reversal','An echo','A reflection','A shadow','A small indentation','A hidden compartment','A loose thread','A spiral'];
 const available=pool.filter(valid);const fallback=pool.filter(s=>!isCorrect(question,s));return available.length?available[randomInt(available.length)]:fallback.length?fallback[randomInt(fallback.length)]:null;
}
export function botVote(options,playerId){const legal=options.filter(o=>!o.owners.includes(playerId));return legal.length?legal[randomInt(legal.length)].id:null;}
