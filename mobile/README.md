# ناصر سوفت — تطبيق Android الأصلي

هذا مجلد تطبيق Flutter مستقل، وليس نسخة PWA. التخزين الأساسي قاعدة SQLite داخل مساحة التطبيق الخاصة على الجهاز، ولا يحتاج التطبيق إلى اتصال بالإنترنت لإدارة البيانات المحلية.

## المتطلبات
- Flutter stable (Dart 3.4 أو أحدث)
- Android SDK / Android Studio

## إنشاء ملفات منصة Android أول مرة
من هذا المجلد نفّذ:

```bash
flutter create --platforms=android --org com.nassersoft --project-name nasser_soft .
flutter pub get
flutter analyze
flutter build apk --release
```

أو شغّل `tool/bootstrap_android.sh` من جذر المستودع.

## بناء APK
```bash
cd mobile
flutter pub get
flutter build apk --release
```
المسار الناتج: `build/app/outputs/flutter-apk/app-release.apk`.

## البيانات
- SQLite: `nasser_soft.db`
- جداول: الحسابات، الأطراف، الأصناف، الموظفون، الفواتير، تفاصيل الفواتير، قيود اليومية، سطور القيود، الإعدادات، والعملات.
- البيع والشراء ينفذان داخل معاملة SQLite واحدة مع تحديث المخزون وإنشاء القيد المحاسبي.
- النسخ الاحتياطي JSON والاستعادة متاحان من الشاشة الرئيسية.

## ملاحظات الإصدار الأول
هذه قاعدة محلية على جهاز واحد. لم تُربط المزامنة السحابية أو تسجيل الدخول أو الطباعة الحرارية بعد. لا تنقل ملف قاعدة البيانات أو تحذفه قبل أخذ نسخة احتياطية. يلزم اختبار APK على أجهزة فعلية ومراجعة دورة المخزون والحسابات قبل استخدامه في المحاسبة الإنتاجية.
