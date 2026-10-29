let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require(require('node:path').join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const {chromium} = playwright;
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const root=path.resolve(__dirname,'..');
const server=require('node:http').createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.statusCode=403;res.end();return;}
 try{const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.statusCode=404;res.end('Not found');}
});
(async()=>{
 await new Promise(resolve=>server.listen(5503,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
 const context=await browser.newContext();
 const page=await context.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{
   if(!localStorage.getItem('reading-test-seeded')){
     localStorage.setItem('jlpt_n3_reading',JSON.stringify({current:'s1-office',results:{'first-job':{score:1,at:'2026-10-28T00:00:00Z'}}}));
     localStorage.setItem('reading-test-seeded','true');
   }
 });
 await page.goto('http://127.0.0.1:5503'); await page.waitForLoadState('networkidle');
 await page.locator('#modeBtnReading').click();
 assert.equal(await page.locator('[data-lesson]').count(),10);
 assert.match(await page.locator('#readingProgress').innerText(),/1\/60/);
 assert.equal(await page.locator('#readingStage').inputValue(),'1');
 assert.match(await page.locator('#readingCoverage').innerText(),/0\/880/);
 await page.locator('#readingStage').selectOption('all');
 assert.equal(await page.locator('[data-lesson]').count(),60);
 const data=await page.evaluate(()=>window.READING_DATA);
 for(const l of data){
   await page.locator(`[data-lesson="${l.id}"]`).click();
   assert.equal(await page.locator('.reading-prose p').count(),l.text.split('\n').length);
   await page.locator('#readingCheck').click();
   assert.match(await page.locator('#readingResult').innerText(),/tất cả/);
   for(let i=0;i<l.questions.length;i++)await page.locator(`input[name="reading-q-${i}"][value="${l.questions[i].answer}"]`).check();
   await page.locator('#readingCheck').click();
   assert.ok((await page.locator('#readingResult').innerText()).includes(`${l.questions.length}/${l.questions.length}`));
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('jlpt_n3_mastered')),null,'Reading completion must not mark words mastered');
 await page.locator('#readingStage').selectOption('all');
 const authored=data.filter(l=>l.stage);
 for(const [lessonIndex,l] of authored.entries()){
   await page.locator(`[data-lesson="${l.id}"]`).click();
   await page.locator('#readingRecall > summary').click();
   await page.locator('#readingRecallCheck').click();
   assert.match(await page.locator('#readingRecallResult').innerText(),/tất cả/);
   const questions=page.locator('.reading-recall-question');
   assert.equal(await questions.count(),11);
   for(let i=0;i<l.newWordIds.length;i++){
     const meaning=await page.evaluate(id=>window.QUIZ_CATEGORIES.flatMap(c=>c.topics.flatMap(t=>t.words)).find(w=>w.id===id).nghia,l.newWordIds[i]);
     const labels=await questions.nth(i).locator('label').allTextContents();
     const index=labels.findIndex(t=>t.trim()===meaning);assert.ok(index>=0);
     await questions.nth(i).locator('input').nth(lessonIndex===0&&i===0?(index+1)%3:index).check();
   }
   await questions.last().locator('input').nth(lessonIndex===0?(l.grammarCheck.answer+1)%3:l.grammarCheck.answer).check();
   await page.locator('#readingRecallCheck').click();
   assert.equal(await page.locator('#readingRecallCheck').isDisabled(),true);
   if(lessonIndex===0){
     const mistakes=await page.evaluate(()=>JSON.parse(localStorage.getItem('jlpt_n3_mistakes')));
     assert.ok(mistakes[l.newWordIds[0]]);
     const gm=await page.evaluate(()=>JSON.parse(localStorage.getItem('jlpt_n3_g_mistakes')));assert.ok(gm.includes(l.focusGrammarId));
     await page.locator('#readingRecallRetry').click();
     for(let i=0;i<l.newWordIds.length;i++){
       const meaning=await page.evaluate(id=>window.QUIZ_CATEGORIES.flatMap(c=>c.topics.flatMap(t=>t.words)).find(w=>w.id===id).nghia,l.newWordIds[i]);
       const labels=await questions.nth(i).locator('label').allTextContents();
       await questions.nth(i).locator('input').nth(labels.findIndex(t=>t.trim()===meaning)).check();
     }
     await questions.last().locator('input').nth(l.grammarCheck.answer).check();await page.locator('#readingRecallCheck').click();
     assert.ok(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('jlpt_n3_mistakes'))))[l.newWordIds[0]]);
   }
 }
 assert.match(await page.locator('#readingCoverage').innerText(),/500\/880/);
 assert.match(await page.locator('#readingCoverage').innerText(),/50\/62/);
 await page.locator('#readingStage').selectOption('2');
 assert.equal(await page.locator('[data-lesson]').count(),10);
 await page.locator('[data-lesson="s2-class"]').click();
 assert.match(await page.locator('#readingArticle h2').innerText(),/眠い朝/);
 await page.locator('#readingStage').selectOption('3');
 assert.equal(await page.locator('[data-lesson]').count(),10);
 await page.locator('[data-lesson="s3-guide"]').click();
 assert.match(await page.locator('#readingArticle h2').innerText(),/言葉を訳す/);
 await page.locator('#readingStage').selectOption('4');
 assert.equal(await page.locator('[data-lesson]').count(),10);
 await page.locator('[data-lesson="s4-reception"]').click();
 await page.locator('#readingNext').click();
 assert.match(await page.locator('#readingArticle h2').innerText(),/資料をお持ち/);
 await page.locator('[data-lesson="s4-morning"]').click();
 await page.getByRole('button',{name:'Tra từ 起こされて',exact:true}).click();
 assert.match(await page.locator('#readingLookup').innerText(),/起こす/);
 await page.locator('[data-lesson="s4-costume"]').click();
 await page.getByRole('button',{name:'Tra từ 硬かった',exact:true}).click();
 assert.match(await page.locator('#readingLookup').innerText(),/固い・硬い/);
 await page.locator('#readingStage').selectOption('5');
 assert.equal(await page.locator('[data-lesson]').count(),10);
 assert.match(await page.locator('#readingCoverage').textContent(),/5 mới, 5 củng cố/);
 assert.match(await page.locator('#readingCoverage').innerText(),/62\/62/);
 await page.locator('[data-lesson="s5-reunion"]').click();
 const newGrammar=page.locator('#readingArticle > .reading-detail').nth(1);
 await newGrammar.locator('summary').first().click();
 assert.equal(await newGrammar.getByText('Trọng tâm mới',{exact:true}).isVisible(),true);
 await page.locator('#readingNext').click();
 assert.match(await page.locator('#readingArticle h2').innerText(),/舞台の命令/);
 await page.locator('[data-lesson="s5-directions"]').click();
 const reviewGrammar=page.locator('#readingArticle > .reading-detail').nth(1);
 await reviewGrammar.locator('summary').first().click();
 assert.equal(await reviewGrammar.getByText('Trọng tâm củng cố',{exact:true}).isVisible(),true);
 await page.locator('[data-lesson="s5-craft"]').click();
 await page.getByRole('button',{name:'Tra từ 飽き',exact:true}).click();
 assert.match(await page.locator('#readingLookup').innerText(),/飽きる/);
 await page.locator('[data-review-word]').click();
 assert.equal(await page.locator('[data-review-word]').isDisabled(),true);
 await page.locator('#readingFilter').selectOption('review');assert.ok(await page.locator('[data-lesson]').count()>0);
 await page.locator('#readingFilter').selectOption('short');assert.equal(await page.locator('[data-lesson]').count(),0);
 assert.match(await page.locator('#readingArticle').innerText(),/Chưa có bài/);
 await page.locator('#readingFilter').selectOption('all');
 await page.locator('#readingRuby').click();assert.ok(await page.locator('.reading-prose rt:visible').count()>0);
 const gd=page.locator('#readingArticle > .reading-detail').nth(1);await gd.locator('summary').first().click();
 await page.locator('[data-grammar]').first().click();assert.match(await page.locator('[data-grammar]').first().innerText(),/Đã đánh dấu/);
 await page.reload();await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('#readingAppSection').isVisible(),true);
 assert.equal(await page.locator('#readingStage').inputValue(),'5');
 assert.match(await page.locator('#readingProgress').innerText(),/60\/60/);
 assert.match(await page.locator('#readingCoverage').innerText(),/500\/880/);
 await page.locator('#modeBtnVocab').click();assert.equal(await page.locator('#vocabAppSection').isVisible(),true);
 await page.locator('#modeBtnGrammar').click();assert.equal(await page.locator('#grammarAppSection').isVisible(),true);
 await page.locator('#modeBtnReading').click();
 await page.locator('#themeToggleBtn').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.locator('#themeToggleBtn').click();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'tests/reading-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'tests/reading-desktop.png',fullPage:true});
 const fresh=await browser.newContext(); const freshPage=await fresh.newPage();
 await freshPage.goto('http://127.0.0.1:5503'); await freshPage.locator('#modeBtnReading').click();
 assert.equal(await freshPage.locator('#readingStage').inputValue(),'5');
 assert.equal(await freshPage.locator('[data-lesson]').count(),10);
 assert.ok((await freshPage.locator('.reading-lesson.selected').getAttribute('data-lesson')).startsWith('s5-'));
 await fresh.close();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await context.setOffline(true);await page.reload();await page.locator('#readingArticle h2').waitFor();
 assert.equal(await page.locator('[data-lesson]').count(),10);
 assert.match(await page.locator('#readingCoverage').innerText(),/500\/880/);
 assert.deepEqual(errors,[]);
 console.log('PASS: 60 articles / 170 reading questions; 500 word + 50 grammar checks; full 62 grammar publication; new/reinforced grammar labels; old-stage migration, latest resume, derived-word lookup, filters, persisted coverage, mobile, dark mode, offline.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
