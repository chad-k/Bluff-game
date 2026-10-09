import {randomInt} from 'node:crypto';
import {isCorrect,normalized} from './questions.js';
const funnyLines=[
 'It worked perfectly during the rehearsal.','Now available with 40% more unnecessary buttons.','Please allow three to five business years.','I thought this was the practice round.','A subscription nobody remembers signing up for.','The meeting that could have been a nap.','Some assembly, courage, and snacks required.','Professionally unprepared since this morning.','One small step for me. One large invoice for everyone else.','If found, please return to the nearest couch.','It is a feature. The manual says so.','Tomorrow’s problem, available today.','No refunds after the dramatic reveal.','Just a spreadsheet wearing a tiny hat.','The Wi-Fi password is a closely guarded accident.','Powered entirely by misplaced confidence.','It comes with a complimentary awkward silence.','A five-star review written by my mum.','The instructions were more of a suggestion.','Legally, this counts as a plan.'
];
const friendLines=[
 'Turning a quick snack into a scheduled event.','A dramatic sigh, followed by a spreadsheet.','Being ready in five minutes for the last forty minutes.','Packing snacks for an imaginary emergency.','An unnecessarily detailed explanation.','A strong opinion about a very small problem.','Calling it a shortcut and getting everyone lost.','A backup plan for the backup snacks.','Treating the group chat like a press conference.','A motivational speech delivered from the sofa.','A surprisingly competitive approach to doing nothing.','Researching it for three hours and choosing the first option.','An elaborate system nobody else understands.','Making a normal errand sound like an expedition.','A second breakfast disguised as a meeting.','Saying “one more thing” seven times.','Taking credit for the good weather.','Buying equipment before choosing a hobby.','Negotiating with an appliance.','Winning an argument that nobody else was having.'
];
const searchLines=[
 'how to look like this was the plan all along','can confidence replace reading the instructions','professional help but for a very small problem','how to undo the last twenty minutes','is there a tutorial with fewer than three steps','how much evidence counts as a coincidence','can I hire someone to be embarrassed for me','polite ways to admit I have no idea','how to make a mistake sound intentional','is it too late to become a different person today','can a snack break solve this','how to look calm while quietly panicking','what would a competent adult do next','how long before this becomes a funny story','can I fix this without getting out of my chair','how to explain this using only positive words','is there a customer support number for Tuesdays','how to turn a minor inconvenience into an achievement','who designed this and can we talk','beginner guide for people who skipped the beginner guide'
];
const searchByTopic={
 'Kitchen chaos':['can soup be toasted','how to order takeaway without doorbell evidence','is burnt a recognised flavour'],
 'Workday mysteries':['professional synonym for I forgot','can a meeting be marked as spam','how to look thoughtful while buffering'],
 'Travel trouble':['can my suitcase count as an emotional support object','hotel shower puzzle walkthrough','how to say lost but confidently'],
 'Domestic experiments':['are spare screws a bonus feature','can clutter be described as an installation','how to apologise to a washing machine'],
 'Digital dilemmas':['where is the undo button for my entire phone','can Wi-Fi detect disappointment','how to politely ask a printer to cooperate'],
 'Social situations':['how long can a polite smile legally last','graceful exits that do not involve a window','can I blame the group chat'],
 'Shopping and hobbies':['does buying supplies count as practice','return policy for optimistic decisions','hobbies where collecting equipment is the final goal'],
 'Games and exercise':['can warming up count as finishing','sports where sitting is a competitive advantage','how to celebrate a moral victory convincingly'],
 'Animals and outdoors':['can a duck be sarcastic','how to look friendly to a suspicious squirrel','do plants accept written apologies'],
 'Ridiculous what-ifs':['dragon breakfast ideas no actual cooking','is a prophecy covered by a return policy','wizard customer support opening hours']
};
export function makeDecoy(question,mode,existing=[]){
 const used=new Set(existing.map(normalized));
 const valid=s=>!used.has(normalized(s))&&(mode!=='trivia'||!isCorrect(question,s));
 if(['funny','friends','search'].includes(mode)){
  const lines=mode==='search'?[...(searchByTopic[question.topic]||[]),...searchLines]:mode==='friends'?friendLines:funnyLines;
  const available=lines.filter(valid);return available.length?available[randomInt(available.length)]:'The backup plan for the backup plan.';
 }
 const pool=question.decoys||['A turning point','An inversion','A reversal','An echo','A reflection','A shadow','A small indentation','A hidden compartment','A loose thread','A spiral'];
 const available=pool.filter(valid);const fallback=pool.filter(s=>!isCorrect(question,s));return available.length?available[randomInt(available.length)]:fallback.length?fallback[randomInt(fallback.length)]:null;
}
export function botVote(options,playerId){const legal=options.filter(o=>!o.owners.includes(playerId));return legal.length?legal[randomInt(legal.length)].id:null;}
