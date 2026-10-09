import express from 'express';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {create,update,view,progress} from './game.js';
import {bankInfo,cleanHistory,mergeHistory} from './questions.js';
const dist=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
export function createApp({now=Date.now,tickMs=250}={}){
 const app=express(),tables=new Map(),limits=new Map();app.disable('x-powered-by');app.use(express.json({limit:'1mb'}));
 const allow=(id,kind,max)=>{const key=id+':'+kind;let b=limits.get(key);if(!b||now()-b.time>=60000){b={time:now(),count:0};limits.set(key,b);}return ++b.count<=max;};
 function advance(row){const game=structuredClone(row.game);if(progress(game,now())){row.game=game;row.revision++;}}
 function snapshot(row,id){return {game:view(row.game,id),you:id,revision:row.revision,serverNow:now(),messages:row.game.players.some(p=>p.id===id)?row.messages:[]};}
 app.get('/healthz',(_req,res)=>res.json({ok:true,questions:bankInfo.total}));app.get('/api/info',(_req,res)=>res.json(bankInfo));
 app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');const token=req.get('x-player-token')||'';if(!/^[a-f0-9-]{36}$/.test(token))return res.status(400).json({error:'Please reload to reconnect.'});req.player=createHash('sha256').update(token).digest('hex');next();});
 app.get('/api/table',(req,res)=>{try{const row=tables.get(String(req.query.code||'').toUpperCase());if(!row)return res.status(404).json({error:'Table not found. Check the code or open a new table.'});advance(row);row.touched=now();res.json(snapshot(row,req.player));}catch(e){console.error(e);res.status(500).json({error:'Unable to refresh. Please retry.'});}});
 app.post('/api/table',(req,res)=>{try{
  const id=req.player,b=req.body||{};if(!allow(id,'actions',120))return res.status(429).json({error:'Too many requests. Please wait a minute.'});
  const name=String(b.name||'').trim().slice(0,24);
  if(b.action==='create'){
   if(!name)throw Error('Enter your name.');if(tables.size>=500)throw Error('All tables are busy. Please try later.');let code;do{code=randomUUID().slice(0,8).toUpperCase();}while(tables.has(code));const row={game:create(id,name,b.avatar),revision:0,messages:[],touched:now()};row.game.used=cleanHistory(b.history);tables.set(code,row);return res.json({code,...snapshot(row,id)});
  }
  const row=tables.get(String(b.code||'').toUpperCase());if(!row)throw Error('Table not found.');advance(row);
  if(b.action==='chat'){
   const p=row.game.players.find(p=>p.id===id);if(!p)throw Error('Join this table to chat.');const text=typeof b.text==='string'?b.text.trim():'';if(!text||text.length>300)throw Error('Use 1–300 characters.');if(!allow(id,'chat',20))return res.status(429).json({error:'Please slow down: 20 messages per minute.'});row.messages.push({id:randomUUID(),name:p.name,avatar:p.avatar,text,time:now()});row.messages=row.messages.slice(-100);
  }else{
   if(!['join','avatar'].includes(b.action)&&b.round!==row.game.round)return res.status(409).json({error:'The round changed. Refresh your table and try again.'});
   // Writes and votes are concurrent, so another player's submission does not
   // invalidate yours. Round/phase checks and one submission per player protect it.
   if(b.action==='closePhase'&&b.phase!==row.game.phase)return res.status(409).json({error:'That phase has already ended.'});
   const game=structuredClone(row.game);update(game,id,b.action,{...b,name:name||'Player'},now());if(b.action==='join')game.used=mergeHistory(game.used,b.history);row.game=game;
  }
  row.revision++;row.touched=now();res.json(snapshot(row,id));
 }catch(e){res.status(400).json({error:e.message||'Unable to update the table.'});}});
 const sweep=setInterval(()=>{for(const row of tables.values())if(row.game.deadline!==null&&now()>=row.game.deadline){try{advance(row);}catch(e){console.error('Round timer:',e);}}},tickMs);sweep.unref();
 const cleanup=setInterval(()=>{for(const [key,row] of tables)if(now()-row.touched>86400000)tables.delete(key);for(const [key,row] of limits)if(now()-row.time>120000)limits.delete(key);},60000);cleanup.unref();app.locals.dispose=()=>{clearInterval(sweep);clearInterval(cleanup);};
 app.use(express.static(dist));app.use((err,_req,res,_next)=>res.status(400).json({error:'Invalid request.'}));return app;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!existsSync(path.join(dist,'index.html')))throw Error('Frontend missing. Run npm run build before npm start. On Render use: npm ci && npm run build');
 const port=Number(process.env.PORT)||3000;createApp().listen(port,'0.0.0.0',()=>console.log(`Bluff with friends listening on ${port}; ${bankInfo.total} bank entries.`));
}
