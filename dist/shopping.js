'use strict';

let shoppingListId = '', shoppingFilter = 'all';
const shoppingData = () => db.settings.shopping || {lists: []};
const shoppingComplete = list => list.items.length > 0 && list.items.every(item => item.done);
const shoppingCurrent = () => shoppingData().lists.find(list => list.id === shoppingListId);

// Commit a copy so a full device storage never leaves an unsaved change in memory.
function shoppingCommit(change) {
  const previous = db.settings.shopping;
  const next = structuredClone(shoppingData());
  change(next);
  db.settings.shopping = next;
  if (save()) return true;
  if (previous === undefined) delete db.settings.shopping;
  else db.settings.shopping = previous;
  return false;
}

function shopping() {
  const list = shoppingCurrent();
  return `<div class="shopping-page">${list ? shoppingDetail(list) : shoppingOverview()}</div>`;
}

function shoppingOverview() {
  const lists = shoppingData().lists;
  const completed = lists.filter(shoppingComplete).length;
  const visible = lists.filter(list => shoppingFilter === 'all' || shoppingComplete(list) === (shoppingFilter === 'done'));
  return `${heading('Lista de compras <span class="shopping-title-icon">🛒</span>', 'Para lembrar de tudo, uma compra de cada vez.', '<button class="primary" id="shoppingnew">＋ Nova lista</button>')}
    <div class="shopping-toolbar"><div class="segmented" role="group" aria-label="Filtrar listas de compras">
      ${[['all', 'Todas', lists.length], ['pending', 'Em andamento', lists.length - completed], ['done', 'Finalizadas', completed]].map(([key, label, count]) => `<button data-shopping-filter="${key}" aria-pressed="${shoppingFilter === key}" class="${shoppingFilter === key ? 'active' : ''}">${label} <span>${count}</span></button>`).join('')}
    </div></div>
    <div class="shopping-grid">${visible.map(list => {
      const done = list.items.filter(item => item.done).length, complete = shoppingComplete(list);
      return `<article class="card shopping-card">
        <div class="shopping-card-top"><span class="shopping-symbol" aria-hidden="true">${icon('shopping')}</span><span class="badge">${complete ? '✓ Finalizada' : 'Em andamento'}</span></div>
        <button class="shopping-open" data-shopping-open="${esc(list.id)}"><h2>${esc(list.name)}</h2><span>${list.items.length ? `${done} de ${list.items.length} itens comprados` : 'Sua lista está pronta para começar'}</span></button>
        <progress class="shopping-progress" value="${done}" max="${list.items.length || 1}" aria-label="Progresso de ${esc(list.name)}"></progress>
        <div class="shopping-preview">${list.items.length ? list.items.slice(0, 3).map(item => `<span class="${item.done ? 'is-done' : ''}"><span aria-hidden="true">${item.done ? '✓' : '□'}</span> ${esc(item.name)}</span>`).join('') : '<span>Adicione os itens que você precisa comprar.</span>'}${list.items.length > 3 ? `<small>+ ${list.items.length - 3} itens</small>` : ''}</div>
        <div class="shopping-card-footer"><button class="ghost" data-shopping-open="${esc(list.id)}" aria-label="Abrir lista ${esc(list.name)}">Abrir lista ${icon('arrow')}</button><div class="shopping-actions">${shoppingAction('list-edit', list.id, 'pencil', 'Editar lista ' + list.name)}${shoppingAction('list-delete', list.id, 'trash', 'Excluir lista ' + list.name)}</div></div>
      </article>`;
    }).join('') || `<section class="shopping-empty"><span aria-hidden="true">🛍️</span><h2>${lists.length ? 'Nenhuma lista por aqui' : 'O que vamos comprar?'}</h2><p>${lists.length ? 'As listas com esse status aparecem aqui.' : 'Crie uma lista para o mercado, a farmácia ou o que precisar. Depois, marque cada item comprado.'}</p><button class="primary" id="shoppingfirst">＋ Criar lista</button></section>`}</div>`;
}

function shoppingAction(action, id, symbol, label) {
  return `<button class="shopping-icon" data-shopping-${action}="${esc(id)}" aria-label="${esc(label)}" title="${esc(label)}">${icon(symbol)}</button>`;
}

function shoppingDetail(list) {
  const done = list.items.filter(item => item.done).length, complete = shoppingComplete(list);
  return `<button class="ghost shopping-back" id="shoppingback">← Todas as listas</button>
    ${heading(esc(list.name), 'Marque os itens conforme colocar no carrinho.', `<div class="shopping-actions">${shoppingAction('list-edit', list.id, 'pencil', 'Editar lista ' + list.name)}${shoppingAction('list-delete', list.id, 'trash', 'Excluir lista ' + list.name)}</div>`)}
    <section class="card shopping-detail" aria-label="Itens da lista">
      <div class="shopping-detail-status"><span class="badge">${complete ? '✓ Lista finalizada' : 'Em andamento'}</span><small>${done} de ${list.items.length} itens comprados</small></div>
      <progress class="shopping-progress" value="${done}" max="${list.items.length || 1}" aria-label="Progresso da lista"></progress>
      ${complete ? '<div class="shopping-celebration" role="status">Tudo comprado! Sua lista está finalizada.</div>' : ''}
      <form id="shoppingadd" class="shopping-add"><label for="shoppingitem">Adicionar item</label><div><input id="shoppingitem" name="name" placeholder="Ex.: feijão, arroz, leite…" maxlength="200" required autocomplete="off"><button class="primary" type="submit" aria-label="Adicionar item">＋ <span>Adicionar</span></button></div><small>Digite um item e pressione Enter para adicionar.</small></form>
      <ul class="shopping-items">${list.items.map(item => `<li class="shopping-item ${item.done ? 'is-done' : ''}"><label class="shopping-check"><input type="checkbox" data-shopping-check="${esc(item.id)}" ${item.done ? 'checked' : ''}><span>${esc(item.name)}</span></label><div class="shopping-actions">${shoppingAction('item-edit', item.id, 'pencil', 'Editar item ' + item.name)}${shoppingAction('item-delete', item.id, 'trash', 'Excluir item ' + item.name)}</div></li>`).join('')}</ul>
      ${!list.items.length ? '<div class="shopping-items-empty">Sua lista ainda está vazia.<br>Adicione o primeiro item acima.</div>' : ''}
    </section>`;
}

function shoppingListForm(id) {
  const list = shoppingData().lists.find(entry => entry.id === id);
  modal(`<h2 id="shoppingdialogtitle">${list ? 'Editar lista' : 'Nova lista de compras'}</h2><form id="shoppinglistform" class="form shopping-form"><label>Nome da lista<input name="name" value="${esc(list?.name || '')}" placeholder="Ex.: Mercado da semana" maxlength="100" required autocomplete="off"></label>${!list ? '<label>Itens (opcional)<textarea name="items" placeholder="Feijão\nArroz\nLeite" maxlength="50000"></textarea><small>Um item por linha. Você também pode adicionar depois.</small></label>' : ''}<p id="shoppingerror" role="alert"></p><div class="modal-actions"><button type="button" id="shoppingcancel">Cancelar</button><button class="primary" type="submit">${list ? 'Salvar alterações' : 'Criar lista'}</button></div></form>`);
  $('#shoppingcancel').onclick = close;
  $('#shoppinglistform').onsubmit = event => {
    event.preventDefault();
    const form = event.target, name = form.elements.name.value.trim();
    const names = list ? [] : form.elements.items.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (!name) { $('#shoppingerror').textContent = 'Digite um nome para a lista.'; return; }
    if (names.some(value => value.length > 200)) { $('#shoppingerror').textContent = 'Cada item pode ter até 200 caracteres.'; return; }
    const listId = list?.id || uid();
    if (!shoppingCommit(data => {
      if (list) data.lists.find(entry => entry.id === id).name = name;
      else data.lists.push({id: listId, name, items: names.map(value => ({id: uid(), name: value, done: false}))});
    })) return;
    shoppingListId = listId;
    close(); render();
    $('#shoppingitem').focus();
    toast(list ? 'Lista atualizada' : 'Lista criada');
  };
  $('#shoppinglistform input').focus();
}

function shoppingItemForm(id) {
  const list = shoppingCurrent(), item = list?.items.find(entry => entry.id === id);
  if (!item) return;
  modal(`<h2>Editar item</h2><form id="shoppingitemform" class="form shopping-form"><label>Nome do item<input name="name" value="${esc(item.name)}" required maxlength="200" autocomplete="off"></label><p id="shoppingerror" role="alert"></p><div class="modal-actions"><button type="button" id="shoppingcancel">Cancelar</button><button type="submit" class="primary">Salvar alterações</button></div></form>`);
  $('#shoppingcancel').onclick = close;
  $('#shoppingitemform').onsubmit = event => {
    event.preventDefault();
    const name = event.target.elements.name.value.trim();
    if (!name) { $('#shoppingerror').textContent = 'Digite um nome para o item.'; return; }
    if (!shoppingCommit(data => { data.lists.find(entry => entry.id === list.id).items.find(entry => entry.id === id).name = name; })) return;
    close(); render(); shoppingFocus('item-edit', id); toast('Item atualizado');
  };
  $('#shoppingitemform input').focus();
}

function shoppingDelete(listId, itemId) {
  const list = shoppingData().lists.find(entry => entry.id === listId);
  const item = list?.items.find(entry => entry.id === itemId);
  if (!list || (itemId && !item)) return;
  modal(`<h2>Excluir ${item ? 'item' : 'lista'}?</h2><p>${item ? `Remover “${esc(item.name)}” desta lista?` : `Excluir “${esc(list.name)}” e seus ${list.items.length} itens?`}</p><div class="modal-actions"><button id="shoppingcancel">Cancelar</button><button id="shoppingconfirmdelete" class="shopping-danger">Excluir ${item ? 'item' : 'lista'}</button></div>`);
  $('#shoppingcancel').onclick = close;
  $('#shoppingcancel').focus();
  $('#shoppingconfirmdelete').onclick = () => {
    const wasComplete = shoppingComplete(list);
    if (!shoppingCommit(data => {
      if (item) { const target = data.lists.find(entry => entry.id === listId); target.items = target.items.filter(entry => entry.id !== itemId); }
      else data.lists = data.lists.filter(entry => entry.id !== listId);
    })) return;
    if (!item) shoppingListId = '';
    close(); render();
    $(item ? '#shoppingitem' : '#shoppingnew').focus();
    toast(item && !wasComplete && shoppingComplete(shoppingCurrent()) ? 'Item excluído. Lista finalizada!' : item ? 'Item excluído' : 'Lista excluída');
  };
}

function shoppingFocus(action, id) {
  [...document.querySelectorAll(`[data-shopping-${action}]`)].find(element => element.getAttribute(`data-shopping-${action}`) === id)?.focus();
}

function bindShopping() {
  if (page !== 'shopping') return;
  const on = (selector, handler) => { const element = $(selector); if (element) element.onclick = handler; };
  on('#shoppingnew', () => shoppingListForm());
  on('#shoppingfirst', () => shoppingListForm());
  on('#shoppingback', () => { shoppingListId = ''; render(); $('#shoppingnew').focus(); });
  const each = (action, handler) => document.querySelectorAll(`[data-shopping-${action}]`).forEach(element => { element.onclick = () => handler(element.getAttribute(`data-shopping-${action}`)); });
  each('filter', filter => { shoppingFilter = filter; render(); shoppingFocus('filter', filter); });
  each('open', id => { shoppingListId = id; render(); $('#shoppingback').focus(); });
  each('list-edit', shoppingListForm);
  each('list-delete', id => shoppingDelete(id));
  each('item-edit', shoppingItemForm);
  each('item-delete', id => shoppingDelete(shoppingListId, id));
  document.querySelectorAll('[data-shopping-check]').forEach(input => {
    input.onchange = () => {
      const list = shoppingCurrent(), wasComplete = shoppingComplete(list), id = input.dataset.shoppingCheck;
      if (!shoppingCommit(data => { data.lists.find(entry => entry.id === list.id).items.find(entry => entry.id === id).done = input.checked; })) { input.checked = !input.checked; return; }
      render(); shoppingFocus('check', id);
      if (shoppingComplete(shoppingCurrent())) toast('Tudo comprado. Lista finalizada!');
      else if (wasComplete) toast('Lista reaberta');
    };
  });
  const add = $('#shoppingadd');
  if (add) add.onsubmit = event => {
    event.preventDefault();
    const input = $('#shoppingitem'), name = input.value.trim();
    if (!name) { input.setCustomValidity('Digite o nome do item.'); input.reportValidity(); return; }
    const list = shoppingCurrent(), wasComplete = shoppingComplete(list);
    if (!shoppingCommit(data => { data.lists.find(entry => entry.id === list.id).items.push({id: uid(), name, done: false}); })) return;
    render(); $('#shoppingitem').focus();
    if (wasComplete) toast('Item adicionado. Lista reaberta');
  };
  if ($('#shoppingitem')) $('#shoppingitem').oninput = event => event.target.setCustomValidity('');
}
