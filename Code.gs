/**
 * كود Google Apps Script لتخزين بيانات تطبيق "بيان احتياجات القديسين 2026" على Google Drive.
 *
 * طريقة الاستخدام (خطوة بخطوة بالعربي في ملف README.md المرفق):
 * 1) اذهب إلى script.google.com وأنشئ مشروعًا جديدًا (New project).
 * 2) امسح الكود الموجود، وألصق هذا الكود بالكامل بدلاً منه.
 * 3) من زر Deploy > New deployment، اختر النوع Web app.
 *    - Execute as: Me (حسابك أنت)
 *    - Who has access: Anyone (أو Anyone with Google account لو حابب تقييدها أكتر)
 * 4) اضغط Deploy، واسمح بالصلاحيات المطلوبة (سيطلب صلاحية الوصول إلى Drive الخاص بك).
 * 5) انسخ الرابط الناتج (ينتهي بـ /exec) والصقه داخل شاشة "الإعدادات" في التطبيق.
 *
 * الكود بيعمل ملف JSON واحد باسم "بيان_احتياجات_القديسين_2026_data.json"
 * داخل مجلد Drive الرئيسي الخاص بحسابك، ويقرأ منه ويكتب فيه.
 */

var FILE_NAME = 'بيان_احتياجات_القديسين_2026_data.json';

function doGet(e) {
  var file = getOrCreateFile_();
  var content = file.getBlob().getDataAsString('UTF-8');
  return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var file = getOrCreateFile_();
  var body = e.postData && e.postData.contents ? e.postData.contents : '{}';
  // تأكيد أن المحتوى الوارد نص JSON صالح قبل الحفظ، حتى لا يُفسد الملف عند خطأ في الاتصال.
  try {
    JSON.parse(body);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'invalid json' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  file.setContent(body);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFile_() {
  var props = PropertiesService.getScriptProperties();
  var fileId = props.getProperty('DATA_FILE_ID');

  if (fileId) {
    try {
      return DriveApp.getFileById(fileId);
    } catch (err) {
      // الملف اتحذف أو الـ ID بقى غير صالح، هننشئ ملف جديد تحت.
    }
  }

  // لو موجود ملف بنفس الاسم من قبل (مثلاً من نسخة سابقة)، استخدمه بدل ما تنشئ واحد جديد.
  var existing = DriveApp.getFilesByName(FILE_NAME);
  if (existing.hasNext()) {
    var found = existing.next();
    props.setProperty('DATA_FILE_ID', found.getId());
    return found;
  }

  var file = DriveApp.createFile(FILE_NAME, '{}', MimeType.PLAIN_TEXT);
  props.setProperty('DATA_FILE_ID', file.getId());
  return file;
}
