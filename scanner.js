const messageSignals = [
  { pattern: /رمز التحقق|كود التحقق|رمز التاكيد|الكود اللي وصلك|رمز وصلك|otp/i, caseId:'otp', explain:'رمز التحقق مرتبط بإجراء على حسابك. لا تشاركه مع الطرف اللي طلبه.' },
  { pattern: /للالغاء|عشان نلغي|لالغاء|عشان الغي|الغاء العمليه|نوقف العمليه|نلغي العمليه/, caseId:'approval', explain:'تحقق من الإجراء المكتوب داخل إشعار الموافقة نفسه.' },
  { pattern: /عشان نرجع|لاسترجاع|استرجاع (?:المبلغ|الاموال)|رسوم الاسترجاع|رسوم السحب|عشان ينزل المبلغ/, caseId:'refund', explain:'إذا ادعى الطرف أنه يرجع مبلغًا، راجع الطلب من القناة الرسمية قبل الموافقة أو دفع رسوم.' },
  { pattern: /حساب شخصي|عربون|دفعة اولى|دفعتك الاولى/, caseId:'store', explain:'تأكد من هوية البائع ووسيلة الدفع قبل إرسال عربون أو دفعة.' },
  { pattern: /تم تغيير الايبان|الايبان الجديد|حساب المورد الجديد|حسابنا الجديد/, caseId:'iban', explain:'تغيّر بيانات الدفع يستدعي التحقق من المورد بوسيلة تواصل تعرفها مسبقًا.' },
  { pattern: /ارباح مضمونه|عائد مضمون|ربح مضمون|اضاعف راس مالك|ضاعف راس مالك/, caseId:'investment', explain:'تحقق من ترخيص جهة الاستثمار ومن أن العرض صادر عنها.' },
  { pattern: /استقبل حواله|تمرر حواله|حولها للطرف|عموله مقابل تحويل/, caseId:'mule', explain:'العرض يطلب استخدام حسابك لتحريك أموال لطرف آخر.' },
  { pattern: /جمدنا حسابك|سيتم ايقاف حسابك|حدث بياناتك|انا من البنك|موظف البنك|قسم الاحتيال/, caseId:'bank', explain:'وصف المرسل لنفسه ما يكفي لمعرفة هويته. تحقق عبر القناة الرسمية.' },
  { pattern: /رسوم الشحن|رسوم توصيل|حدث عنوانك|اشحن الطلب|الشحنه متوقفه/, caseId:'link', explain:'راجع الشحنة من التطبيق الأصلي قبل دفع رسوم من رسالة.' },
  { pattern: /الان فورا|خلال دقائق|قبل ما ينتهي|اخر فرصه|اضغط الان/, caseId:null, explain:'الاستعجال قد يمنعك من التحقق. خذ وقتك وراجع الطلب.' },
  { pattern: /https?:\/\/|www\./i, caseId:null, explain:'النص فيه رابط. الأداة تقرأ العبارة وما تفتح الرابط أو تتحقق من وجهته.' }
];

const noticeActions = [
  {pattern:/محفظه(?: رقميه)?|ابل باي|apple pay/i, route:'wallet', description:'ربط بطاقة بمحفظة رقمية'},
  {pattern:/حواله|تحويل مبلغ|اضافه مستفيد|مستفيد جديد/, route:'transfer', description:'حوالة أو إجراء متعلق بمستفيد'},
  {pattern:/عمليه شراء|تاكيد شراء|دفع مبلغ|شراء بالبطاقه/, route:'purchase', description:'عملية شراء أو دفع'}
];

function inspectMessage(message, notice) {
  function normalized(value) {
    const offsets = [];
    let text = '';
    for (let index = 0; index < value.length; index++) {
      const char = value[index];
      if (/[\u0640\u064b-\u065f]/.test(char)) continue;
      offsets.push(index);
      text += char.replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
    }
    return {text, offsets};
  }
  const {text:messageText, offsets} = normalized(message);
  const {text:noticeText} = normalized(notice);
  const quoteFrom = match => message.slice(offsets[match.index], offsets[match.index + match[0].length]);
  const evidence = [];
  for (const {pattern, caseId, explain} of messageSignals) {
    const match = pattern.exec(messageText);
    if (!match) continue;
    evidence.push({quote:quoteFrom(match).trimEnd(), caseId, explain});
  }
  const phrase = /نرجع(?: لك)?|يرجع لك|ارجاع|استرجاع|نلغي|الغاء|نوقف العمليه/.exec(messageText);
  const action = noticeActions.find(({pattern}) => pattern.test(noticeText));
  const reviewIntent = /تاكيد|وافق|تاكد من|طلب/.test(noticeText);
  const cancelled = /الغاء|الغي|رفض|فشل|لم تتم/.test(noticeText);
  const contrast = Boolean(phrase && action && reviewIntent && !cancelled);
  if (contrast) {
    evidence.unshift({
      quote:quoteFrom(phrase).trimEnd(),
      caseId:'approval',
      explain:'المرسل يتكلم عن إلغاء أو استرداد، بينما الإشعار يشير إلى ' + action.description + '.'
    });
  }
  const caseId = evidence.find(item => item.caseId)?.caseId;
  const related = awarenessCases.find(item => item.id === caseId);
  const detected = notice ? classify(notice) : '';
  return {evidence, related, contrast, action, detected};
}

let lastScan = null;
let chosenScanRoute = '';
const scanField = id => byId('scan-' + id);

function showScanner(open) {
  byId('scanner').hidden = !open;
  scanField('open').setAttribute('aria-expanded', String(open));
  scanField(open ? 'title' : 'open').focus();
}

function clearScan() {
  lastScan = null;
  chosenScanRoute = '';
  scanField('result').hidden = true;
  scanField('evidence').replaceChildren();
  scanField('guide').hidden = true;
  scanField('report').hidden = true;
}

function showScanResult() {
  const message = scanField('message').value.trim();
  const notice = scanField('notice').value.trim();
  if (!message) {
    clearScan();
    scanField('message').focus();
    return;
  }
  lastScan = inspectMessage(message, notice);
  const {evidence, related, contrast, action, detected} = lastScan;
  const stage = scanField('stage').value;

  scanField('result-title').textContent = contrast
    ? 'فيه تعارض بين الكلام والإشعار'
    : evidence.length ? 'لقينا إشارات تستحق التحقق' : 'ما ظهرت إشارة واضحة في النص';
  scanField('notice-type').hidden = !notice;
  scanField('notice-type').textContent = detected
    ? 'تصنيف المساعد لإشعار الموافقة: ' + typeLabels[detected]
    : action ? 'الإجراء الظاهر في الإشعار: ' + action.description : 'نوع الإشعار غير واضح من النص.';
  scanField('evidence').replaceChildren(...evidence.map(item => {
    const box = document.createElement('div');
    box.className = 'scan-signal';
    const quote = document.createElement('q');
    quote.textContent = item.quote;
    const explanation = document.createElement('p');
    explanation.textContent = item.explain;
    box.append(quote, explanation);
    return box;
  }));
  const before = contrast ? verifyNotice : related?.before ||
    'الفحص ما يثبت أن الرسالة آمنة. إذا الطلب غير متوقع، تحقق منه عبر التطبيق أو الرقم الرسمي.';
  scanField('next').textContent = stage === 'paid' ? reportDebit : stage === 'after' ? callBank : before;
  scanField('guide').hidden = !related;
  chosenScanRoute = action?.route || related?.route || (stage === 'paid' ? 'purchase' : '');
  scanField('report').hidden = stage === 'before' || !chosenScanRoute;
  scanField('result').hidden = false;
  scanField('result-title').focus();
}

scanField('open').addEventListener('click', () => showScanner(byId('scanner').hidden));
scanField('close').addEventListener('click', () => showScanner(false));
for (const field of ['message','notice','stage']) scanField(field).addEventListener('input', clearScan);
scanField('form').addEventListener('submit', event => {event.preventDefault();showScanResult()});
scanField('form').addEventListener('reset', clearScan);
scanField('sample').addEventListener('click', () => {
  scanField('message').value = 'عشان نرجّع لك المبلغ، وافق على الإشعار.';
  scanField('notice').value = 'تأكيد إضافة البطاقة إلى محفظة رقمية على جهاز جديد.';
  scanField('stage').value = 'before';
  showScanResult();
});
scanField('guide').addEventListener('click', () => {
  const entry = lastScan?.related;
  if (!entry) return;
  const stage = scanField('stage').value;
  showScanner(false);
  byId('aw-search').value = '';
  byId('aw-filter').value = '';
  renderAwarenessCards();
  openAwareness(true);
  selectAwareness(entry);
  byId('aw-stage').value = stage;
  if (entry.extra === 'reason' && chosenScanRoute) byId('aw-approval').value = chosenScanRoute;
  renderAwarenessAlert();
});
scanField('report').addEventListener('click', () => {
  if (scanField('report').hidden || !demoMessages[chosenScanRoute]) return;
  showScanner(false);
  byId('scenario').value = chosenScanRoute;
  byId('mode').value = 'guided';
  restart();
});
