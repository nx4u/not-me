const storyExample = [
  'طلبك الأخير تحت المراجعة.',
  'راح نتواصل معك لتأكيد حالة الطلب.',
  'عشان نرجّع لك المبلغ، وافق على الإشعار.',
  'إشعار: تأكيد إضافة البطاقة إلى محفظة رقمية على جهاز جديد.'
].join('\n');
const storyField = id => byId('story-' + id);
const actionablePatterns = [
  /رمز (?:التحقق|التاكيد)|كود التحقق|اضغط الان|شارك بيانات/,
  /(?:وافق|ادفع|حول|ارسل|اكتب|اعط).{0,36}(?:الاشعار|المبلغ|الرسوم|الكود|بيانات|الطلب)/
];

function analyzeStory(lines) {
  const rows = [];
  const messages = [];
  let stopIndex = -1;
  let related;
  let route;
  for (const line of lines) {
    const notice = /^إشعار\s*[:：]\s*(.+)$/u.exec(line);
    if (notice) {
      const match = messages.slice(-4).reverse()
        .map(message => ({index:message.index, result:inspectMessage(message.text, notice[1])}))
        .find(candidate => candidate.result.contrast);
      if (match) {
        const contrast = match.result;
        const signal = contrast.evidence[0];
        rows.push({sender:'إشعار الموافقة', quote:signal.quote, detail:signal.explain});
        if (stopIndex < 0) {
          stopIndex = match.index;
          rows[stopIndex].quote = signal.quote;
          rows[stopIndex].detail = 'هنا طُلب منك إجراء يُفهم مع إشعار الموافقة التالي.';
        }
        if (stopIndex === match.index) {
          related = contrast.related;
          route = contrast.action.route;
        }
      } else {
        rows.push({sender:'إشعار الموافقة', detail:'ما ظهر تعارض واضح مع الرسائل السابقة.'});
      }
      continue;
    }
    const result = inspectMessage(line, '');
    const signal = result.evidence.find(item => item.caseId);
    const target = awarenessSearch(line).replace(/ة/g,'ه');
    const actionable = actionablePatterns.some(pattern => pattern.test(target)) ||
      signal?.caseId === 'mule' || signal?.caseId === 'iban';
    if (signal && actionable && stopIndex < 0) {
      stopIndex = rows.length;
      related = result.related;
      route = related?.route;
    }
    messages.push({text:line,index:rows.length});
    rows.push({
      sender:'رسالة أو كلام متصل',
      quote:signal?.quote,
      detail:signal?.explain || 'ما ظهرت إشارة واضحة في هذا السطر.'
    });
  }
  return {rows, stopIndex, related, route};
}

let storyAnalysis;
function setStory(open) {
  byId('story').hidden = !open;
  storyField('open').setAttribute('aria-expanded', String(open));
  storyField(open ? 'title' : 'open').focus();
}
function clearStory() {
  storyAnalysis = undefined;
  storyField('error').hidden = true;
  storyField('result').hidden = true;
  storyField('list').replaceChildren();
}
function renderStory() {
  clearStory();
  const lines = storyField('input').value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 10) {
    storyField('error').textContent = 'أدخل من رسالتين إلى ١٠ رسائل، كل واحدة في سطر.';
    storyField('error').hidden = false;
    storyField('input').focus();
    return;
  }
  storyAnalysis = analyzeStory(lines);
  const {rows, stopIndex, related, route} = storyAnalysis;
  storyField('result-title').textContent = stopIndex < 0
    ? 'ما ظهرت لحظة توقف واضحة'
    : 'قف عند السطر ' + awarenessNumber.format(stopIndex + 1);
  storyField('detail').textContent = stopIndex < 0
    ? 'هذا الفحص يساعدك تراجع السياق. غياب الإشارة ما يثبت إن المحادثة آمنة.'
    : 'راجع الطلب من القناة الرسمية قبل الموافقة أو مشاركة البيانات.';
  storyField('list').replaceChildren(...rows.map((row,index) => {
    const item = document.createElement('li');
    const priority = index === stopIndex;
    if (priority) item.setAttribute('data-priority','true');
    const label = document.createElement('small');
    label.textContent = awarenessNumber.format(index + 1) + ' · ' + row.sender + (priority ? ' · نقطة التوقف' : '');
    const note = document.createElement('p');
    note.textContent = row.detail;
    item.append(label);
    if (row.quote) {
      const quote = document.createElement('q');
      quote.textContent = row.quote;
      item.append(quote);
    }
    item.append(note);
    return item;
  }));
  storyField('guide').hidden = !related;
  storyField('report').hidden = !route;
  storyField('result').hidden = false;
  storyField('result-title').focus();
}

storyField('open').addEventListener('click', () => setStory(byId('story').hidden));
storyField('close').addEventListener('click', () => setStory(false));
storyField('input').addEventListener('input', clearStory);
storyField('form').addEventListener('reset', clearStory);
storyField('form').addEventListener('submit', event => {event.preventDefault();renderStory()});
storyField('example').addEventListener('click', () => {storyField('input').value = storyExample;renderStory()});
storyField('guide').addEventListener('click', () => {
  if (!storyAnalysis?.related) return;
  setStory(false);
  byId('aw-search').value = '';
  byId('aw-filter').value = '';
  renderAwarenessCards();
  openAwareness(true);
  selectAwareness(storyAnalysis.related);
});
storyField('report').addEventListener('click', () => {
  const route = storyAnalysis?.route;
  if (!route || !demoMessages[route]) return;
  setStory(false);
  byId('scenario').value = route;
  byId('mode').value = 'guided';
  restart();
});
