// Notile and Notile Chart smoke tests. Serve the site root with this repo at /notile/.
const {page,expect,test,noErrors,run}=require('./harness');
run({name:'Notile',fn:async()=>{
  await test('every template renders a note',async()=>{const pg=await page('/notile/');
    const ids=await pg.$$eval('#tabs [data-t]',b=>b.map(x=>x.dataset.t));expect(ids.length>=15,'expected 15+ templates, got '+ids.length);
    for(const id of ids){await pg.click(`[data-t="${id}"]`);await pg.waitForTimeout(150);const out=await pg.inputValue('#out');expect(out.trim().length>10,`empty note for ${id}`)}
    await noErrors(pg)});
  await test('no patient identifier boxes',async()=>{const pg=await page('/notile/');
    expect(!(await pg.locator('#plabel').count()),'patient label box present');const out=(await pg.content());expect(!/Re: \[patient name/.test(out),'letter Re: line present')});
  await test('section ✕ leaves a section out of the note',async()=>{const pg=await page('/notile/');await pg.click('[data-t="exam"]');
    const first=await pg.$eval('section.card h2',h=>h.childNodes[0].textContent.trim().toUpperCase());
    await pg.click('[data-secx="0"]');await pg.waitForTimeout(200);expect(!(await pg.inputValue('#out')).includes(first+'\n'),'section still in note');
    await pg.click('[data-secx="0"]');await pg.waitForTimeout(200);expect((await pg.inputValue('#out')).includes(first),'section not restored');await noErrors(pg)});
  await test('trauma grid records results and caps EPT at 64',async()=>{const pg=await page('/notile/');await pg.click('[data-t="trauma"]');
    await pg.click('[data-tf="tgt"]');await pg.click('#toothGrid [data-tooth="UR1"]');await pg.click('#toothDone');await pg.waitForTimeout(200);
    await pg.selectOption('[data-tgt="UR1"][data-tgk="ec"]','−');await pg.fill('[data-tgt="UR1"][data-tgk="ept"]','75');await pg.waitForTimeout(200);
    const out=await pg.inputValue('#out');expect(/UR1: ethyl chloride negative; EPT 64/.test(out),'unexpected grid note: '+out.slice(out.indexOf('TRAUMA GRID'),out.indexOf('TRAUMA GRID')+120));await noErrors(pg)});
  await test('custom template: build, share link, import',async()=>{const pg=await page('/notile/');
    await pg.click('#utNew');await pg.fill('#utName','Test template');await pg.click('#utSave');await pg.waitForTimeout(300);
    expect((await pg.locator('[data-t^="ut_"]').allTextContents()).includes('Test template'),'template tab missing');
    const link=await pg.evaluate(()=>utLink(UT[0]));const p2=await page(link.replace(/^https?:\/\/[^/]+/,''));
    expect(await p2.isVisible('#utDlg'),'import dialog not shown');expect((await p2.inputValue('#utName'))==='Test template','wrong name');await noErrors(p2);await noErrors(pg)});
  await test('built-in dental chart opens and returns a summary',async()=>{const pg=await page('/notile/');await pg.click('#chopen');await pg.waitForTimeout(1500);
    const fr=pg.frames().find(f=>f!==pg.mainFrame()&&f.url().includes('srcdoc'))||pg.frames()[1];expect(fr,'chart frame missing');
    expect((await fr.locator('[data-t]').count())>100,'chart did not draw');await fr.click('[data-s="o"]');await pg.waitForTimeout(500);await pg.click('#chDone');await pg.waitForTimeout(300);
    expect((await pg.inputValue('#out')).includes('DENTAL CHARTING'),'chart summary not in note');await noErrors(pg)});
  await test('Notile Chart: note, perio tab and PNG save',async()=>{const pg=await page('/notile/chart/');
    const note=await pg.textContent('#note');expect(/Existing restorations/.test(note),'note missing');expect(!/6PPC/.test(note),'6PPC should not be in note');
    await pg.click('#tabPerio');await pg.waitForTimeout(300);expect((await pg.locator('#perioGrid .pin').count())>100,'perio grid missing');await pg.click('#tabChart');
    const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:8000}),pg.click('#savePng')]);expect(/\.png$/.test(dl.suggestedFilename()),'no png');await noErrors(pg)});
}});
