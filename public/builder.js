const storageKey = 'yokubo-agent-studio-v1';
const templates = {
  hotel: {
    label: 'Hospitality',
    name: 'Hotel operations assistant',
    instructions: 'You help a hotel operations team organize daily work. Use only the information provided to you. Clearly identify demo or incomplete information. Suggest next steps, but never claim to have changed bookings, contacted staff, or completed a task.'
  },
  support: {
    label: 'Customer support',
    name: 'Support assistant',
    instructions: 'You help customers using the support policy and product information provided to you. Be clear and respectful. If information is missing or the request needs a person, say so and recommend escalation. Never invent policy or claim to have completed an action.'
  },
  research: {
    label: 'Research',
    name: 'Research helper',
    instructions: 'You help organize research questions and summarize only the sources provided to you. Separate facts from assumptions, cite the supplied source names when possible, and point out uncertainty or missing evidence.'
  },
  blank: {
    label: 'Blank agent',
    name: '',
    instructions: ''
  }
};

const agentList = document.querySelector('#agentList');
const agentCount = document.querySelector('#agentCount');
const agentDialog = document.querySelector('#agentDialog');
const agentForm = document.querySelector('#agentForm');
const agentName = document.querySelector('#agentName');
const agentTemplate = document.querySelector('#agentTemplate');
const agentInstructions = document.querySelector('#agentInstructions');
const sampleTask = document.querySelector('#sampleTask');
const previewOutput = document.querySelector('#previewOutput');
const dialogTitle = document.querySelector('#dialogTitle');
let editingId = null;
let agents = loadAgents();

function loadAgents() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value)
      ? value.filter((agent) => agent && typeof agent.id === 'string' && typeof agent.name === 'string' && typeof agent.instructions === 'string')
      : [];
  } catch {
    return [];
  }
}

function persistAgents() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(agents));
    return true;
  } catch {
    previewOutput.textContent = 'This browser could not save the agent. Check available local storage, then try again.';
    return false;
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderAgents() {
  agentList.replaceChildren();
  agentCount.textContent = agents.length + (agents.length === 1 ? ' agent saved on this device' : ' agents saved on this device');
  if (!agents.length) {
    const empty = makeElement('div', 'empty-state');
    empty.append(makeElement('b', '', 'Your workspace is ready.'));
    empty.append(document.createElement('br'));
    empty.append(document.createTextNode(' Create an agent or choose a template below to begin.'));
    agentList.append(empty);
    return;
  }

  agents.forEach((agent) => {
    const card = makeElement('article', 'agent-card');
    const top = makeElement('div', 'agent-card-top');
    top.append(makeElement('div', 'agent-card-icon', '✧'));
    const title = makeElement('div', 'agent-card-title');
    title.append(makeElement('h3', '', agent.name));
    const template = templates[agent.template] || templates.blank;
    title.append(makeElement('div', 'agent-card-type', template.label + ' · Saved locally'));
    top.append(title);
    card.append(top);
    const snippet = agent.instructions.length > 145 ? agent.instructions.slice(0, 142) + '…' : agent.instructions;
    card.append(makeElement('p', '', snippet || 'No instructions added.'));
    const actions = makeElement('div', 'agent-card-actions');
    const editButton = makeElement('button', '', 'Configure');
    editButton.type = 'button';
    editButton.dataset.editId = agent.id;
    actions.append(editButton);
    const deleteButton = makeElement('button', 'delete-agent', 'Delete');
    deleteButton.type = 'button';
    deleteButton.dataset.deleteId = agent.id;
    actions.append(deleteButton);
    card.append(actions);
    agentList.append(card);
  });
}

function applyTemplate(key) {
  const template = templates[key] || templates.blank;
  agentTemplate.value = key in templates ? key : 'blank';
  agentName.value = template.name;
  agentInstructions.value = template.instructions;
  previewOutput.textContent = 'This is a local setup preview. It will not call an AI model.';
}

function openDialog(templateKey, agent) {
  agentForm.reset();
  editingId = agent ? agent.id : null;
  dialogTitle.textContent = agent ? 'Configure agent' : 'Create an agent';
  if (agent) {
    agentTemplate.value = agent.template in templates ? agent.template : 'blank';
    agentName.value = agent.name;
    agentInstructions.value = agent.instructions;
  } else {
    applyTemplate(templateKey || 'blank');
  }
  sampleTask.value = '';
  previewOutput.textContent = 'Your setup preview will appear here. No AI call is made.';
  agentDialog.showModal();
  agentName.focus();
}

document.querySelector('#createAgentButton').addEventListener('click', () => openDialog('blank'));
document.querySelector('#emptyCreateButton').addEventListener('click', () => openDialog('blank'));
document.querySelectorAll('[data-template]').forEach((button) => {
  button.addEventListener('click', () => openDialog(button.dataset.template));
});

agentTemplate.addEventListener('change', () => applyTemplate(agentTemplate.value));

document.querySelector('#closeDialog').addEventListener('click', () => agentDialog.close());
document.querySelector('#cancelDialog').addEventListener('click', () => agentDialog.close());
agentDialog.addEventListener('click', (event) => {
  if (event.target === agentDialog) agentDialog.close();
});

document.querySelector('#previewSetupButton').addEventListener('click', () => {
  const name = agentName.value.trim() || 'Untitled agent';
  const instructions = agentInstructions.value.trim();
  const task = sampleTask.value.trim();
  if (!instructions) {
    previewOutput.textContent = 'Add instructions to preview this setup.';
    return;
  }
  const taskNote = task ? ' Example task: “' + task.slice(0, 180) + '”.' : '';
  previewOutput.textContent = 'Setup preview for ' + name + ': this agent is configured with your instructions (' + instructions.length + ' characters).' + taskNote + ' This preview does not run a model or connect to tools.';
});

agentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = agentName.value.trim();
  const instructions = agentInstructions.value.trim();
  if (!name || !instructions) return;
  const record = {
    id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: name.slice(0, 60),
    template: agentTemplate.value in templates ? agentTemplate.value : 'blank',
    instructions: instructions.slice(0, 1600),
    updatedAt: new Date().toISOString()
  };
  const index = agents.findIndex((agent) => agent.id === record.id);
  if (index >= 0) agents[index] = record;
  else agents.unshift(record);
  if (!persistAgents()) return;
  renderAgents();
  agentDialog.close();
});

agentList.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-id]');
  if (editButton) {
    const agent = agents.find((item) => item.id === editButton.dataset.editId);
    if (agent) openDialog(agent.template, agent);
    return;
  }
  const deleteButton = event.target.closest('[data-delete-id]');
  if (deleteButton) {
    const agent = agents.find((item) => item.id === deleteButton.dataset.deleteId);
    if (!agent || !window.confirm('Delete “' + agent.name + '” from this device?')) return;
    agents = agents.filter((item) => item.id !== agent.id);
    if (persistAgents()) renderAgents();
  }
});

renderAgents();
