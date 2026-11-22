const awarenessSources = {
  sama: ['دليل البنك المركزي السعودي', 'https://www.sama.gov.sa/ar-sa/Documents/Guide.pdf'],
  cma: ['دليل حماية المستثمر — هيئة السوق المالية', 'https://cma.org.sa/InvestorProtection/Documents/guideline.pdf'],
  stores: ['التحقق من متجر موثّق — المركز السعودي للأعمال', 'https://eauthenticate.saudibusiness.gov.sa/inquiry'],
  commerce: ['تحذير وزارة التجارة من ادعاء استرجاع الأموال', 'https://mc.gov.sa/ar/mediacenter/News/Pages/05-08-22-01.aspx']
};
const callBank = 'تواصل فورًا مع البنك من تطبيقه أو رقمه الرسمي. اذكر بالضبط وش شاركت أو وافقت عليه.';
const reportDebit = 'بلّغ البنك فورًا عبر قناته الرسمية. احتفظ بوقت العملية ومبلغها ورقمها المرجعي إذا توفر.';
const verifyNotice = 'ارفض الطلب اللي ما بدأته. أنهِ المكالمة وتحقق من التطبيق أو الرقم الرسمي.';
const awarenessCases = [
  {
    id:'link', group:'رسائل ومكالمات', title:'رابط شحنة أو فاتورة مزيف', terms:'تصيد sms شحن عنوان',
    example:'وصلتك رسالة تدّعي إن الشحنة متوقفة وتطلب دفع رسوم بسيطة من رابط.',
    signals:['الرسالة تستعجلك بالدفع.','الرابط جاء في الرسالة بدل التطبيق اللي طلبت منه.'],
    before:'افتح تطبيق الشحن أو المتجر بنفسك وراجع حالة الطلب.', after:'إذا فتحت الرابط فقط، أغلق الصفحة ولا تكمل. إذا أدخلت بيانات مصرفية، ' + callBank,
    source:'sama', route:'purchase'
  },
  {
    id:'bank', group:'رسائل ومكالمات', title:'كلّمني أنت | انتحال البنك', terms:'متصل اتصال بنك موظف رقم',
    example:'متصل يقول إنه موظف بنك ويطلب بياناتك بحجة إيقاف عملية.',
    signals:['الاتصال بدأ من طرف مجهول.','المتصل يستعجلك ويطلب بيانات سرية.'],
    before:'أنه المكالمة وابدأ اتصالًا جديدًا بالرقم من تطبيق البنك أو موقعه الرسمي.', after:callBank,
    source:'sama', route:'purchase'
  },
  {
    id:'otp', group:'رسائل ومكالمات', title:'عطيتهم الرمز', terms:'رمز تحقق otp كود باسورد',
    example:'شخص طلب رمز تحقق، وبعد ما أعطيته الرمز لاحظت إن الرسالة ترتبط بإجراء ما طلبته.',
    signals:['طلب منك نقل الرمز بصوتك أو كتابته في المحادثة.','الغرض المكتوب في الرسالة مختلف عن اللي وصفه المتصل.'],
    before:'احتفظ بالرمز لنفسك واقرأ الغرض المكتوب في الرسالة.', after:callBank + ' اذكر نوع الطلب المكتوب في الإشعار، بدون مشاركة الرمز.',
    source:'sama', route:'wallet', extra:'reason'
  },
  {
    id:'approval', group:'رسائل ومكالمات', title:'من وين جت الموافقة؟', terms:'وافق طلب موافق اشعار نفاذ',
    example:'المتصل يقول إن الموافقة تلغي عملية، وإشعار التطبيق يطلب تأكيد إجراء جديد.',
    signals:['كلام المتصل يعاكس الإجراء المكتوب في الإشعار.','أنت ما بدأت الطلب.'],
    before:verifyNotice, after:callBank, source:'sama', route:'wallet', extra:'reason'
  },
  {
    id:'refund', group:'رسائل ومكالمات', title:'أرجّع لك فلوسك', terms:'استرجاع تعويض رسوم وزارة',
    example:'بعد خسارة مبلغ، تواصل معك شخص يدّعي إنه يقدر يرجعه مقابل رسوم أو كود تحقق.',
    signals:['طلب دفعة إضافية مقابل استرجاع مبلغ سابق.','طلب رمزًا أو بيانات مصرفية عبر قناة غير رسمية.'],
    before:'تواصل مع بنكك أو الجهة المختصة من موقعها أو تطبيقها الرسمي.', after:callBank, source:'commerce', route:'transfer'
  },
  {
    id:'card', group:'بطاقات وحسابات', title:'مو أنا | خصم ما أعرفه', terms:'سحب شراء خصم بطاقة عملية',
    example:'وصلك إشعار شراء وأنت ما تتذكر إنك نفذت العملية.',
    signals:['المبلغ أو وقت العملية غير مألوف.','ظهر خصم آخر من الجهة نفسها.'],
    before:'راجع تفاصيل العملية داخل تطبيق البنك. إذا ظلت غير معروفة، بلّغ البنك عبر القناة الرسمية.', after:reportDebit,
    source:'sama', route:'purchase'
  },
  {
    id:'wallet', group:'بطاقات وحسابات', title:'بطاقتي انضافت لمحفظة غريبة', terms:'محفظة رقمية ابل باي جهاز هاتف',
    example:'طلع لك إشعار بإضافة بطاقتك لمحفظة على جهاز جديد وأنت ما أضفتها.',
    signals:['الجهاز أو المحفظة غير معروف لك.','المتصل يسمّي الإضافة «إلغاء» أو «تحقق».'],
    before:verifyNotice, after:callBank + ' اذكر إن الإشعار يتعلق بإضافة بطاقة لمحفظة رقمية.', source:'sama', route:'wallet'
  },
  {
    id:'phone', group:'بطاقات وحسابات', title:'جوالي انسرق', terms:'فقدان سرقة جوال هاتف',
    example:'فقدت جوالك وعليه تطبيقات بنكية أو محافظ دفع مفتوحة.',
    signals:['إشعار تسجيل دخول أو دفع ما تتعرف عليه.','الجهاز المفقود مرتبط ببطاقاتك.'],
    before:'اعرف قنوات التواصل الرسمية لبنوكك من جهاز بديل.', after:'تواصل مع الجهات المالية عبر القنوات الرسمية من جهاز موثوق، واذكر أن الهاتف المسجّل مفقود.',
    source:'sama', route:'wallet'
  },
  {
    id:'finance', group:'بطاقات وحسابات', title:'ما طلبت تمويل', terms:'قرض هوية طلب تمويل انتحال',
    example:'وصلك إشعار بطلب تمويل باسمك، وأنت ما قدّمت أي طلب.',
    signals:['الإشعار يشير لطلب ما بدأته.','تم التواصل معك لاستكمال بيانات مطلوبة للصرف.'],
    before:'تحقق من طلب التمويل مباشرة من القناة الرسمية للجهة المذكورة.', after:'أبلغ جهة التمويل رسميًا واطلب مراجعة الطلب. راجع رقم الطلب إن كان متاحًا.',
    source:'sama'
  },
  {
    id:'transfer', group:'حوالات ومدفوعات', title:'حوّلت لمحتال', terms:'استرجاع حوالة تحويل مستفيد بنك',
    example:'حوّلت مبلغًا، ثم اكتشفت إن الطرف اللي طلب الحوالة ينتحل اسم شخص أو جهة.',
    signals:['اختلف اسم صاحب الحساب عن المتوقع.','تغيّر سبب الدفع أو المستفيد فجأة.'],
    before:'تأكد من اسم المستفيد وسبب الدفع عبر وسيلة تواصل تعرفها مسبقًا.', after:reportDebit + ' اسأل البنك عن الإجراء المتاح للحوالة.',
    source:'sama', route:'transfer'
  },
  {
    id:'iban', group:'حوالات ومدفوعات', title:'الآيبان تبدّل', terms:'ايبان آيبان فاتورة مورد حساب',
    example:'جاك بريد باسم مورد تعرفه، لكن رقم الحساب في الفاتورة الجديدة مختلف.',
    signals:['بيانات الدفع تغيّرت فجأة.','التغيير جاء بطلب عاجل.'],
    before:'اتصل بالمورد باستخدام رقم تعرفه مسبقًا للتأكد من تغيير الحساب قبل الدفع.', after:reportDebit,
    source:'sama', route:'transfer'
  },
  {
    id:'receipt', group:'حوالات ومدفوعات', title:'وين الحوالة؟ | إيصال مزيف', terms:'ايصال إيصال مزور متجر شحن',
    example:'مشتري يرسل صورة إيصال ويطلب شحن الطلب قبل ما يظهر المبلغ عندك.',
    signals:['الدفعة ما تظهر في سجلك البنكي.','المشتري يضغط عليك تشحن بسرعة.'],
    before:'طابق الحوالة الواردة مع مبلغ الطلب ومرجع الدفع في سجلك قبل الشحن.',
    after:'احتفظ بالإيصال وتفاصيل الطلب، وراجع البنك أو الجهة اللي تدير مدفوعات متجرك إذا لزم.',
    source:'sama'
  },
  {
    id:'mule', group:'حوالات ومدفوعات', title:'فلوس مرّت بحسابك', terms:'تمرير أموال عمولة حوالة وظيفة',
    example:'شخص يعرض عليك عمولة مقابل تستقبل حوالة بحسابك ثم تحوّلها لشخص ثاني.',
    signals:['مصدر المبلغ وسبب استلامه غير واضحين.','العمولة مقابل استعمال حسابك الشخصي.'],
    before:'ارفض تمرير الحوالة، ولا تعط الطرف الثاني بيانات الدخول أو التحكم في الحساب.', after:'تواصل مع البنك عبر قنواته الرسمية واذكر تفاصيل العرض والحوالة قبل أن تتصرف بالمبلغ.',
    source:'sama', route:'transfer'
  },
  {
    id:'review', group:'حوالات ومدفوعات', title:'خلّ أحد يراجع معي', terms:'مستفيد جديد مراجعة تحويل كبير قريب',
    example:'شخص يدّعي إنه قريب لك ويطلب حوالة عاجلة إلى حساب جديد ما تعرفه.',
    signals:['الشخص غيّر رقم تواصله فجأة.','طلب تحويل مبلغ بسرعة لحساب باسم مختلف.'],
    before:'اتصل بالشخص على الرقم اللي تعرفه. إذا احتجت رأيًا ثانيًا، اشرح الطلب لشخص تثق فيه بدون مشاركة بياناتك السرية.', after:reportDebit,
    source:'sama', route:'transfer'
  },
  {
    id:'store', group:'تسوّق واشتراكات', title:'قبل العربون | متجر مقلّد', terms:'متجر وهمي عربون انستقرام سعر',
    example:'حساب يقلّد متجرًا معروفًا ويطلب تحويل عربون إلى حساب شخصي.',
    signals:['اسم الحساب يشبه علامة معروفة.','الدفع مطلوب خارج المتجر أو إلى حساب شخصي.'],
    before:'تحقق من رابط المتجر الفعلي من خدمة الاستعلام عن متجر موثّق قبل تحويل العربون.',
    after:reportDebit + ' احتفظ بتفاصيل الطلب وإيصال التحويل.', source:'stores', route:'transfer'
  },
  {
    id:'delivery', group:'تسوّق واشتراكات', title:'احجز المبلغ | دفع قبل التسليم', terms:'آيفون ايفون إعلان وسيط حجز مبلغ',
    example:'بائع في إعلان يطلب تحويل القيمة كاملة قبل ما تتأكد من السلعة أو تستلمها.',
    signals:['البائع يرفض وسائل الدفع المتاحة داخل المنصة.','يرسل رابطًا خارجيًا ويدّعي أنه وسيط دفع.'],
    before:'اختر وسيلة دفع موثوقة داخل المنصة إذا كانت متاحة، وتحقق من شروطها قبل الدفع.',
    after:reportDebit + ' احتفظ بالمحادثة والإيصال.', source:'stores', route:'transfer'
  },
  {
    id:'subscription', group:'تسوّق واشتراكات', title:'دفعة وحدة | تجديد مخفي', terms:'اشتراك رسوم تجربة ريال تجديد',
    example:'موقع يعلن عن تجربة بريال ثم يظهر خصم متكرر.',
    signals:['مدة التجربة قصيرة واستحقاق التجديد مكتوب بخط صغير.','قيمة التجديد تختلف عن السعر الإعلاني.'],
    before:'راجع مبلغ التجديد وتاريخه وطريقة الإلغاء قبل إدخال بيانات الدفع.', after:'راجع إعدادات الاشتراك والإلغاء من الخدمة الأصلية. إذا العملية غير معروفة لك، ' + reportDebit,
    source:'sama', route:'purchase'
  },
  {
    id:'investment', group:'استثمار وتمويل', title:'ربح على الشاشة', terms:'استثمار وهمي ربح تداول منصة',
    example:'منصة تعرض ربحًا مرتفعًا، ثم تطلب دفعة جديدة عشان تسحب أرباحك.',
    signals:['وعد بعوائد مضمونة أو ضغط للإيداع بسرعة.','طلب رسوم إضافية كل مرة تحاول تسحب.'],
    before:'تحقق من ترخيص الجهة من هيئة السوق المالية ومن أن العرض صادر عنها فعلًا.',
    after:'توقف عن إرسال دفعات إضافية وتواصل مع البنك إذا حولت مبلغًا. احتفظ بالإيصالات والمحادثة.',
    source:'cma', route:'transfer'
  },
  {
    id:'insurance', group:'استثمار وتمويل', title:'تحقّق قبل تحوّل | وسيط تأمين ينتحل جهة', terms:'تأمين وسيط حماية ادخار عوائد',
    example:'رسالة تعرض وثيقة حماية وادخار وتطلب تحول القسط الأول لحساب شخصي.',
    signals:['إلحاح على الدفع قبل وصول وثيقة أو عرض رسمي.','قناة الدفع ما تتطابق مع القناة المعروفة للشركة.'],
    before:'تواصل مع شركة التأمين من موقعها الرسمي وتحقق من هوية الوسيط وقناة الدفع قبل التحويل.',
    after:reportDebit + ' احتفظ بالعرض والمراسلة.', source:'sama', route:'transfer'
  }
];

const awarenessButtons = new Map();
let activeAwareness = null;
const awarenessNumber = new Intl.NumberFormat('ar-SA');
const awarenessStages = [['before','وصلني العرض أو الإشعار فقط'],['after','تفاعلت أو شاركت بيانات أو وافقت'],['paid','انخصم مبلغ أو حولت']];
const approvalKinds = {
  wallet:'أضفت بطاقة لمحفظة رقمية',
  transfer:'وافقت على حوالة أو إضافة مستفيد',
  purchase:'شاركت رمزًا لإجراء غير واضح'
};

function awarenessOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function awarenessSearch(value) {
  return value.toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[\u064b-\u065f]/g,'').trim();
}

function renderAwarenessAlert() {
  if (!activeAwareness) return;
  const stage = byId('aw-stage').value;
  const kind = byId('aw-kind');
  kind.hidden = !(activeAwareness.extra === 'reason' && stage === 'after');
  const route = !kind.hidden ? byId('aw-approval').value : activeAwareness.route;
  byId('aw-report').hidden = !route || stage === 'before';
  const exposure = !kind.hidden && byId('aw-approval').value ? ' قل للبنك: «' + approvalKinds[route] + '».': '';
  const content = {
    before:['انتبه قبل ما تكمل',activeAwareness.before],
    after:['الخطوة بعد التفاعل',activeAwareness.after + exposure],
    paid:['بعد الخصم أو التحويل',reportDebit]
  }[stage];
  byId('aw-alert-title').textContent = content[0];
  byId('aw-next').textContent = content[1];
}

function selectAwareness(entry) {
  activeAwareness = entry;
  byId('aw-detail').hidden = false;
  byId('aw-detail-title').textContent = entry.title;
  byId('aw-example').textContent = entry.example;
  const signs = entry.signals.map(signal => {
    const li = document.createElement('li');
    li.textContent = signal;
    return li;
  });
  byId('aw-signals').replaceChildren(...signs);
  byId('aw-stage').value = 'before';
  byId('aw-approval').value = '';
  const [name, url] = awarenessSources[entry.source];
  byId('aw-source').textContent = name;
  byId('aw-source').href = url;
  renderAwarenessAlert();
  for (const [id, card] of awarenessButtons) card.setAttribute('aria-pressed', String(id === entry.id));
  byId('aw-detail-title').focus();
}

function renderAwarenessCards() {
  const group = byId('aw-filter').value;
  const query = awarenessSearch(byId('aw-search').value);
  const matches = awarenessCases.filter(item => (!group || item.group === group) && awarenessSearch(item.title + ' ' + item.terms + ' ' + item.example).includes(query));
  const cards = matches.map(item => awarenessButtons.get(item.id));
  byId('aw-cards').replaceChildren(...cards);
  byId('aw-count').textContent = matches.length ? awarenessNumber.format(matches.length) + ' سيناريو' : 'ما لقينا سيناريو يطابق البحث.';
  if (activeAwareness && !matches.includes(activeAwareness)) {
    awarenessButtons.get(activeAwareness.id).setAttribute('aria-pressed', 'false');
    byId('aw-detail').hidden = true;
    activeAwareness = null;
  }
}

function openAwareness(open) {
  byId('awareness').hidden = !open;
  byId('aw-open').setAttribute('aria-expanded', String(open));
  byId(open ? 'aw-title' : 'aw-open').focus();
}

for (const group of new Set(awarenessCases.map(item => item.group))) byId('aw-filter').append(awarenessOption(group, group));
for (const [key, label] of awarenessStages) byId('aw-stage').append(awarenessOption(key, label));
byId('aw-stage').value = 'before';
for (const entry of awarenessCases) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'aw-card';
  button.setAttribute('aria-pressed','false');
  const name = document.createElement('strong');
  name.textContent = entry.title;
  const group = document.createElement('small');
  group.textContent = entry.group;
  button.append(name, group);
  button.addEventListener('click', () => selectAwareness(entry));
  awarenessButtons.set(entry.id, button);
}

byId('aw-open').addEventListener('click', () => openAwareness(byId('awareness').hidden));
byId('aw-close').addEventListener('click', () => openAwareness(false));
byId('aw-search').addEventListener('input', renderAwarenessCards);
byId('aw-filter').addEventListener('change', renderAwarenessCards);
byId('aw-stage').addEventListener('change', renderAwarenessAlert);
byId('aw-approval').addEventListener('change', renderAwarenessAlert);
byId('aw-train').addEventListener('click', () => {openAwareness(false);setTraining(true)});
byId('aw-report').addEventListener('click', () => {
  if (!activeAwareness || byId('aw-report').hidden) return;
  const route = byId('aw-kind').hidden ? activeAwareness.route : byId('aw-approval').value;
  if (!route || !demoMessages[route]) return;
  openAwareness(false);
  byId('scenario').value = route;
  byId('mode').value = 'guided';
  restart();
});
renderAwarenessCards();
