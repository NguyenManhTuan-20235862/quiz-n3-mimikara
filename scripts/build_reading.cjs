// node scripts/build_reading.cjs — compile authored links and allocate the full curriculum.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const vocabulary = require('../vocab_data.json').flatMap(c => c.topics.flatMap(t => t.words));
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'grammar_data.js'),'utf8'),context);
const grammar = context.window.GRAMMAR_DATA;
const sources = fs.readdirSync(root).filter(f=>/^reading_stage\d+_source\.json$/.test(f)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
const introduced = new Set();
const lessons = sources.flatMap(file => {
 const stage = Number(file.match(/\d+/)[0]);
 const source = JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
 assert.equal(source.length,stage===9?2:10,`Stage ${stage}: unexpected lesson count`);
 assert.equal(new Set(source.map(l=>l.focusGrammarId)).size,source.length,`Repeated focus within stage ${stage}`);
 return source.map((l, index) => {
  const refs = new Map();
  const text = l.text.replace(/\[\[([^\]]+)\]\]/g, (_, token) => {
    const [lemma, surface = lemma, reading] = token.split('|');
    const matches = vocabulary.filter(w => w.kanji === lemma);
    assert.equal(matches.length,1, `Unknown/ambiguous lemma: ${lemma}`);
    const word = matches[0];
    if (!refs.has(word.id)) refs.set(word.id,{id:word.id, forms:[]});
    const forms = refs.get(word.id).forms;
    if (!forms.some(f => f.text === surface)) forms.push({text:surface,reading:reading || word.hiragana});
    return surface;
  });
  const ids = list => list.map(k => {
    const w = vocabulary.find(w => w.kanji === k);
    assert.ok(w && refs.has(w.id), `Unlinked target ${l.id}: ${k}`);
    return w.id;
  });
  const newWordIds = ids(l.newWords), reviewWordIds = ids(l.reviewWords);
  assert.equal(newWordIds.length,stage===9?7:10);
  for (const id of newWordIds) { assert.ok(!introduced.has(id),`${l.id}: repeated vocabulary introduction ${id}`); introduced.add(id); }
  assert.ok(reviewWordIds.length>=5 && reviewWordIds.length<=8);
  assert.equal(refs.size,newWordIds.length+reviewWordIds.length);
  for (const g of l.grammar) {
    assert.ok(grammar.some(x=>x.id===g.id),`Unknown grammar ${g.id}`);
    assert.ok(text.includes(g.quote),`Missing grammar quote ${l.id}: ${g.quote}`);
  }
  assert.ok(l.grammar.some(g=>g.id===l.focusGrammarId));
  assert.ok(['new','reinforce'].includes(l.focusGrammarRole || 'new'), `Invalid grammar role ${l.id}`);
  assert.equal(l.questions.length,3);
  for (const q of [...l.questions,l.grammarCheck]) {
    assert.ok(Number.isInteger(q.answer) && q.options[q.answer]);
    assert.equal(new Set(q.options).size,q.options.length);
  }
  const {newWords,reviewWords,...fields} = l;
  return {...fields, text, stage, order:index+1, level:'medium',
    words:[...newWords,...reviewWords], newWordIds,reviewWordIds, vocabulary:[...refs.values()]};
 });
});
assert.equal(introduced.size,Math.min(sources.length,8)*100+(sources.length>=9?14:0));
assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
// Each grammar is allocated once; later lessons may explicitly reinforce it.
const allocatedGrammar = new Set();
const planned = lessons.map(l=>{
  const repeated=allocatedGrammar.has(l.focusGrammarId);
  if(repeated) assert.equal(l.focusGrammarRole,'reinforce',`${l.id}: repeated focus must be reinforcement`);
  allocatedGrammar.add(l.focusGrammarId);
  return {id:l.id,stage:l.stage,title:l.title,wordIds:l.newWordIds,grammarIds:repeated?[]:[l.focusGrammarId],ready:true};
});
// Allocate already-published warmup targets before drafting future slots.
vm.runInContext(fs.readFileSync(path.join(root,'reading_data.js'),'utf8'),context);
for(const l of context.window.READING_DATA) {
 const wordIds=l.words.map(k=>vocabulary.find(w=>w.kanji===k).id).filter(id=>!introduced.has(id));
 if(!wordIds.length) continue;
 wordIds.forEach(id=>introduced.add(id));
 const grammarIds=l.grammar.map(g=>g.id).filter(id=>!allocatedGrammar.has(id));
 grammarIds.forEach(id=>allocatedGrammar.add(id));
 planned.push({id:l.id,stage:0,title:l.title,wordIds,grammarIds,ready:true});
}
// Draft slots have allocations only. They are never presented as finished articles.
const remainingGrammar = grammar.filter(g=>!allocatedGrammar.has(g.id)).map(g=>g.id);
for (const c of require('../vocab_data.json')) {
  for (const topic of c.topics) {
    const remaining = topic.words.filter(w=>!introduced.has(w.id));
    for(let start=0;start<remaining.length;start+=12) {
      const number = planned.length;
      planned.push({id:`planned-${number+1}`, stage:Math.floor(number/10)+1,
        title:`${c.name} · ${topic.name}`, wordIds:remaining.slice(start,start+12).map(w=>w.id),
        grammarIds:remainingGrammar.length ? [remainingGrammar.shift()] : [],ready:false});
    }
  }
}
assert.equal(remainingGrammar.length,0,'Need more grammar slots');
const wordIds = planned.flatMap(l=>l.wordIds), grammarIds=planned.flatMap(l=>l.grammarIds);
assert.equal(wordIds.length,880); assert.equal(new Set(wordIds).size,880);
assert.equal(grammarIds.length,62); assert.equal(new Set(grammarIds).size,62);
for (const file of sources) {
  const stage=Number(file.match(/\d+/)[0]);
  fs.writeFileSync(path.join(root,`reading_stage${stage}.js`), `// Generated by scripts/build_reading.cjs. Edit ${file}.\nwindow.READING_DATA.push(...`+JSON.stringify(lessons.filter(l=>l.stage===stage),null,2)+');\n');
}
fs.writeFileSync(path.join(root,'reading_plan.js'), '// Allocations are a plan, not completed content. Generated by scripts/build_reading.cjs.\nwindow.READING_PLAN = '+JSON.stringify(planned,null,2)+';\n');
console.log(`Built ${lessons.length} articles across ${sources.length} stages; ${lessons.flatMap(l=>l.newWordIds).length} unique focus words. Planned ${planned.length} lessons: ${new Set(wordIds).size}/880 words, ${new Set(grammarIds).size}/62 grammar.`);
