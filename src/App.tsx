import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ==================== TYPES ====================

interface ShortLink {
  id: string;
  description: string;
  shortUrl: string;
  soldOutUrl?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  relativeDay: number;
  relativeLabel: string;
  sendTime: string;
  channel: Channel;
  emailSubject?: string;
  content: string;
  contentSoldOut?: string;
  targetAudience?: string;
  notes?: string;
}

interface ScheduledMessage {
  id: string;
  templateId?: string;
  name: string;
  date: string;
  sendTime: string;
  channel: Channel;
  emailSubject?: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  notes?: string;
  relativeDay: number;
  relativeLabel: string;
  targetAudience?: string;
}

interface Challenge {
  id: string;
  name: string;
  startDate: string;
  messages: ScheduledMessage[];
}

type Channel = 'email' | 'whatsapp_personal' | 'whatsapp_group' | 'sms';
type Tab = 'dashboard' | 'templates' | 'links' | 'settings';

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'מייל',
  whatsapp_personal: 'וואטסאפ אישי',
  whatsapp_group: 'וואטסאפ קבוצתי',
  sms: 'SMS',
};

const CHANNEL_COLORS: Record<Channel, string> = {
  email: 'bg-blue-100 text-blue-800 border-blue-200',
  whatsapp_personal: 'bg-green-100 text-green-800 border-green-200',
  whatsapp_group: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  sms: 'bg-purple-100 text-purple-800 border-purple-200',
};

const CHANNEL_ICONS: Record<Channel, string> = {
  email: '✉️',
  whatsapp_personal: '📱',
  whatsapp_group: '👥',
  sms: '📬',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה',
  scheduled: 'מתוזמן',
  sent: 'נשלח',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
};

// ==================== HELPERS ====================

const genId = () => Math.random().toString(36).slice(2, 10);

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateHebrew(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const day = days[d.getDay()];
  return `יום ${day}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function relativeDayLabel(day: number): string {
  if (day < 0) return `${Math.abs(day)} ימים לפני האתגר`;
  if (day === 0) return 'יום 1 לאתגר';
  if (day === 1) return 'יום 2 לאתגר';
  if (day === 2) return 'יום 3 לאתגר';
  if (day === 3) return 'יום 4 לאתגר (סיכום)';
  if (day === 4) return 'יום אחרי סיום האתגר';
  if (day > 4) return `${day - 3} ימים אחרי סיום האתגר`;
  return `יום ${day}`;
}

// ==================== DEFAULT DATA ====================

const DEFAULT_LINKS: ShortLink[] = [
  { id: genId(), description: 'וואטסאפ', shortUrl: 'https://B-E.short.gy/WA', soldOutUrl: 'https://business-express.short.gy/WA14' },
  { id: genId(), description: 'זום', shortUrl: 'https://B-E.short.gy/zoom' },
  { id: genId(), description: 'סרטון שאלות ותשובות + עדויות', shortUrl: 'https://B-E.short.gy/like' },
  { id: genId(), description: 'דף נחיתה 1', shortUrl: 'https://B-E.short.gy/1' },
  { id: genId(), description: 'דף נחיתה 2', shortUrl: 'https://B-E.short.gy/2' },
  { id: genId(), description: 'דף נחיתה 3', shortUrl: 'https://B-E.short.gy/3' },
  { id: genId(), description: 'לינק להגשת מועמדות', shortUrl: 'https://B-E.short.gy/match' },
  { id: genId(), description: 'דף נחיתה שיווק חוויה פרסונלית', shortUrl: 'https://B-E.short.gy/gc' },
  { id: genId(), description: 'שאלון מועמדות רגיל', shortUrl: 'https://B-E.short.gy/MQ' },
  { id: genId(), description: 'הקלטות', shortUrl: 'https://B-E.short.gy/rec' },
  { id: genId(), description: 'סרטון עדויות', shortUrl: 'https://vimeo.com/1158082790?share=copy&fl=sv&fe=ci' },
  { id: genId(), description: 'דנה בן ארי - עדות', shortUrl: 'https://vimeo.com/1151767225?share=copy&fl=sv&fe=ci' },
  { id: genId(), description: 'דף נחיתה זמני לתכנית', shortUrl: 'https://B-E.short.gy/GoBig' },
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  // 5 ימים לפני
  {
    id: genId(), name: 'מייל מותאם 1', relativeDay: -5,
    relativeLabel: '5 ימים לפני האתגר',
    sendTime: '07:03', channel: 'email',
    emailSubject: 'במלחמת 12 הימים עם איראן הכנסנו מליון שקל',
    content: 'במלחמת 12 הימים עם איראן הכנסנו מיליון שקל.\n\nבזמן שכולם (כולל אותנו) רצו למקלטים,\nניסו להשלים שעות שינה\nוחיכו שהמלחמה תיגמר,\nהעסק שלנו שבר שיאים.\n\nהעסק שלנו הכניס בפעם הראשונה מיליון שקל בשבוע.\nסולדאאוט לתכנית פרימיום במהלך אחד.\n\nלא ברדיפה אחרי לקוחות.\nלא בטיקטוק.\nולא בהשתעבדות לשיווק ולמכירות.\n\n(למעשה 80% מהשנה אנחנו בכלל לא עושות שיווק וגם לא מכירות)\n\nבאמצעות שיווק חווייתי.\n\nשיווק שגורם למסות של לקוחות פוטנציאליים\nלהכיר אותך,\nלהעריך אותך,\nולהבין שהם חייבים אותך.\n\nזה שיווק שמייצר הכנסות שיא בשבוע אחד💃',
    targetAudience: 'כל הנמענים מלבד "לא פתחו שנה" ומלבד המותאמים אישית',
    notes: 'מיילים - הותאם לאתגר. ווצאפ וסמס - להתאים עם קודים',
  },
  {
    id: genId(), name: 'וואטסאפ מותאם 1', relativeDay: -5,
    relativeLabel: '5 ימים לפני האתגר',
    sendTime: '10:53', channel: 'whatsapp_personal',
    content: 'הי {{first_name}},\nהגיע הזמן לחזור לתת בראש בעסק שלך אחרי כל מה שעברנו לאחרונה!\nביום ראשון אנחנו חושפות את שיטת השיווק שהכניסה לנו\n4 מיליון ש"ח - בשנה אחת.\n(בלי רשתות חברתיות, ובלי לשווק ולמכור כל הזמן!)\n\nוזה קורה במיני־קורס לייב, חינם.\n\nאז במקום פוסטים, סטורי, או לרדוף אחרי לידים קרים -\nאנחנו מראות איך בונים מהלך שיווקי עוצמתי שמכניס\nעשרות עד מאות אלפי שקלים (ואפילו מיליון) בשבוע.\n\nאם יש לך קורסים למלא, או שירות פרימיום (5,000 ש"ח ומעלה)\nואין לך כוח לרשתות חברתיות - אז חובה להיות שם!!!\n\nהקורס החינמי נפתח ביום ראשון -\nאפילו לא צריך להרשם. רק להיכנס לקבוצת הוואטסאפ כאן:\n👇\n{{gaf_4561729}}\n\nנתראה בפנים!',
    targetAudience: 'וואטסאפ אישי + SMS',
  },
  // 3 ימים לפני
  {
    id: genId(), name: 'מייל מותאם 2', relativeDay: -3,
    relativeLabel: '3 ימים לפני האתגר',
    sendTime: '07:30', channel: 'email',
    emailSubject: 'שקרניות חרטטניות ונוכלות',
    content: 'בימים האחרונים אנחנו מקבלות\nלא מעט בוז ושנאה בתגובה למודעות שלנו,\nמאנשים שטוענים שאנחנו "מחרטטות", "שקרניות",\nוממציאות מספרי הכנסות "לא הגיוניים".\n\nאז למה כל כך קשה להאמין שאפשר להגיע לתוצאות גדולות בעסק?\nואיך משיגים תוצאות ש״נשמעות לא הגיוניות״?\n\n▪️ שי הכניסה 84,000 ש״ח בשבוע\n▪️ תמיר הכניס מיליון ש״ח (!) בשני מהלכים\n▪️ ועוד תוצאות שנשמעות כמעט לא אמיתיות\n\nאבל האמת?\nהן מאוד הגיוניות – כשעובדים עם שיטה נכונה.\n\nביום ראשון אנחנו פותחות את\nמיני־קורס "מהלך המיליון" 🔥\n(4 ימים, ראשון-רביעי, ב 10:00, מתחילים בראשון הקרוב!)',
    targetAudience: 'כל הנמענים מלבד "לא פתחו שנה" ומלבד המותאמים אישית',
  },
  {
    id: genId(), name: 'וואטסאפ מותאם 2', relativeDay: -3,
    relativeLabel: '3 ימים לפני האתגר',
    sendTime: '10:00', channel: 'whatsapp_personal',
    content: 'בימים האחרונים אנחנו מקבלות לא מעט תגובות קשות למודעות שלנו,\nמאנשים שטוענים שאנחנו ממציאות מספרים ו"תוצאות לא הגיוניות".\n\nאז איך באמת משיגים תוצאות שנשמעות לא הגיוניות?\n\nבסרטון המצורף תראו תגובות אמיתיות מהרשת של משתתפי המיני קורס הקודם.\n\nביום ראשון נפתח מיני קורס "מהלך המיליון",\n4 ימים, ראשון עד רביעי, בשעה 10:00.\n\nלסרטון העדויות:\nhttps://vimeo.com/1157133876?fl=pl&fe=sh',
    notes: 'לא לשכוח לצרף סרטון של צילומי מסך עדויות',
  },
  // 1 יום לפני
  {
    id: genId(), name: 'מייל מותאם 3 (מוצ"ש)', relativeDay: -1,
    relativeLabel: 'מוצאי שבת - יום לפני האתגר',
    sendTime: '20:30', channel: 'email',
    emailSubject: 'מחר מתחילים - מהלך המיליון',
    content: 'ודקה לפני שאנחנו מתחילים,\nאני רוצה להתוודות – אפרת ואני מאוד מאוד מאוד מתרגשות לקראת מחר.\nכי בשבילנו, ה־4 ימים הקרובים הם הזדמנות לתת לכם את הטוב ביותר שלנו.\n\nומחר ב־10:00 זה מתחיל 💃💃💃\n\n4 ימים שבהם נפתח לכם מסלול חדש שיראה לכם דרך אחרת לשווק ולמכור.\nדרך שתתן לכם לשווק בהתלהבות ותראה לכם איך להתחיל לשחק בליגה אחרת.',
  },
  // יום 1 - בוקר
  {
    id: genId(), name: 'מייל בוקר יום 1', relativeDay: 0,
    relativeLabel: 'בוקר יום 1 לאתגר',
    sendTime: '09:40', channel: 'email',
    emailSubject: 'היום ב 10:00 מתחילים! מהלך המיליון',
    content: 'היום ב 10:00 מתחילים!\nמיני-קורס "מהלך המיליון"!\nהמיני קורס שיהפוך את 2026 לשנת הזינוק שלך.\n\nהיום נתחיל כבר לשחק בליגה אחרת לגמרי\nונצלול ישר לתכלס! - מהו שיווק חווייתי, איך עושים עשרות ומאות אלפי שקלים בשבוע אחד ואיך ליצור רעיון מנצח בשבילך.\n\nאנחנו מתחילות ב־10:00 בול\nכדאי לא לאחר 😉\n\nזה הלינק שלך לכניסה לשידור החי (בעשר!):\n{{לינק זום}}',
  },
  {
    id: genId(), name: 'וואטסאפ קבוצתי - יום 1 בוקר', relativeDay: 0,
    relativeLabel: 'בוקר יום 1 לאתגר',
    sendTime: '09:55', channel: 'whatsapp_group',
    content: 'יאללה,\nמתחילים!!\n"מהלך המיליון" יוצא לדרך💃💃\n\nוהיום:\n"איך תכל\'ס ליצור קונספט שימשוך אליך מאות לקוחות פוטנציאליים לשיגור החווייתי שלך".\n\nמתחילים בול ב 10:00 וצוללים ישר לתוכן.\n\nזה הלינק שלך:\n{{לינק זום}}',
  },
  {
    id: genId(), name: 'סיכום + הקלטה יום 1', relativeDay: 0,
    relativeLabel: 'צהריים יום 1 לאתגר',
    sendTime: '12:00', channel: 'whatsapp_group',
    content: 'פששש...\n\nאיזה שידור היה לנו היום🔥\nכמעט אלף משתתפים.\nמאות קונספטים מדליקים שנוצרו בלייב.\nאסימונים אדירים שנפלו פה לאנשים על איך קופצים קדימה.\n\nאם עוד לא ראית את השידור, יש הקלטה!!!\nההקלטה היא לזמן מוגבל ותיעלם מחר בשעה 10:00.\n\nזה הלינק שלך:\n{{לינק הקלטות}}\n\nודבר אחרון: יש לנו הפתעה 🎁🎁\nהיום בשעה 20:30.\nמפגש מיוחד עם צוות יועצות הלימודים שלנו.',
  },
  // יום 2 - בוקר
  {
    id: genId(), name: 'מייל בוקר יום 2', relativeDay: 1,
    relativeLabel: 'בוקר יום 2 לאתגר',
    sendTime: '09:50', channel: 'email',
    emailSubject: 'הנוסחה ל-200 מיליון. איך למכור בלי לשכנע?',
    content: 'פששש.... איזה בוקר מושלם לזינוק עסקי💃💃\n\nבוקר שבו אני הולכת להראות לכם איך להיפטר מהתנגדויות ואיך להפסיק לשמוע:\n"יקר לי", "אני צריך לחשוב על זה", ו"נדבר אחר כך"\n\nהיום ב-10:00 זה נגמר!\n\nאני הולכת ללמד אתכם איך להניע את הלקוח לקנייה!\nאיך ליצור ללקוח 4 אמונות שיהפכו את הקנייה למובנת מאליה.\n\nזה הלינק כניסה שלך:\n{{לינק זום}}',
  },
  {
    id: genId(), name: 'וואטסאפ קבוצתי - יום 2 בוקר', relativeDay: 1,
    relativeLabel: 'בוקר יום 2 לאתגר',
    sendTime: '09:55', channel: 'whatsapp_group',
    content: 'יאללה, מ ת ח י ל י ם!\n\nאיך להניע את הלקוח לקנייה!\nהנוסחה ל-200 מיליון. איך למכור בלי לשכנע?\nואיך ליישם את זה בשיווק חווייתי.\n\nזה הלינק כניסה שלך:\n{{לינק זום}}',
  },
  {
    id: genId(), name: 'סיכום יום 2', relativeDay: 1,
    relativeLabel: 'צהריים יום 2 לאתגר',
    sendTime: '12:00', channel: 'whatsapp_group',
    content: 'חברים,\n\nאיזו התחלה פגז הייתה לנו.\nאבל.... זו רק ההתחלה.\n\nמהיום, מעלים קצב💃\nארגנו לכם ערימה של הפתעות ועדכנו את הלוז.\n\nזה הלינק להקלטות מהיום:\n{{לינק הקלטה}}',
  },
  // יום 3
  {
    id: genId(), name: 'מייל בוקר יום 3', relativeDay: 2,
    relativeLabel: 'בוקר יום 3 לאתגר',
    sendTime: '09:50', channel: 'email',
    emailSubject: 'יום 3 - מהלך המיליון - 16 השלבים',
    content: 'היום יום 3 במיני קורס "מהלך המיליון"!\nהיום נצלול לתוך 16 השלבים של שיווק חווייתי - מפת הדרכים המלאה.\n\nמתחילים ב-10:00.\n\nזה הלינק שלך:\n{{לינק זום}}',
  },
  // יום 4 (סיכום)
  {
    id: genId(), name: 'מייל יום 4 - שידור הסיכום', relativeDay: 3,
    relativeLabel: 'בוקר יום 4 לאתגר (סיכום)',
    sendTime: '09:45', channel: 'email',
    emailSubject: 'היום השידור הגדול - מהלך המיליון',
    content: 'היום השידור הגדול והמסכם!\nשלוש שעות של עוצמה.\n\nנתראה ב 10:00.\n\nשימו לב: היום אין הקלטה!\nאז חובה להיות בלייב.',
  },
  {
    id: genId(), name: 'הקלטות - אחה"צ יום 4', relativeDay: 3,
    relativeLabel: 'אחה"צ יום 4 (אחרי השידור)',
    sendTime: '15:00', channel: 'email',
    emailSubject: 'ההקלטות מוכנות! מהלך המיליון',
    content: 'ההקלטה של השידור המסכם עלתה!\nזמינה לזמן מוגבל.\n\nלהקלטה:\n{{לינק הקלטות}}',
  },
  // יום אחרי
  {
    id: genId(), name: 'מייל יום אחרי - בוקר', relativeDay: 4,
    relativeLabel: 'יום אחרי סיום האתגר (בוקר)',
    sendTime: '07:00', channel: 'email',
    emailSubject: 'מה עכשיו? הצעד הבא שלך',
    content: 'האתגר נגמר, אבל המסע שלך רק מתחיל.\n\nאם הרגשת שמשהו זז לך בפנים ב-4 הימים האלה,\nזה הזמן לדבר איתנו.\n\nלהגשת מועמדות:\n{{לינק מועמדות}}',
  },
  {
    id: genId(), name: 'וואטסאפ יום אחרי', relativeDay: 4,
    relativeLabel: 'יום אחרי סיום האתגר',
    sendTime: '08:00', channel: 'whatsapp_personal',
    content: 'הי {{first_name}},\nאיך היה לך באתגר?\nאם הרגשת שמשהו זז, אשמח לדבר איתך.',
  },
  {
    id: genId(), name: 'מייל יום אחרי - אחה"צ', relativeDay: 4,
    relativeLabel: 'יום אחרי סיום האתגר (אחה"צ)',
    sendTime: '14:00', channel: 'email',
    emailSubject: 'ההזדמנות נסגרת',
    content: 'תזכורת: הזדמנות ההצטרפות לתכנית הפרימיום שלנו נסגרת בקרוב.\n\nלפרטים והגשת מועמדות:\n{{לינק מועמדות}}',
  },
  // ימים אחרי
  {
    id: genId(), name: 'מייל - יום ראשון אחרי האתגר (בוקר)', relativeDay: 7,
    relativeLabel: 'יום ראשון אחרי האתגר',
    sendTime: '08:00', channel: 'email',
    emailSubject: 'הזמנה אחרונה',
    content: 'הזמנה אחרונה להצטרף לתכנית.\nההרשמה נסגרת היום בערב.',
  },
  {
    id: genId(), name: 'מייל - יום ראשון אחרי (ערב)', relativeDay: 7,
    relativeLabel: 'יום ראשון אחרי האתגר (ערב)',
    sendTime: '18:00', channel: 'email',
    emailSubject: 'נסגר הערב',
    content: 'הערב בחצות נסגרת ההרשמה לתכנית.\nזו האפשרות האחרונה.',
  },
];

// ==================== STORAGE ====================

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveState(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ==================== SHARED UI ====================

const Badge: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {text}
  </span>
);

const ChannelBadge: React.FC<{ channel: Channel }> = ({ channel }) => (
  <Badge text={`${CHANNEL_ICONS[channel]} ${CHANNEL_LABELS[channel]}`} className={CHANNEL_COLORS[channel]} />
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <Badge text={STATUS_LABELS[status] || status} className={STATUS_COLORS[status] || 'bg-gray-100 border-gray-200'} />
);

// ==================== LINK PICKER MODAL ====================

const LinkPickerModal: React.FC<{
  links: ShortLink[];
  onSelect: (url: string) => void;
  onClose: () => void;
}> = ({ links, onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-bold mb-4">🔗 בחירת לינק מהמאגר</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {links.map(l => (
          <button key={l.id} onClick={() => onSelect(l.shortUrl)}
            className="w-full text-right p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
            <div className="font-medium text-gray-900">{l.description}</div>
            <div className="text-sm text-blue-600 mt-1 font-mono break-all" dir="ltr">{l.shortUrl}</div>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        סגירה
      </button>
    </div>
  </div>
);

// ==================== MESSAGE EDITOR MODAL ====================

const MessageEditorModal: React.FC<{
  message: any;
  links: ShortLink[];
  onSave: (updated: any) => void;
  onClose: () => void;
  isTemplate?: boolean;
}> = ({ message, links, onSave, onClose, isTemplate }) => {
  const [form, setForm] = useState({ ...message });
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInsertLink = (url: string) => {
    const ta = contentRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const text = form.content || '';
      const newContent = text.substring(0, start) + url + text.substring(end);
      setForm({ ...form, content: newContent });
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + url.length, start + url.length);
      }, 50);
    } else {
      setForm({ ...form, content: (form.content || '') + '\n' + url });
    }
    setShowLinkPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">{isTemplate ? '✏️ עריכת טמפלייט' : '✏️ עריכת מסר'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם המסר</label>
              <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ערוץ</label>
              <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as Channel })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isTemplate ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">יום יחסי לאתגר</label>
                  <input type="number" value={form.relativeDay}
                    onChange={e => {
                      const day = Number(e.target.value);
                      setForm({ ...form, relativeDay: day, relativeLabel: relativeDayLabel(day) });
                    }}
                    className="w-full border rounded-lg px-3 py-2" />
                  <p className="text-xs text-gray-500 mt-1">{relativeDayLabel(form.relativeDay || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שעת שליחה</label>
                  <input type="time" value={form.sendTime || ''} onChange={e => setForm({ ...form, sendTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                  <input type="date" value={form.date || ''}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שעה</label>
                  <input type="time" value={form.sendTime || ''} onChange={e => setForm({ ...form, sendTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" />
                </div>
              </>
            )}
          </div>

          {form.channel === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שורת נושא (מייל)</label>
              <input type="text" value={form.emailSubject || ''} onChange={e => setForm({ ...form, emailSubject: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">תוכן המסר</label>
              <button onClick={() => setShowLinkPicker(true)} type="button"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50">
                🔗 הוסף לינק מהמאגר
              </button>
            </div>
            <textarea ref={contentRef} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={12} className="w-full border rounded-lg px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500" dir="rtl" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קהל יעד / רשימות</label>
            <input type="text" value={form.targetAudience || ''} onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" placeholder='לדוגמה: כל הנמענים מלבד "לא פתחו"' />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} className="w-full border rounded-lg px-3 py-2" />
          </div>

          {!isTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select value={form.status || 'draft'}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="draft">טיוטה</option>
                <option value="scheduled">מתוזמן</option>
                <option value="sent">נשלח</option>
              </select>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-2xl flex gap-3">
          <button onClick={() => onSave(form)}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            ✔ שמירה
          </button>
          <button onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            ביטול
          </button>
        </div>
      </div>
      {showLinkPicker && <LinkPickerModal links={links} onSelect={handleInsertLink} onClose={() => setShowLinkPicker(false)} />}
    </div>
  );
};

// ==================== DASHBOARD TAB ====================

const DashboardTab: React.FC<{
  challenge: Challenge | null;
  links: ShortLink[];
  onUpdateChallenge: (c: Challenge) => void;
}> = ({ challenge, links, onUpdateChallenge }) => {
  const [editingMsg, setEditingMsg] = useState<ScheduledMessage | null>(null);
  const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (!challenge) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📅</div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">אין אתגר פעיל</h2>
      <p className="text-gray-500">לכי ללשונית "הגדרות אתגר" כדי ליצור אתגר חדש</p>
    </div>
  );

  const messages = challenge.messages || [];
  const filtered = messages.filter(m => {
    if (filterChannel !== 'all' && m.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, ScheduledMessage[]>>((acc, m) => {
    const key = m.date || 'no-date';
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const handleUpdateMsg = (updated: ScheduledMessage) => {
    const newMsgs = challenge.messages.map(m => m.id === updated.id ? updated : m);
    onUpdateChallenge({ ...challenge, messages: newMsgs });
    setEditingMsg(null);
  };

  const handleDeleteMsg = (id: string) => {
    if (!confirm('למחוק את המסר?')) return;
    onUpdateChallenge({ ...challenge, messages: challenge.messages.filter(m => m.id !== id) });
  };

  const handleStatusToggle = (msg: ScheduledMessage) => {
    const order: ScheduledMessage['status'][] = ['draft', 'scheduled', 'sent'];
    const next = order[(order.indexOf(msg.status) + 1) % order.length];
    const newMsgs = challenge.messages.map(m => m.id === msg.id ? { ...m, status: next } : m);
    onUpdateChallenge({ ...challenge, messages: newMsgs });
  };

  const handleAddMessage = () => {
    const newMsg: ScheduledMessage = {
      id: genId(), name: 'מסר חדש', date: challenge.startDate,
      sendTime: '10:00', channel: 'email', emailSubject: '',
      content: '', status: 'draft', notes: '',
      relativeDay: 0, relativeLabel: 'יום 1 לאתגר',
    };
    onUpdateChallenge({ ...challenge, messages: [...challenge.messages, newMsg] });
    setEditingMsg(newMsg);
  };

  const handleMoveDate = (msg: ScheduledMessage, days: number) => {
    const newDate = addDays(msg.date, days);
    const newMsgs = challenge.messages.map(m => m.id === msg.id ? { ...m, date: newDate } : m);
    onUpdateChallenge({ ...challenge, messages: newMsgs });
  };

  const stats = {
    total: messages.length,
    sent: messages.filter(m => m.status === 'sent').length,
    scheduled: messages.filter(m => m.status === 'scheduled').length,
    draft: messages.filter(m => m.status === 'draft').length,
  };

  return (
    <div>
      <div className="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">🏆 {challenge.name}</h2>
            <p className="text-blue-100 mt-1">מתחיל: {formatDateHebrew(challenge.startDate)}</p>
          </div>
          <div className="flex gap-2 sm:gap-4 text-center flex-wrap">
            <div className="bg-white bg-opacity-20 rounded-xl px-3 sm:px-4 py-2">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-blue-100">סה"כ</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl px-3 sm:px-4 py-2">
              <div className="text-xl sm:text-2xl font-bold">{stats.sent}</div>
              <div className="text-xs text-blue-100">נשלחו</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl px-3 sm:px-4 py-2">
              <div className="text-xl sm:text-2xl font-bold">{stats.scheduled}</div>
              <div className="text-xs text-blue-100">מתוזמנים</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl px-3 sm:px-4 py-2">
              <div className="text-xl sm:text-2xl font-bold">{stats.draft}</div>
              <div className="text-xs text-blue-100">טיוטות</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={filterChannel} onChange={e => setFilterChannel(e.target.value as any)}
          className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="all">כל הערוצים</option>
          {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="all">כל הסטטוסים</option>
          <option value="draft">טיוטה</option>
          <option value="scheduled">מתוזמן</option>
          <option value="sent">נשלח</option>
        </select>
        <div className="flex-1" />
        <button onClick={handleAddMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          + הוסף מסר
        </button>
      </div>

      <div className="space-y-6">
        {sortedDates.map(date => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-bold">
                {formatDateHebrew(date)}
              </div>
              {grouped[date][0]?.relativeLabel && (
                <span className="text-sm text-gray-500">({grouped[date][0].relativeLabel})</span>
              )}
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div className="grid gap-3">
              {grouped[date].sort((a, b) => (a.sendTime || '').localeCompare(b.sendTime || '')).map(msg => (
                <div key={msg.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-bold text-gray-900">{msg.name}</span>
                        <ChannelBadge channel={msg.channel} />
                        <button onClick={() => handleStatusToggle(msg)} title="לחיצה לשינוי סטטוס">
                          <StatusBadge status={msg.status} />
                        </button>
                        <span className="text-sm text-gray-500">⏰ {msg.sendTime}</span>
                      </div>
                      {msg.channel === 'email' && msg.emailSubject && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">נושא:</span> {msg.emailSubject}
                        </div>
                      )}
                      <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                        {msg.content?.substring(0, 200)}{(msg.content?.length || 0) > 200 ? '...' : ''}
                      </div>
                      {msg.targetAudience && (
                        <div className="text-xs text-gray-500 mt-2">🎯 {msg.targetAudience}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => handleMoveDate(msg, -1)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded text-xs"
                        title="הזז יום אחורה">⬅️</button>
                      <button onClick={() => handleMoveDate(msg, 1)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded text-xs"
                        title="הזז יום קדימה">➡️</button>
                      <button onClick={() => setEditingMsg(msg)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="עריכה">✏️</button>
                      <button onClick={() => handleDeleteMsg(msg.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="מחיקה">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          לא נמצאו מסרים לפי הסינון שנבחר
        </div>
      )}

      {editingMsg && (
        <MessageEditorModal message={editingMsg} links={links}
          onSave={handleUpdateMsg} onClose={() => setEditingMsg(null)} />
      )}
    </div>
  );
};

// ==================== TEMPLATES TAB ====================

const TemplatesTab: React.FC<{
  templates: MessageTemplate[];
  links: ShortLink[];
  onUpdateTemplates: (t: MessageTemplate[]) => void;
}> = ({ templates, links, onUpdateTemplates }) => {
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');

  const filtered = templates.filter(t => filterChannel === 'all' || t.channel === filterChannel);

  const grouped = filtered.reduce<Record<number, MessageTemplate[]>>((acc, t) => {
    (acc[t.relativeDay] = acc[t.relativeDay] || []).push(t);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const handleSave = (updated: MessageTemplate) => {
    onUpdateTemplates(templates.map(t => t.id === updated.id ? updated : t));
    setEditing(null);
  };

  const handleAdd = () => {
    const newT: MessageTemplate = {
      id: genId(), name: 'טמפלייט חדש', relativeDay: -5,
      relativeLabel: '5 ימים לפני האתגר', sendTime: '10:00',
      channel: 'email', emailSubject: '', content: '', notes: '',
    };
    onUpdateTemplates([...templates, newT]);
    setEditing(newT);
  };

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את הטמפלייט?')) return;
    onUpdateTemplates(templates.filter(t => t.id !== id));
  };

  const handleDuplicate = (t: MessageTemplate) => {
    const dup = { ...t, id: genId(), name: t.name + ' (עותק)' };
    onUpdateTemplates([...templates, dup]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold">📋 מאגר טמפלייטים</h2>
        <div className="flex gap-3">
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value as any)}
            className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">כל הערוצים</option>
            {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            + טמפלייט חדש
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDays.map(day => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${day < 0 ? 'bg-orange-100 text-orange-800' : day <= 3 ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                {relativeDayLabel(day)}
              </div>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div className="grid gap-3">
              {grouped[day].sort((a, b) => (a.sendTime || '').localeCompare(b.sendTime || '')).map(tmpl => (
                <div key={tmpl.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-bold text-gray-900">{tmpl.name}</span>
                        <ChannelBadge channel={tmpl.channel} />
                        <span className="text-sm text-gray-500">⏰ {tmpl.sendTime}</span>
                      </div>
                      {tmpl.channel === 'email' && tmpl.emailSubject && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">נושא:</span> {tmpl.emailSubject}
                        </div>
                      )}
                      <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                        {tmpl.content?.substring(0, 200)}{(tmpl.content?.length || 0) > 200 ? '...' : ''}
                      </div>
                      {tmpl.targetAudience && (
                        <div className="text-xs text-gray-500 mt-2">🎯 {tmpl.targetAudience}</div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing(tmpl)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="עריכה">✏️</button>
                      <button onClick={() => handleDuplicate(tmpl)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="שכפול">📋</button>
                      <button onClick={() => handleDelete(tmpl.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="מחיקה">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <MessageEditorModal message={editing} links={links}
          onSave={handleSave} onClose={() => setEditing(null)} isTemplate />
      )}
    </div>
  );
};

// ==================== LINKS TAB ====================

const LinksTab: React.FC<{
  links: ShortLink[];
  onUpdateLinks: (l: ShortLink[]) => void;
}> = ({ links, onUpdateLinks }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAdd = () => {
    const newLink: ShortLink = { id: genId(), description: '', shortUrl: '' };
    onUpdateLinks([...links, newLink]);
    setEditingId(newLink.id);
  };

  const handleUpdate = (id: string, field: keyof ShortLink, value: string) => {
    onUpdateLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את הלינק?')) return;
    onUpdateLinks(links.filter(l => l.id !== id));
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold">🔗 מאגר לינקים מקוצרים</h2>
        <button onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          + לינק חדש
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">תיאור</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">לינק מקוצר</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">לינק סולדאאוט</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {links.map(link => (
              <tr key={link.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === link.id ? (
                    <input type="text" value={link.description}
                      onChange={e => handleUpdate(link.id, 'description', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm" autoFocus />
                  ) : (
                    <span className="font-medium">{link.description}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === link.id ? (
                    <input type="text" value={link.shortUrl} dir="ltr"
                      onChange={e => handleUpdate(link.id, 'shortUrl', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm font-mono" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-600 font-mono break-all" dir="ltr">{link.shortUrl}</span>
                      <button onClick={() => handleCopy(link.id, link.shortUrl)}
                        className="text-gray-400 hover:text-gray-600 text-xs shrink-0">
                        {copiedId === link.id ? '✔' : '📋'}
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === link.id ? (
                    <input type="text" value={link.soldOutUrl || ''} dir="ltr"
                      onChange={e => handleUpdate(link.id, 'soldOutUrl', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm font-mono" />
                  ) : (
                    link.soldOutUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-purple-600 font-mono break-all" dir="ltr">{link.soldOutUrl}</span>
                        <button onClick={() => handleCopy(link.id + 's', link.soldOutUrl!)}
                          className="text-gray-400 hover:text-gray-600 text-xs shrink-0">
                          {copiedId === link.id + 's' ? '✔' : '📋'}
                        </button>
                      </div>
                    )
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {editingId === link.id ? (
                      <button onClick={() => setEditingId(null)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="סיום">✔</button>
                    ) : (
                      <button onClick={() => setEditingId(link.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="עריכה">✏️</button>
                    )}
                    <button onClick={() => handleDelete(link.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="מחיקה">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {links.length === 0 && (
          <div className="text-center py-8 text-gray-500">אין לינקים במאגר</div>
        )}
      </div>
    </div>
  );
};

// ==================== SETTINGS TAB ====================

const SettingsTab: React.FC<{
  challenge: Challenge | null;
  templates: MessageTemplate[];
  onCreateChallenge: (name: string, date: string) => void;
  onResetData: () => void;
}> = ({ challenge, templates, onCreateChallenge, onResetData }) => {
  const [name, setName] = useState(challenge?.name || 'מהלך המיליון');
  const [date, setDate] = useState(challenge?.startDate || '');

  const previewMessages = useMemo(() => {
    if (!date) return [];
    return templates.map(t => ({
      ...t,
      actualDate: addDays(date, t.relativeDay),
      dateLabel: formatDateHebrew(addDays(date, t.relativeDay)),
    })).sort((a, b) => a.actualDate.localeCompare(b.actualDate) || a.sendTime.localeCompare(b.sendTime));
  }, [date, templates]);

  const handleCreate = () => {
    if (!name || !date) return;
    if (challenge && !confirm(`יצירת אתגר חדש תחליף את האתגר הקיים "${challenge.name}". להמשיך?`)) return;
    onCreateChallenge(name, date);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">⚙️ הגדרות אתגר חדש</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם האתגר</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="מהלך המיליון" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך תחילת האתגר (יום 1)</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-500 mt-1">כל המסרים ישובצו בתאריכים יחסיים לתאריך זה</p>
          </div>

          {date && previewMessages.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">📅 תצוגה מקדימה - שיבוץ תאריכים ({previewMessages.length} מסרים)</h3>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {previewMessages.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-blue-100 last:border-0 flex-wrap">
                    <span className="font-medium text-blue-800 w-44 shrink-0">{m.dateLabel}</span>
                    <span className="text-blue-600 w-14 shrink-0">{m.sendTime}</span>
                    <ChannelBadge channel={m.channel} />
                    <span className="text-gray-700 truncate">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleCreate} disabled={!name || !date}
            className="w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            🚀 צור אתגר ושבץ מסרים
          </button>
        </div>
      </div>

      {challenge && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 font-medium">
            ⚠️ קיים אתגר פעיל: <strong>{challenge.name}</strong> ({formatDateHebrew(challenge.startDate)})
          </p>
        </div>
      )}

      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="font-bold text-red-900 mb-2">⚠️ איפוס נתונים</h3>
        <p className="text-sm text-red-700 mb-3">איפוס יחזיר את כל הטמפלייטים והלינקים למצב הראשוני וימחק את האתגר הפעיל.</p>
        <button onClick={() => { if (confirm('בטוח? כל הנתונים יאפסו!')) onResetData(); }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
          איפוס כל הנתונים
        </button>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => loadState('mm_templates', DEFAULT_TEMPLATES));
  const [links, setLinks] = useState<ShortLink[]>(() => loadState('mm_links', DEFAULT_LINKS));
  const [challenge, setChallenge] = useState<Challenge | null>(() => loadState('mm_challenge', null));

  useEffect(() => { saveState('mm_templates', templates); }, [templates]);
  useEffect(() => { saveState('mm_links', links); }, [links]);
  useEffect(() => { saveState('mm_challenge', challenge); }, [challenge]);

  const handleCreateChallenge = useCallback((name: string, startDate: string) => {
    const messages: ScheduledMessage[] = templates.map(t => ({
      id: genId(),
      templateId: t.id,
      name: t.name,
      date: addDays(startDate, t.relativeDay),
      sendTime: t.sendTime,
      channel: t.channel,
      emailSubject: t.emailSubject,
      content: t.content,
      status: 'draft' as const,
      notes: t.notes,
      relativeDay: t.relativeDay,
      relativeLabel: t.relativeLabel || relativeDayLabel(t.relativeDay),
      targetAudience: t.targetAudience,
    }));

    const newChallenge: Challenge = {
      id: genId(), name, startDate, messages,
    };

    setChallenge(newChallenge);
    setTab('dashboard');
  }, [templates]);

  const handleResetData = () => {
    setTemplates(DEFAULT_TEMPLATES);
    setLinks(DEFAULT_LINKS);
    setChallenge(null);
    setTab('settings');
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'לוח מסרים', icon: '📊' },
    { key: 'templates', label: 'טמפלייטים', icon: '📋' },
    { key: 'links', label: 'לינקים', icon: '🔗' },
    { key: 'settings', label: 'הגדרות', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 flex-wrap gap-2">
            <h1 className="text-xl font-bold text-gray-900">📨 מנהל מסרים שיווקיים</h1>
            <nav className="flex gap-1 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'dashboard' && (
          <DashboardTab challenge={challenge} links={links} onUpdateChallenge={setChallenge} />
        )}
        {tab === 'templates' && (
          <TemplatesTab templates={templates} links={links} onUpdateTemplates={setTemplates} />
        )}
        {tab === 'links' && (
          <LinksTab links={links} onUpdateLinks={setLinks} />
        )}
        {tab === 'settings' && (
          <SettingsTab challenge={challenge} templates={templates}
            onCreateChallenge={handleCreateChallenge} onResetData={handleResetData} />
        )}
      </div>
    </div>
  );
};

export default App;
