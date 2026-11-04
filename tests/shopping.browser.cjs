// Run with Playwright installed: node tests/shopping.browser.cjs
// Set PLAYWRIGHT_CHANNEL=msedge to use an existing Edge installation.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname,'../dist');
const output = process.env.SHOPPING_SCREENSHOTS;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
const server = http.createServer((req,res) => {
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Not found':data);});
});
let browser,checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  // No production data, credentials, or external service requests in these tests.
  await context.route('**/*',route=>route.request().url().startsWith(address)?route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  const screenshot=async name=>{if(output){fs.mkdirSync(output,{recursive:true});await page.locator('#toast').waitFor({state:'hidden'});await page.screenshot({path:path.join(output,name),fullPage:true});}};
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(address);
  await page.getByRole('button',{name:'Compras',exact:true}).click();
  check(await page.getByText('O que vamos comprar?').isVisible(),'empty state');
  await page.locator('#shoppingnew').click();
  await page.locator('#shoppinglistform input').fill('Mercado da semana');
  await page.locator('#shoppinglistform textarea').fill('Feijão\nArroz\nLeite\n\n');
  await page.getByRole('button',{name:'Criar lista',exact:true}).click();
  check(await page.locator('.shopping-item').count()===3,'multiline creation');
  await page.locator('#shoppingitem').fill('Pão');await page.locator('#shoppingitem').press('Enter');
  check(await page.locator('.shopping-item').count()===4,'add with Enter');
  check(await page.locator('#shoppingitem').evaluate(el=>el===document.activeElement),'input retains focus');
  await page.getByRole('checkbox',{name:'Feijão',exact:true}).check();
  check(await page.locator('.shopping-item.is-done').count()===1,'checked row');
  check(await page.getByText('Feijão',{exact:true}).evaluate(el=>getComputedStyle(el).textDecorationLine)==='line-through','strike-through');
  await page.getByRole('button',{name:'Editar item Feijão',exact:true}).click();
  await page.locator('#shoppingitemform input').fill('Feijão preto');
  await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
  check(await page.getByRole('checkbox',{name:'Feijão preto',exact:true}).isChecked(),'editing preserves checked state');
  await page.getByRole('button',{name:'Excluir item Pão',exact:true}).click();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  check(await page.locator('.shopping-item').count()===4,'cancel deletion');
  await page.getByRole('button',{name:'Excluir item Pão',exact:true}).click();
  await page.getByRole('button',{name:'Excluir item',exact:true}).click();
  for(const name of ['Arroz','Leite'])await page.getByRole('checkbox',{name,exact:true}).check();
  check(await page.getByText('✓ Lista finalizada',{exact:true}).isVisible(),'automatic completion');
  await screenshot('compras-finalizada.png');
  await page.getByRole('checkbox',{name:'Arroz',exact:true}).uncheck();
  check(await page.getByText('Em andamento',{exact:true}).isVisible(),'unchecking reopens');
  await page.getByRole('checkbox',{name:'Arroz',exact:true}).check();
  await page.locator('#shoppingitem').fill('Maçã');await page.locator('#shoppingitem').press('Enter');
  check(await page.getByText('Em andamento',{exact:true}).isVisible(),'adding reopens');
  await page.getByRole('button',{name:'Editar lista Mercado da semana',exact:true}).click();
  await page.locator('#shoppinglistform input').fill('Mercado');
  await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
  check(await page.getByRole('heading',{name:'Mercado',exact:true}).isVisible(),'rename list');
  await screenshot('compras-celular.png');
  await page.reload();await page.getByRole('button',{name:'Compras',exact:true}).click();
  await page.getByRole('button',{name:'Abrir lista Mercado',exact:true}).click();
  check(await page.locator('.shopping-item').count()===4,'reload persistence');
  check(await page.locator('.shopping-item.is-done').count()===3,'checks persisted');
  // Persist only real data; page/filter selection does not pollute cloud settings.
  const backup=await page.evaluate(()=>JSON.parse(localStorage.getItem('isabela-v1')));
  check(backup.settings.shopping.lists[0].name==='Mercado','backup contains lists');
  await page.getByRole('button',{name:'Configurações',exact:true}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const stream=await download.createReadStream();let exported='';for await(const chunk of stream)exported+=chunk;
  check(JSON.parse(exported).settings.shopping.lists[0].items.length===4,'export includes shopping');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#restorefile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(exported)});
  await page.getByText('Cópia restaurada',{exact:true}).waitFor();
  check(true,'backup restores through settings');
  await page.getByRole('button',{name:'Compras',exact:true}).click();
  await page.locator('#shoppingback').click();
  await page.locator('[data-shopping-filter="done"]').click();
  check(await page.locator('.shopping-card').count()===0,'completed filter excludes active lists');
  await page.locator('[data-shopping-filter="all"]').click();
  await page.locator('#shoppingnew').click();
  await page.locator('#shoppinglistform input').fill('Farmácia');
  await page.getByRole('button',{name:'Criar lista',exact:true}).click();
  check(await page.getByText('Em andamento',{exact:true}).isVisible(),'empty list is not completed');
  await page.locator('#shoppingitem').fill('<img src=x onerror=alert(1)>');await page.locator('#shoppingitem').press('Enter');
  check(await page.locator('.shopping-items img').count()===0,'item text is escaped');
  await page.getByRole('button',{name:'Excluir lista Farmácia',exact:true}).click();
  await page.getByRole('button',{name:'Excluir lista',exact:true}).click();
  check(await page.locator('.shopping-card').count()===1,'delete entire list');
  // Verify every theme and navigation position at several widths without overflow.
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:844});
    for(const position of ['side','right','top','bottom']){
      await page.evaluate(position=>{db.settings.position=position;db.settings.collapsed=false;render();},position);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`no overflow ${width}/${position}`);
      const nav=await page.locator('[data-nav="shopping"]').boundingBox();
      check(nav&&nav.x>=0&&nav.x+nav.width<=width+1,`shopping navigation visible ${width}/${position}`);
    }
  }
  for(const theme of ['rose','lavender','blue','green','night']){
    await page.evaluate(theme=>{db.settings.theme=theme;db.settings.position='side';render();},theme);
    check(await page.locator('.shopping-card').isVisible(),`theme ${theme}`);
  }
  await screenshot('compras-noturno.png');
  await page.evaluate(()=>{db.settings.theme='rose';render();});
  await screenshot('compras-desktop.png');
  for(const name of ['Dashboard','Calendário','Tarefas','Caixa','Nutrição','Configurações']){
    await page.getByRole('button',{name,exact:true}).click();
    check(await page.locator('main h1').count()===1,`existing page: ${name}`);
  }
  check(errors.length===0,'no JavaScript errors: '+errors.join(', '));
  await context.close();
  // Real service-worker cache: reload the app with all network access disabled.
  const offline=await browser.newContext({viewport:{width:390,height:844}}),offlinePage=await offline.newPage();
  await offline.route('**/*',route=>route.request().url().startsWith(address)?route.continue():route.abort());
  await offlinePage.goto(address);
  await offlinePage.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await offlinePage.reload();
  await offlinePage.getByRole('button',{name:'Compras',exact:true}).click();
  await offlinePage.locator('#shoppingnew').click();
  await offlinePage.locator('#shoppinglistform input').fill('Offline');
  await offlinePage.getByRole('button',{name:'Criar lista',exact:true}).click();
  await offline.setOffline(true);await offlinePage.reload();
  await offlinePage.getByRole('button',{name:'Compras',exact:true}).click();
  await offlinePage.getByRole('button',{name:'Abrir lista Offline',exact:true}).click();
  await offlinePage.locator('#shoppingitem').fill('Arroz');await offlinePage.locator('#shoppingitem').press('Enter');
  await offlinePage.getByRole('checkbox',{name:'Arroz',exact:true}).check();
  check(await offlinePage.getByText('✓ Lista finalizada',{exact:true}).isVisible(),'cached app works offline');
  await offline.close();
  console.log(`${checks} browser checks passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
