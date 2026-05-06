(function () {
  'use strict';

  /* ─── Configuration ─── */
  var API_URL      = '/chat';
  var CALENDLY_URL = 'https://calendly.com/Edabos/30min';

  /* ─── Shadow DOM container ─── */
  var host = document.createElement('div');
  host.id = 'edabos-widget-host';
  host.style.cssText = 'all:unset;position:fixed;bottom:0;right:0;z-index:2147483647;';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });

  /* ─── Styles (scoped inside shadow DOM — zero global impact) ─── */
  var style = document.createElement('style');
  style.textContent = [
    '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',

    ':host { all: initial; }',

    ':root {}',

    /* Variables */
    '.root {',
    '  --primary: #ACACF1;',
    '  --text:    #111111;',
    '  --white:   #ffffff;',
    '  --radius:  16px;',
    '  --shadow:  0 8px 32px rgba(0,0,0,.18);',
    '  font-family: system-ui, -apple-system, sans-serif;',
    '}',

    /* Toggle button */
    '#toggle {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  right: 24px;',
    '  width: 60px;',
    '  height: 60px;',
    '  border-radius: 50%;',
    '  background: var(--primary);',
    '  color: var(--white);',
    '  font-size: 22px;',
    '  font-weight: 700;',
    '  font-family: system-ui, sans-serif;',
    '  border: none;',
    '  cursor: pointer;',
    '  box-shadow: var(--shadow);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  transition: transform .2s ease, box-shadow .2s ease;',
    '}',
    '#toggle:hover { transform: scale(1.08); box-shadow: 0 12px 36px rgba(0,0,0,.22); }',

    /* Widget panel */
    '#widget {',
    '  position: fixed;',
    '  bottom: 96px;',
    '  right: 24px;',
    '  width: 360px;',
    '  height: 540px;',
    '  border-radius: var(--radius);',
    '  background: var(--white);',
    '  box-shadow: var(--shadow);',
    '  display: flex;',
    '  flex-direction: column;',
    '  overflow: hidden;',
    '  color: var(--text);',
    '  opacity: 0;',
    '  pointer-events: none;',
    '  transform: translateY(12px) scale(.97);',
    '  transition: opacity .25s ease, transform .25s ease;',
    '}',
    '#widget.open {',
    '  opacity: 1;',
    '  pointer-events: all;',
    '  transform: translateY(0) scale(1);',
    '}',

    /* Header */
    '#header {',
    '  background: var(--primary);',
    '  color: var(--white);',
    '  padding: 14px 18px;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  flex-shrink: 0;',
    '}',
    '#avatar {',
    '  width: 36px; height: 36px;',
    '  border-radius: 50%;',
    '  background: rgba(255,255,255,.25);',
    '  display: flex; align-items: center; justify-content: center;',
    '  font-weight: 700; font-size: 16px; flex-shrink: 0;',
    '}',
    '#header-info { flex: 1; }',
    '#header-name  { font-weight: 600; font-size: 15px; }',
    '#header-status { font-size: 12px; opacity: .82; margin-top: 1px; }',
    '#close-btn {',
    '  background: none; border: none; color: var(--white);',
    '  cursor: pointer; font-size: 20px; line-height: 1;',
    '  opacity: .8; padding: 4px; transition: opacity .15s;',
    '}',
    '#close-btn:hover { opacity: 1; }',

    /* Messages */
    '#messages {',
    '  flex: 1;',
    '  overflow-y: auto;',
    '  padding: 16px 14px 8px;',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 10px;',
    '  scroll-behavior: smooth;',
    '}',
    '#messages::-webkit-scrollbar { width: 4px; }',
    '#messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }',

    '.msg-row { display: flex; flex-direction: column; max-width: 82%; }',
    '.msg-row.bot  { align-self: flex-start; align-items: flex-start; }',
    '.msg-row.user { align-self: flex-end;   align-items: flex-end; }',

    '.bubble {',
    '  padding: 10px 14px;',
    '  border-radius: 14px;',
    '  font-size: 14px;',
    '  line-height: 1.5;',
    '  word-break: break-word;',
    '}',
    '.bubble a { color: inherit; text-decoration: underline; }',
    '.msg-row.bot .bubble {',
    '  background: var(--white);',
    '  border: 1px solid #e4e4f0;',
    '  border-radius: 4px 14px 14px 14px;',
    '  color: var(--text);',
    '}',
    '.msg-row.user .bubble {',
    '  background: var(--primary);',
    '  color: var(--white);',
    '  border-radius: 14px 4px 14px 14px;',
    '}',

    '.timestamp { font-size: 10px; color: #aaa; margin-top: 3px; padding: 0 2px; }',

    /* Typing indicator */
    '.typing-bubble { display: flex; align-items: center; gap: 5px; padding: 12px 14px; }',
    '.dot { width: 7px; height: 7px; border-radius: 50%; background: #b0b0c8; animation: bounce .9s infinite ease-in-out; }',
    '.dot:nth-child(2) { animation-delay: .15s; }',
    '.dot:nth-child(3) { animation-delay: .3s; }',
    '@keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }',

    /* Quick replies */
    '#quick { padding: 0 14px 8px; display: flex; flex-wrap: wrap; gap: 7px; }',
    '.qr-btn {',
    '  background: var(--white);',
    '  border: 1.5px solid var(--primary);',
    '  color: var(--primary);',
    '  border-radius: 20px;',
    '  padding: 6px 13px;',
    '  font-size: 13px;',
    '  cursor: pointer;',
    '  font-family: inherit;',
    '  transition: background .15s, color .15s;',
    '  white-space: nowrap;',
    '}',
    '.qr-btn:hover { background: var(--primary); color: var(--white); }',

    /* Input zone */
    '#input-zone {',
    '  padding: 10px 14px 6px;',
    '  border-top: 1px solid #ececf4;',
    '  display: flex;',
    '  gap: 8px;',
    '  align-items: flex-end;',
    '  flex-shrink: 0;',
    '}',
    '#input {',
    '  flex: 1;',
    '  border: 1.5px solid #e0e0ef;',
    '  border-radius: 22px;',
    '  padding: 9px 14px;',
    '  font-size: 14px;',
    '  font-family: inherit;',
    '  resize: none;',
    '  outline: none;',
    '  line-height: 1.4;',
    '  max-height: 100px;',
    '  overflow-y: auto;',
    '  color: var(--text);',
    '  transition: border-color .15s;',
    '  background: var(--white);',
    '}',
    '#input:focus { border-color: var(--primary); }',
    '#input::placeholder { color: #bbb; }',
    '#send-btn {',
    '  width: 38px; height: 38px;',
    '  border-radius: 50%;',
    '  background: var(--primary);',
    '  border: none; cursor: pointer;',
    '  display: flex; align-items: center; justify-content: center;',
    '  flex-shrink: 0;',
    '  transition: background .15s, transform .15s;',
    '}',
    '#send-btn:hover { background: #9898e0; transform: scale(1.06); }',
    '#send-btn svg { width: 18px; height: 18px; fill: var(--white); }',
    '#send-btn:disabled { background: #d0d0e8; cursor: not-allowed; transform: none; }',

    /* Footer */
    '#footer {',
    '  text-align: center;',
    '  font-size: 11px;',
    '  color: #bbb;',
    '  padding: 5px 0 9px;',
    '  flex-shrink: 0;',
    '  letter-spacing: .02em;',
    '}',

    /* Mobile */
    '@media (max-width: 420px) {',
    '  #widget {',
    '    width: calc(100vw - 16px);',
    '    right: 8px; bottom: 84px;',
    '    height: calc(100dvh - 100px);',
    '    max-height: 600px;',
    '  }',
    '  #toggle { right: 16px; bottom: 16px; }',
    '}',
  ].join('\n');

  /* ─── HTML template ─── */
  var wrapper = document.createElement('div');
  wrapper.className = 'root';
  wrapper.innerHTML = [
    /* Toggle button */
    '<button id="toggle" aria-label="Ouvrir le chat Edabos" aria-expanded="false"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:26px;height:26px;fill:white;"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></button>',

    /* Widget panel */
    '<div id="widget" role="dialog" aria-label="Chat Edabos">',

    '  <div id="header">',
    '    <div id="avatar">E</div>',
    '    <div id="header-info">',
    '      <div id="header-name">Edabos</div>',
    '      <div id="header-status">Assistant IA · En ligne</div>',
    '    </div>',
    '    <button id="close-btn" aria-label="Fermer">&#x2715;</button>',
    '  </div>',

    '  <div id="messages"></div>',
    '  <div id="quick"></div>',

    '  <div id="input-zone">',
    '    <textarea id="input" rows="1" placeholder="Écris ton message…" aria-label="Message"></textarea>',
    '    <button id="send-btn" aria-label="Envoyer">',
    '      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
    '        <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>',
    '      </svg>',
    '    </button>',
    '  </div>',

    '  <div id="footer">Propulsé par HARIA</div>',
    '</div>',
  ].join('');

  shadow.appendChild(style);
  shadow.appendChild(wrapper);

  /* ─── DOM refs (inside shadow) ─── */
  var $ = function(id) { return shadow.getElementById(id); };
  var toggleBtn = $('toggle');
  var widgetEl  = $('widget');
  var closeBtn  = $('close-btn');
  var messagesEl = $('messages');
  var quickEl   = $('quick');
  var inputEl   = $('input');
  var sendBtn   = $('send-btn');

  /* ─── State ─── */
  var history = [];
  var isOpen = false;
  var isTyping = false;
  var opened = false;
  var awaitingCallConfirm = false;

  /* ─── Helpers ─── */
  function now() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function markdownToHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function addMessage(role, text) {
    var row = document.createElement('div');
    row.className = 'msg-row ' + role;

    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = markdownToHtml(text);

    var ts = document.createElement('div');
    ts.className = 'timestamp';
    ts.textContent = now();

    row.appendChild(bubble);
    row.appendChild(ts);
    messagesEl.appendChild(row);
    scrollBottom();
    return row;
  }

  function showTyping() {
    var row = document.createElement('div');
    row.className = 'msg-row bot';
    row.id = 'typing-indicator';

    var bubble = document.createElement('div');
    bubble.className = 'bubble typing-bubble';
    bubble.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }

  function hideTyping() {
    var el = shadow.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function setQuickReplies(buttons) {
    quickEl.innerHTML = '';
    buttons.forEach(function(label) {
      var btn = document.createElement('button');
      btn.className = 'qr-btn';
      btn.textContent = label;
      btn.addEventListener('click', function() {
        if (isTyping) return;
        quickEl.innerHTML = '';
        sendMessage(label);
      });
      quickEl.appendChild(btn);
    });
  }

  /* ─── Quick reply detection ─── */
  function detectQuickReplies(botText) {
    if (awaitingCallConfirm) {
      return ['Je suis partant', "Pas pour l'instant"];
    }
    var lower = botText.toLowerCase();
    var blocageKw = ['bloqué', 'blocage', 'bloquer', 'problème', 'difficulté', 'frein'];
    var expKw = ['expérience', 'déjà essayé', 'boutique active', 'débutant', 'niveau'];

    if (blocageKw.some(function(k) { return lower.indexOf(k) !== -1; })) {
      return ['Le produit', 'La boutique', "La peur d'échouer", 'Autre'];
    }
    if (expKw.some(function(k) { return lower.indexOf(k) !== -1; })) {
      return ['Débutant complet', "J'ai déjà essayé", "J'ai une boutique active"];
    }
    return [];
  }

  /* ─── API call ─── */
  function callAPI(userText) {
    isTyping = true;
    sendBtn.disabled = true;

    history.push({ role: 'user', content: userText });
    showTyping();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice() })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('API ' + res.status);
      return res.json();
    })
    .then(function(data) {
      var botText = data.text;

      hideTyping();
      addMessage('bot', botText);
      history.push({ role: 'assistant', content: botText });

      var lower = botText.toLowerCase();
      var isCallProposal = (
        lower.indexOf('vive voix')     !== -1 ||
        lower.indexOf('échange rapide') !== -1 ||
        lower.indexOf('moment pour en parler') !== -1 ||
        (lower.indexOf('prendre un') !== -1 && lower.indexOf('appel') !== -1)
      );

      if (isCallProposal) {
        awaitingCallConfirm = true;
        setQuickReplies(['Je suis partant', "Pas pour l'instant"]);
      } else {
        setQuickReplies(detectQuickReplies(botText));
      }
    })
    .catch(function() {
      hideTyping();
      addMessage('bot', 'Une erreur est survenue. Tu peux prendre rendez-vous directement ici : [' + CALENDLY_URL + '](' + CALENDLY_URL + ')');
    })
    .finally(function() {
      isTyping = false;
      sendBtn.disabled = false;
    });
  }

  /* ─── Send message ─── */
  function sendMessage(text) {
    text = text.trim();
    if (!text || isTyping) return;

    addMessage('user', text);
    quickEl.innerHTML = '';

    if (awaitingCallConfirm) {
      awaitingCallConfirm = false;
      var reply;
      if (text === 'Je suis partant') {
        reply = 'Ok top, je te laisse me dire quel moment te convient le plus juste [ici](' + CALENDLY_URL + ')';
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: reply });
        addMessage('bot', reply);
        return;
      }
      if (text === "Pas pour l'instant") {
        reply = "Pas de souci. N'hésite pas à revenir quand tu veux.";
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: reply });
        addMessage('bot', reply);
        return;
      }
    }

    callAPI(text);
  }

  /* ─── Input auto-resize ─── */
  inputEl.addEventListener('input', function() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });

  /* ─── Send on Enter ─── */
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var val = inputEl.value;
      inputEl.value = '';
      inputEl.style.height = 'auto';
      sendMessage(val);
    }
  });

  sendBtn.addEventListener('click', function() {
    var val = inputEl.value;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendMessage(val);
  });

  /* ─── Open / close ─── */
  toggleBtn.addEventListener('click', function() {
    isOpen = !isOpen;
    widgetEl.classList.toggle('open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));

    if (isOpen && !opened) {
      opened = true;
      setTimeout(function() {
        addMessage('bot', "Bonjour, je suis l'assistant Edabos. Comment puis-je t'aider ?");
        setQuickReplies(["J'ai une boutique", 'Je veux me lancer', "J'ai des questions"]);
      }, 400);
    }

    if (isOpen) {
      setTimeout(function() { inputEl.focus(); }, 300);
    }
  });

  closeBtn.addEventListener('click', function() {
    isOpen = false;
    widgetEl.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  });

})();
