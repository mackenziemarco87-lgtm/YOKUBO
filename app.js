const form = document.querySelector('#chatForm');
const input = document.querySelector('#userInput');
const chatArea = document.querySelector('#chatArea');
const sendButton = form.querySelector('.send-button');
const demoPill = document.querySelector('.demo-pill');

let accessPassword = '';
let isSending = false;
const chatHistory = [
  {
    role: 'assistant',
    content: 'Good morning, Lucía! You have 24 arrivals today and 3 open requests that need attention. How can I help you run a smoother day?'
  }
];

let localDemoMode = sessionStorage.getItem('hospitalityos-local-demo') === 'true';
if (localDemoMode && demoPill) demoPill.innerHTML = '<i></i> LOCAL DEMO';

function createLocalDemoReply(prompt) {
  const question = prompt.toLowerCase();
  let answer;

  if (/vip|elena|room 602/.test(question)) {
    answer = 'Sample briefing: VIP guest Elena Rossi is expected in room 602 at 11:30 AM. You could confirm the room is ready, share the arrival time with the front desk, and prepare any requested welcome items.';
  } else if (/air.?condition|\bac\b|maintenance|room 408|cooling/.test(question)) {
    answer = 'Sample request: room 408 has a high-priority air-conditioning issue. Suggested next step: assign maintenance and update the front desk after the room has been checked.';
  } else if (/towel|room 215|housekeep/.test(question)) {
    answer = 'Sample request: room 215 is waiting for extra towels and has been waiting 18 minutes. Suggested next step: ask housekeeping to confirm an estimated delivery time.';
  } else if (/attention|urgent|open request|requests/.test(question)) {
    answer = 'Sample attention list: room 408 has a high-priority AC issue; room 215 is waiting for extra towels; and room 319 is ready for inspection. These are sample items, not live requests.';
  } else if (/brief|summary|overview|today|occupancy|arrival|departure/.test(question)) {
    answer = 'Sample hotel briefing: occupancy is 87%, with 24 arrivals, 19 departures, and 8 rooms ready. Three sample requests need attention. These figures are demo data, not live hotel information.';
  } else {
    answer = 'I can answer a few questions using the sample hotel data: today’s briefing, requests needing attention, the room 408 AC issue, room 215 towels, or the sample VIP arrival. These details are not live hotel information.';
  }

  return 'LOCAL DEMO — OpenAI is not responding because an API usage limit was reached. This reply uses fixed sample data only; it is not connected to live hotel systems.\n\n' + answer;
}

function addMessage(text, role) {
  const item = document.createElement('div');
  item.className = `message ${role === 'assistant' ? 'assistant-message' : 'user-message'}`;
  const avatar = document.createElement('div');
  avatar.className = role === 'assistant' ? 'message-avatar' : 'message-avatar user-avatar';
  avatar.textContent = role === 'assistant' ? '✳' : 'LM';

  const body = document.createElement('div');
  body.className = 'message-body';
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  const name = document.createElement('b');
  name.textContent = role === 'assistant' ? 'HospitalityOS Assistant' : 'You';
  const time = document.createElement('span');
  time.textContent = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
  meta.append(name, time);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  body.append(meta, bubble);
  item.append(avatar, body);
  chatArea.append(item);
  chatArea.scrollTop = chatArea.scrollHeight;
  return item;
}

function askForPassword() {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'access-dialog';
    dialog.innerHTML = `
      <form class="access-form">
        <h2>Unlock your assistant</h2>
        <p>Enter the private app password you added in Vercel.</p>
        <label for="accessPasswordInput">App password</label>
        <input id="accessPasswordInput" type="password" autocomplete="current-password" required>
        <div class="access-actions">
          <button type="button" class="access-cancel">Cancel</button>
          <button type="submit" class="access-submit">Continue</button>
        </div>
      </form>`;

    const style = document.createElement('style');
    style.textContent = `
      .access-dialog { width:min(420px, calc(100% - 32px)); border:1px solid #e5e7e1; border-radius:12px; padding:22px; color:#303a34; font:14px 'DM Sans',sans-serif; box-shadow:0 18px 55px #1d2b2233; }
      .access-dialog::backdrop { background:#17251f77; }
      .access-form h2 { font:700 18px Manrope,sans-serif; margin:0 0 8px; }
      .access-form p { color:#737d76; margin:0 0 18px; font-size:13px; }
      .access-form label { display:block; font-weight:600; margin-bottom:7px; font-size:12px; }
      .access-form input { width:100%; border:1px solid #dfe4dd; border-radius:7px; padding:11px; font:14px 'DM Sans',sans-serif; }
      .access-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:18px; }
      .access-actions button { border:0; border-radius:7px; padding:10px 14px; font:600 12px 'DM Sans',sans-serif; cursor:pointer; }
      .access-cancel { background:#f1f2ee; color:#566058; }
      .access-submit { background:#315745; color:white; }
    `;
    document.head.append(style);
    document.body.append(dialog);

    const passwordInput = dialog.querySelector('#accessPasswordInput');
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      dialog.close();
      dialog.remove();
      style.remove();
      resolve(value);
    };

    dialog.querySelector('.access-cancel').addEventListener('click', () => finish(''));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish('');
    });
    dialog.querySelector('.access-form').addEventListener('submit', (event) => {
      event.preventDefault();
      finish(passwordInput.value);
    });
    dialog.showModal();
    passwordInput.focus();
  });
}

async function sendMessage(prompt) {
  if (isSending) return;
  if (!localDemoMode && !accessPassword) {
    accessPassword = await askForPassword();
    if (!accessPassword) return;
  }

  isSending = true;
  input.disabled = true;
  sendButton.disabled = true;
  addMessage(prompt, 'user');
  chatHistory.push({ role: 'user', content: prompt });
  if (chatHistory.length > 10) chatHistory.splice(0, chatHistory.length - 10);

  try {
    if (localDemoMode) {
      const reply = createLocalDemoReply(prompt);
      chatHistory.push({ role: 'assistant', content: reply });
      addMessage(reply, 'assistant');
      return;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessPassword}`
      },
      body: JSON.stringify({ messages: chatHistory })
    });
    const result = await response.json().catch(() => ({}));

    if (response.status === 401) {
      accessPassword = '';
      throw new Error('That app password was not accepted. Send another message to try again.');
    }
    if (response.status === 429) {
      localDemoMode = true;
      sessionStorage.setItem('hospitalityos-local-demo', 'true');
      if (demoPill) demoPill.innerHTML = '<i></i> LOCAL DEMO';
      const reply = createLocalDemoReply(prompt);
      chatHistory.push({ role: 'assistant', content: reply });
      addMessage(reply, 'assistant');
      return;
    }
    if (!response.ok) {
      throw new Error(result.error || 'The assistant could not respond. Please try again later.');
    }

    const reply = typeof result.reply === 'string' ? result.reply : '';
    if (!reply) throw new Error('The assistant returned an empty reply. Please try again.');
    chatHistory.push({ role: 'assistant', content: reply });
    addMessage(reply, 'assistant');
  } catch (error) {
    addMessage(error.message || 'Connection problem. Please try again.', 'assistant');
  } finally {
    isSending = false;
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  }
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const prompt = input.value.trim();
  if (!prompt || prompt.length > 1500) return;
  input.value = '';
  input.style.height = 'auto';
  sendMessage(prompt);
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 75)}px`;
});

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.dataset.prompt;
    form.requestSubmit();
  });
});
function openActivityDetails(button) {
  const item = button.closest('.activity-item');
  if (!item) return;

  const title = item.querySelector('.activity-title')?.textContent?.trim() || 'Hotel request';
  const description = item.querySelector('.activity-desc')?.textContent?.trim() || 'No additional sample details.';
  const metadata = item.querySelector('.activity-meta')?.textContent?.replace(/\s+/g, ' ')?.trim() || 'Sample activity';
  const dialog = document.createElement('dialog');
  dialog.className = 'activity-dialog';

  const style = document.createElement('style');
  style.textContent = `
    .activity-dialog { width: min(440px, calc(100% - 32px)); border: 1px solid #e5e7e1; border-radius: 14px; padding: 24px; color: #303a34; font: 14px 'DM Sans', sans-serif; box-shadow: 0 18px 55px #1d2b2233; }
    .activity-dialog::backdrop { background: #17251f77; }
    .activity-dialog .dialog-label { color: #8a7951; font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-bottom: 10px; }
    .activity-dialog h2 { margin: 0 0 8px; font: 700 19px Manrope, sans-serif; }
    .activity-dialog p { color: #6f7972; line-height: 1.6; margin: 8px 0; }
    .activity-dialog .demo-note { margin-top: 18px; padding: 11px 12px; border-radius: 8px; background: #f7f3e8; color: #766843; font-size: 12px; }
    .activity-dialog button { display: block; margin: 20px 0 0 auto; border: 0; border-radius: 7px; padding: 10px 16px; background: #315745; color: white; font: 600 12px 'DM Sans', sans-serif; cursor: pointer; }
  `;
  document.head.append(style);

  const label = document.createElement('div');
  label.className = 'dialog-label';
  label.textContent = 'SAMPLE REQUEST';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const detail = document.createElement('p');
  detail.textContent = description;
  const status = document.createElement('p');
  status.textContent = metadata;
  const note = document.createElement('p');
  note.className = 'demo-note';
  note.textContent = item.dataset.source === 'csv' ? 'CSV preview only: data stays in this browser and no hotel system is changed.' : 'Demo only: this is sample information. No real hotel record will be changed.';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  dialog.append(label, heading, detail, status, note, close);
  document.body.append(dialog);
  dialog.addEventListener('close', () => { dialog.remove(); style.remove(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.showModal();
}

const activityList = document.querySelector('.activity-list');
const activitySubtitle = document.querySelector('.activity-heading p');
const importCsvButton = document.querySelector('#importActivityCsv');
const csvFileInput = document.querySelector('#activityCsvFile');
const templateButton = document.querySelector('#downloadCsvTemplate');
const resetSampleButton = document.querySelector('#resetSampleActivity');
const sampleActivityHtml = activityList.innerHTML;
const sampleActivitySubtitle = activitySubtitle.textContent;

activityList.addEventListener('click', (event) => {
  const button = event.target.closest('.open-button');
  if (button) openActivityDetails(button);
});

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('The CSV has an unfinished quoted value.');
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((values) => values.some((value) => value.trim()));
}

function addTextElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderImportedActivities(rows) {
  if (rows.length < 2) throw new Error('The CSV needs a header row and at least one request.');
  if (rows.length > 101) throw new Error('Import up to 100 requests at a time.');
  const headers = rows[0].map((value) => value.trim().toLowerCase().replace(/[\s-]+/g, '_'));
  const sensitiveHeaders = new Set(['guest_name', 'first_name', 'last_name', 'email', 'guest_email', 'phone', 'guest_phone', 'address', 'passport']);
  if (headers.some((header) => sensitiveHeaders.has(header))) {
    throw new Error('Remove guest names and contact details, then try again.');
  }
  const required = ['title', 'details', 'status', 'priority', 'department'];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error('Missing CSV columns: ' + missing.join(', ') + '. Download the template for the required format.');
  const indexOf = (name) => headers.indexOf(name);
  const read = (values, name) => { const index = indexOf(name); return index < 0 ? '' : (values[index] || '').trim().slice(0, 240); };
  const importedRows = rows.slice(1).filter((values) => values.some((value) => value.trim()));
  const cards = importedRows.map((values, rowNumber) => {
    const title = read(values, 'title');
    const details = read(values, 'details');
    if (!title || !details) throw new Error('Request row ' + (rowNumber + 2) + ' needs both title and details.');
    const status = read(values, 'status') || 'Open';
    const priority = read(values, 'priority') || 'Normal';
    const department = read(values, 'department') || 'General';
    const room = read(values, 'room');
    const isCompleted = /complete|resolved|done/i.test(status);
    const isUpcoming = /upcoming|arrival|scheduled/i.test(status);
    const isHigh = /high|urgent|critical/i.test(priority);
    const iconTone = isCompleted ? 'green' : isUpcoming ? 'blue' : isHigh ? 'red' : 'amber';
    const iconText = isCompleted ? '✓' : isUpcoming ? '♧' : isHigh ? '!' : '◷';
    const priorityTone = isCompleted ? 'done' : isUpcoming ? 'vip' : isHigh ? 'high' : 'medium';
    const article = document.createElement('article');
    article.className = 'activity-item';
    article.dataset.source = 'csv';
    const icon = addTextElement(article, 'div', 'activity-icon ' + iconTone, iconText);
    icon.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div'); copy.className = 'activity-copy';
    addTextElement(copy, 'div', 'activity-title', (room ? 'Room ' + room + ' · ' : '') + title);
    addTextElement(copy, 'div', 'activity-desc', details);
    const metadata = document.createElement('div'); metadata.className = 'activity-meta';
    addTextElement(metadata, 'span', 'priority ' + priorityTone, status.toUpperCase() + ' · ' + priority.toUpperCase());
    addTextElement(metadata, 'span', '', '·');
    addTextElement(metadata, 'span', '', department);
    copy.append(metadata); article.append(copy);
    const openButton = addTextElement(article, 'button', 'open-button', isCompleted ? 'View' : 'Open');
    openButton.type = 'button';
    addTextElement(openButton, 'span', '', '↗');
    return article;
  });
  activityList.replaceChildren(...cards);
  activitySubtitle.textContent = 'Imported CSV preview · Local to this browser; no hotel changes';
  resetSampleButton.hidden = false;
}

importCsvButton.addEventListener('click', () => csvFileInput.click());
templateButton.addEventListener('click', () => {
  const csv = [
    'room,title,details,status,priority,department,time',
    '408,AC not cooling,Guest reported at 9:32 AM,Open,High,Maintenance,09:32',
    '215,Extra towels,Waiting 18 minutes,In progress,Normal,Housekeeping,09:14',
    '319,Ready to inspect,Room inspection needed,Open,Normal,Housekeeping,09:18'
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'yokubo-requests-template.csv'; link.click();
  URL.revokeObjectURL(url);
});
csvFileInput.addEventListener('change', async () => {
  const file = csvFileInput.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('Choose a CSV smaller than 1 MB.');
    renderImportedActivities(parseCsv(await file.text()));
  } catch (error) {
    activitySubtitle.textContent = 'Import not completed: ' + (error.message || 'check the CSV format.');
  } finally {
    csvFileInput.value = '';
  }
});
resetSampleButton.addEventListener('click', () => {
  activityList.innerHTML = sampleActivityHtml;
  activitySubtitle.textContent = sampleActivitySubtitle;
  resetSampleButton.hidden = true;
});
