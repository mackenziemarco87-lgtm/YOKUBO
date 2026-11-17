const form = document.querySelector('#chatForm');
const input = document.querySelector('#userInput');
const chatArea = document.querySelector('#chatArea');

const replies = [
  {
    terms: ['briefing', 'today', 'morning', 'overview'],
    answer: 'Here’s your morning briefing: <b>87% occupancy</b> with 24 arrivals and 19 departures. Eight rooms are ready for check-in. Three requests need attention, including an air-conditioning issue in room 408. Elena Rossi arrives at 11:30 AM in room 602.'
  },
  {
    terms: ['attention', 'request', 'issue', 'urgent', 'maintenance'],
    answer: 'Three requests need attention: <b>Room 408</b> has an AC issue (high priority, reported 9:32 AM); <b>room 215</b> is waiting for extra towels (18 minutes); and <b>room 602</b> has a VIP arrival at 11:30 AM. I can help draft a team update for any of these.'
  },
  {
    terms: ['vip', 'elena', 'arrival', 'arrivals'],
    answer: 'For Elena Rossi’s 11:30 AM arrival in room 602: confirm the room is inspected, prepare the welcome amenity, and let the front desk know her room is ready before she arrives. This demo uses sample hotel data, so confirm details with your property system.'
  },
  {
    terms: ['occupancy', 'room', 'rooms', 'check', 'departure'],
    answer: 'Today’s sample operations snapshot shows <b>87% occupancy</b>, 24 arrivals, 19 departures, and 8 rooms ready. There are 12 open requests across housekeeping, guest services, and maintenance.'
  }
];

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
  if (role === 'assistant') bubble.innerHTML = text;
  else bubble.textContent = text;
  body.append(meta, bubble);
  item.append(avatar, body);
  chatArea.append(item);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function respond(prompt) {
  const normalized = prompt.toLowerCase();
  const match = replies.find(({ terms }) => terms.some((term) => normalized.includes(term)));
  const answer = match?.answer ?? 'I can help with the sample occupancy, arrivals, room requests, and VIP arrival checklist shown here. This is a demo using sample data; connect your property systems and an AI provider to answer live operational questions.';
  window.setTimeout(() => addMessage(answer, 'assistant'), 350);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;
  addMessage(prompt, 'user');
  input.value = '';
  input.style.height = 'auto';
  respond(prompt);
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
