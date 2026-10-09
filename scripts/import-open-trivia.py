"""Build the bundled community pack from a local OpenTriviaQA checkout.
Usage: python3 scripts/import-open-trivia.py /path/to/OpenTriviaQA
Source data and this transformed pack: CC BY-SA 4.0. See data/ATTRIBUTION.md.
"""
from pathlib import Path
import sys,json,re,html,hashlib,subprocess,collections,unicodedata
root=Path(sys.argv[1]);commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip();out=Path(__file__).resolve().parents[1]/'data'
def clean(s):return re.sub(r'\s+',' ',html.unescape(s)).strip()
def norm(s):
 s=unicodedata.normalize('NFKD',s).lower().strip();plain=re.sub(r'\s+(degrees|dollars)$','',s.replace('$','').replace(',',''))
 if re.fullmatch(r'-?\d+(\.\d+)?',plain):return 'n:'+str(float(plain))
 return re.sub('[^a-z0-9:]','',re.sub('^the ','',s))
reject=collections.Counter();candidates={};conflicts=set();raw_count=0
# These need visible multiple-choice alternatives, prior quiz context, or changing facts.
blocked=re.compile(r'\b(these|following|listed|below|above|except|odd one|odd .*out|which one|which of|not one|not a|not an|not the|does not|is not|isn.t|doesn.t|NOT|true or false|both|all of|none of|each of|this quiz|previous question|pictured|picture|photograph|image|diagram|shown|according to the passage|fill in|blank|missing word|lyrics|lyric|complete the line|finish the line|finish this|next line|quote|quotation|sang these|sings these|currently|current|now|today|recent|latest|still alive|as of|at present|this year|last year|most recent|present day|president|prime minister|record holder|world record|how old|how many.*(have|has|won)|calculate|multiply|divided|square root|equation|subtract|sum of|product of)\b',re.I)
answer_block=re.compile(r'\b(all of|none of|both|neither|above|below|these|following|not listed|cannot be|can.t be|unknown|not known)\b',re.I)
for f in sorted((root/'categories').iterdir()):
 if f.name in {'brain-teasers','newest','rated','for-kids'}:continue
 for block in re.split(r'(?m)^#Q ',f.read_text(errors='replace'))[1:]:
  raw_count+=1;lines=block.splitlines();q=clean(lines[0]);ans=[clean(x[2:]) for x in lines[1:] if x.startswith('^ ')]
  opts=[clean(x[2:]).replace('Proxima Centuori','Proxima Centauri') for x in lines[1:] if re.match(r'^[A-Z] ',x)]
  if len(ans)!=1 or not 20<=len(q)<=260 or '?' not in q or blocked.search(q) or re.search(r'[_<>]|\b(?:a|b|c|d)\)',q,re.I):reject['unsuitable_prompt']+=1;continue
  a=ans[0].replace('Proxima Centuori','Proxima Centauri')
  if not 2<=len(a)<=90 or norm(a) in {'true','false','yes','no'} or answer_block.search(a):reject['unsuitable_answer']+=1;continue
  if len(opts)<4 or norm(a) not in {norm(x) for x in opts}:reject['malformed_options']+=1;continue
  decoys=list(dict.fromkeys(x for x in opts if norm(x)!=norm(a) and 1<len(x)<=120 and not answer_block.search(x)))
  if len({norm(x) for x in decoys})<3:reject['short_decoy_pool']+=1;continue
  key=norm(q)
  if key in candidates:
   if norm(candidates[key]['answer'])!=norm(a):conflicts.add(key)
   reject['duplicate']+=1;continue
  candidates[key]={'id':'otqa-'+hashlib.sha256(key.encode()).hexdigest()[:16],'pack':'community','category':f.name.replace('-',' ').title(),'question':q,'answer':a,'aliases':[],'decoys':decoys,'source':'https://github.com/uberspot/OpenTriviaQA/blob/'+commit+'/categories/'+f.name,'sourceLabel':'OpenTriviaQA · community answer','license':'CC BY-SA 4.0','explanation':'Answer supplied by the OpenTriviaQA community bank.'}
rows=[v for k,v in candidates.items() if k not in conflicts]
(out/'community.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
manifest={'source':'https://github.com/uberspot/OpenTriviaQA','commit':commit,'license':'CC BY-SA 4.0','inputQuestions':raw_count,'included':len(rows),'excluded':dict(reject),'conflictingPromptsExcluded':len(conflicts),'categories':dict(collections.Counter(q['category'] for q in rows))}
(out/'community-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
