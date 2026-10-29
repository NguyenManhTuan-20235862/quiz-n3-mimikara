const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const c = {window:{}}; vm.createContext(c);
for (const file of ['vocab_data.js','grammar_data.js','reading_data.js','reading_stage1.js','reading_stage2.js','reading_plan.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const {READING_DATA:lessons,READING_PLAN:plan,GRAMMAR_DATA:grammar,QUIZ_CATEGORIES:categories} = c.window;
const words = categories.flatMap(c=>c.topics.flatMap(t=>t.words));
const authored = lessons.filter(l=>l.stage), warmup = lessons.filter(l=>!l.stage);
assert.equal(warmup.length,10);
for(const stage of [1,2]) assert.equal(authored.filter(l=>l.stage===stage).length,10);
assert.equal(new Set(lessons.map(l=>l.id)).size,30);
const newIds = authored.flatMap(l=>l.newWordIds);
assert.equal(newIds.length,200); assert.equal(new Set(newIds).size,200);
const priorWords = new Set(lessons.filter(l=>!l.stage || l.stage===1).flatMap(l=>l.vocabulary?l.vocabulary.map(r=>r.id):l.words.map(k=>words.find(w=>w.kanji===k).id)));
const priorGrammar = new Set(lessons.filter(l=>!l.stage || l.stage===1).flatMap(l=>l.grammar.map(g=>g.id)));
for(const l of lessons.filter(l=>l.stage===2)) {
  for(const id of l.newWordIds) assert.ok(!priorWords.has(id),`Stage 2 repeats a previously published target: ${id}`);
  assert.ok(!priorGrammar.has(l.focusGrammarId),`Stage 2 repeats published focus grammar: ${l.focusGrammarId}`);
}
const introduced = new Set(warmup.flatMap(l=>l.words.map(k=>words.find(w=>w.kanji===k).id)));
for (const l of authored) {
  assert.equal(l.newWordIds.length,10);
  assert.ok(l.reviewWordIds.length>=5 && l.reviewWordIds.length<=8);
  for(const id of l.reviewWordIds) assert.ok(introduced.has(id),`${l.id}: review before introduction ${id}`);
  l.newWordIds.forEach(id=>introduced.add(id));
  const length=l.text.replace(/\s/g,'').length; assert.ok(length>=300 && length<=500,`${l.id}: length ${length}`);
  assert.ok(!l.text.includes('[[')); assert.ok(l.translation.length>100);
  assert.equal(l.questions.length,3);
  assert.equal(l.vocabulary.length,new Set([...l.newWordIds,...l.reviewWordIds]).size);
  for(const ref of l.vocabulary) {
    assert.ok(words.some(w=>w.id===ref.id));
    for(const form of ref.forms) {assert.ok(l.text.includes(form.text));assert.ok(form.reading);}
  }
  for(const g of l.grammar) {assert.ok(grammar.some(x=>x.id===g.id));assert.ok(l.text.includes(g.quote));}
  assert.ok(l.grammar.some(g=>g.id===l.focusGrammarId));
  for(const q of [...l.questions,l.grammarCheck]) {assert.ok(Number.isInteger(q.answer));assert.ok(q.options[q.answer]);assert.ok(q.explanation);}
}
assert.deepEqual([...plan.flatMap(l=>l.wordIds)].sort((a,b)=>a-b),[...words.map(w=>w.id)].sort((a,b)=>a-b));
assert.deepEqual([...plan.flatMap(l=>l.grammarIds)].sort((a,b)=>a-b),[...grammar.map(g=>g.id)].sort((a,b)=>a-b));
assert.equal(plan.filter(l=>l.ready).length,20);
console.log(`PASS: 10 warmups + 2 stages; 200 distinct introductions; 100 stage 2 words + 10 focus grammar absent from prior content; conjugation links, prior review links, 60 questions, complete 880/62 allocation.`);
