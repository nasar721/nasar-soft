import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'database/app_database.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Intl.defaultLocale = 'ar';
  runApp(const NasserSoftApp());
}

class NasserSoftApp extends StatelessWidget {
  const NasserSoftApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'ناصر سوفت',
    debugShowCheckedModeBanner: false,
    locale: const Locale('ar'),
    supportedLocales: const [Locale('ar'), Locale('en')],
    localizationsDelegates: const [GlobalMaterialLocalizations.delegate,GlobalWidgetsLocalizations.delegate,GlobalCupertinoLocalizations.delegate],
    theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff1457a6)),useMaterial3:true,scaffoldBackgroundColor:const Color(0xfff5f7fb),inputDecorationTheme:const InputDecorationTheme(border:OutlineInputBorder(),filled:true,fillColor:Colors.white)),
    home: const HomePage(),
  );
}

String money(Object? value) => NumberFormat('#,##0.##').format((value as num?)?.toDouble() ?? 0);
String newId() => DateTime.now().microsecondsSinceEpoch.toString();

class HomePage extends StatefulWidget { const HomePage({super.key}); @override State<HomePage> createState()=>_HomePageState(); }
class _HomePageState extends State<HomePage> {
  int tab=0;
  final db=AppDatabase.instance;
  Map<String,dynamic> stats={};
  List<Map<String,Object?>> products=[],parties=[],invoices=[];
  bool loading=true;
  @override void initState(){super.initState();refresh();}
  Future<void> refresh() async {
    final s=await db.dashboard(), p=await db.rows('products',orderBy:'name'), a=await db.rows('parties',orderBy:'name'), i=await db.rows('invoices',orderBy:'date DESC');
    if(!mounted)return; setState(()=>{stats=s,products=p,parties=a,invoices=i,loading=false});
  }
  @override Widget build(BuildContext context) {
    final pages=[dashboard(),invoicePage(),productPage(),partyPage(),reportPage()];
    return Directionality(textDirection:TextDirection.rtl,child:Scaffold(
      appBar:AppBar(title:const Text('ناصر سوفت',style:TextStyle(fontWeight:FontWeight.bold)),backgroundColor:Colors.white,actions:[IconButton(tooltip:'تحديث',onPressed:refresh,icon:const Icon(Icons.refresh))]),
      body:loading?const Center(child:CircularProgressIndicator()):IndexedStack(index:tab,children:pages),
      floatingActionButton:tab==1?FloatingActionButton.extended(onPressed:()=>newInvoice(),icon:const Icon(Icons.add),label:const Text('فاتورة جديدة')):tab==2?FloatingActionButton.extended(onPressed:()=>editProduct(),icon:const Icon(Icons.add),label:const Text('صنف جديد')):tab==3?FloatingActionButton.extended(onPressed:()=>editParty(),icon:const Icon(Icons.add),label:const Text('طرف جديد')):null,
      bottomNavigationBar:NavigationBar(selectedIndex:tab,onDestinationSelected:(v)=>setState(()=>tab=v),destinations:const [
        NavigationDestination(icon:Icon(Icons.dashboard_outlined),selectedIcon:Icon(Icons.dashboard),label:'الرئيسية'),
        NavigationDestination(icon:Icon(Icons.receipt_long_outlined),label:'الفواتير'),
        NavigationDestination(icon:Icon(Icons.inventory_2_outlined),label:'المخزون'),
        NavigationDestination(icon:Icon(Icons.people_outline),label:'الأطراف'),
        NavigationDestination(icon:Icon(Icons.analytics_outlined),label:'التقارير'),
      ]),
    ));
  }
  Widget dashboard()=>RefreshIndicator(onRefresh:refresh,child:ListView(padding:const EdgeInsets.all(16),children:[
    Container(padding:const EdgeInsets.all(20),decoration:BoxDecoration(color:const Color(0xff1457a6),borderRadius:BorderRadius.circular(20)),child:const Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('إدارة أعمالك في مكان واحد',style:TextStyle(color:Colors.white,fontSize:20,fontWeight:FontWeight.bold)),SizedBox(height:6),Text('يعمل محلياً دون الحاجة إلى الإنترنت',style:TextStyle(color:Colors.white70))])),
    const SizedBox(height:16),Wrap(spacing:10,runSpacing:10,children:[
      metric('إجمالي المبيعات',stats['income'],'payments',Colors.green),metric('المصروفات والتكلفة',stats['expenses'],'trending_down',Colors.deepOrange),
      metric('صافي الربح',stats['profit'],'account_balance_wallet',Colors.blue),metric('قيمة المخزون',stats['stock'],'inventory_2',Colors.purple),
      metric('ذمم العملاء',stats['receivable'],'person',Colors.teal),metric('ذمم الموردين',stats['payable'],'store',Colors.brown),
    ]),
    const SizedBox(height:18),Text('آخر الفواتير • ${stats['invoices']??0}',style:const TextStyle(fontSize:18,fontWeight:FontWeight.bold)),
    ...invoices.take(5).map((i)=>Card(child:ListTile(leading:CircleAvatar(child:Icon(i['type']=='SALE'?Icons.south_west:Icons.north_east)),title:Text('${i['number']} • ${i['party_name']}'),subtitle:Text(i['date'].toString().substring(0,10)),trailing:Text(money(i['total']))))),
    const SizedBox(height:20),OutlinedButton.icon(onPressed:backup,icon:const Icon(Icons.backup),label:const Text('نسخ احتياطي واستعادة')),
  ]));
  Widget metric(String title,Object? value,String icon,Color color)=>SizedBox(width:(MediaQuery.of(context).size.width-42)/2,child:Card(child:Padding(padding:const EdgeInsets.all(14),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Icon(icon=='payments'?Icons.payments:icon=='trending_down'?Icons.trending_down:icon=='account_balance_wallet'?Icons.account_balance_wallet:icon=='inventory_2'?Icons.inventory_2:icon=='person'?Icons.person:Icons.store,color:color),const SizedBox(height:8),Text(title,style:const TextStyle(color:Colors.black54,fontSize:12)),const SizedBox(height:4),Text(money(value),style:const TextStyle(fontWeight:FontWeight.bold,fontSize:18))]))));
  Widget invoicePage()=>ListView(padding:const EdgeInsets.all(12),children:invoices.isEmpty?[const Center(child:Padding(padding:EdgeInsets.all(40),child:Text('لا توجد فواتير بعد'))]:invoices.map((i)=>Card(child:ListTile(leading:Icon(i['type']=='SALE'?Icons.point_of_sale:Icons.shopping_cart,color:i['type']=='SALE'?Colors.green:Colors.orange),title:Text('${i['number']} • ${i['party_name']}'),subtitle:Text('${i['type']=='SALE'?'مبيعات':'مشتريات'} | متبقي: ${money(i['balance_amount'])}'),trailing:Text(money(i['total']),style:const TextStyle(fontWeight:FontWeight.bold))))).toList());
  Widget productPage()=>ListView(padding:const EdgeInsets.all(12),children:products.isEmpty?[const Center(child:Padding(padding:EdgeInsets.all(40),child:Text('لا توجد أصناف. أضف أول صنف.'))]:products.map((p)=>Card(child:ListTile(leading:const CircleAvatar(child:Icon(Icons.inventory_2)),title:Text('${p['name']}'),subtitle:Text('كود: ${p['sku']} • تكلفة: ${money(p['cost'])}'),trailing:Column(mainAxisAlignment:MainAxisAlignment.center,children:[Text('الكمية'),Text(money(p['quantity']),style:const TextStyle(fontWeight:FontWeight.bold))])))).toList());
  Widget partyPage()=>ListView(padding:const EdgeInsets.all(12),children:parties.isEmpty?[const Center(child:Padding(padding:EdgeInsets.all(40),child:Text('لا يوجد عملاء أو موردون بعد'))]:parties.map((p)=>Card(child:ListTile(leading:const CircleAvatar(child:Icon(Icons.person)),title:Text('${p['name']}'),subtitle:Text('${p['type']=='CUSTOMER'?'عميل':'مورد'} • ${p['phone']}'),trailing:Text(money(p['initial_balance']))))).toList());
  Widget reportPage()=>ListView(padding:const EdgeInsets.all(16),children:[const Text('ملخص الحسابات',style:TextStyle(fontSize:20,fontWeight:FontWeight.bold)),for(final e in {'المبيعات':stats['income'],'التكاليف والمصروفات':stats['expenses'],'صافي الربح':stats['profit'],'قيمة المخزون':stats['stock'],'مستحقات العملاء':stats['receivable'],'مستحقات الموردين':stats['payable']}.entries)Card(child:ListTile(title:Text(e.key),trailing:Text(money(e.value),style:const TextStyle(fontWeight:FontWeight.bold))))]);
  Future<void> editProduct() async {
    final name=TextEditingController(),sku=TextEditingController(),category=TextEditingController(),price=TextEditingController(),cost=TextEditingController(),qty=TextEditingController();
    final ok=await showDialog<bool>(context:context,builder:(c)=>AlertDialog(title:const Text('إضافة صنف'),content:SingleChildScrollView(child:Column(mainAxisSize:MainAxisSize.min,children:[field(name,'اسم الصنف'),field(sku,'الباركود / SKU'),field(category,'التصنيف'),field(price,'سعر البيع',number:true),field(cost,'التكلفة',number:true),field(qty,'الكمية الافتتاحية',number:true)])),actions:[TextButton(onPressed:()=>Navigator.pop(c,false),child:const Text('إلغاء')),FilledButton(onPressed:()=>Navigator.pop(c,true),child:const Text('حفظ'))]));
    if(ok==true&&name.text.trim().isNotEmpty){await db.addProduct({'id':newId(),'name':name.text.trim(),'sku':sku.text,'category':category.text,'price':double.tryParse(price.text)??0,'cost':double.tryParse(cost.text)??0,'quantity':double.tryParse(qty.text)??0,'created_at':DateTime.now().toIso8601String()});await refresh();}
  }
  Future<void> editParty() async {
    final name=TextEditingController(),phone=TextEditingController(),address=TextEditingController(),balance=TextEditingController();
    String type='CUSTOMER';
    final ok=await showDialog<bool>(context:context,builder:(c)=>StatefulBuilder(builder:(c,set)=>AlertDialog(title:const Text('إضافة عميل أو مورد'),content:SingleChildScrollView(child:Column(mainAxisSize:MainAxisSize.min,children:[field(name,'الاسم'),DropdownButtonFormField<String>(value:type,decoration:const InputDecoration(labelText:'النوع'),items:const [DropdownMenuItem(value:'CUSTOMER',child:Text('عميل')),DropdownMenuItem(value:'SUPPLIER',child:Text('مورد'))],onChanged:(v)=>set(()=>type=v??'CUSTOMER')),field(phone,'الهاتف'),field(address,'العنوان'),field(balance,'الرصيد الافتتاحي',number:true)])),actions:[TextButton(onPressed:()=>Navigator.pop(c,false),child:const Text('إلغاء')),FilledButton(onPressed:()=>Navigator.pop(c,true),child:const Text('حفظ'))])));
    if(ok==true&&name.text.trim().isNotEmpty){await db.addParty({'id':newId(),'name':name.text.trim(),'type':type,'phone':phone.text,'address':address.text,'initial_balance':double.tryParse(balance.text)??0,'created_at':DateTime.now().toIso8601String()});await refresh();}
  }
  Widget field(TextEditingController c,String label,{bool number=false})=>Padding(padding:const EdgeInsets.only(bottom:10),child:TextField(controller:c,keyboardType:number?const TextInputType.numberWithOptions(decimal:true):TextInputType.text,decoration:InputDecoration(labelText:label)));
  Future<void> newInvoice() async {
    if(products.isEmpty){ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('أضف صنفاً للمخزون أولاً')));return;}
    String type='SALE',party='',selected=products.first['id'].toString(); final qty=TextEditingController(text:'1'),paid=TextEditingController(text:'0'),tax=TextEditingController(text:'0');
    final chosen=<Map<String,dynamic>>[];
    final ok=await showDialog<bool>(context:context,builder:(c)=>StatefulBuilder(builder:(c,set)=>AlertDialog(title:const Text('إنشاء فاتورة'),content:SingleChildScrollView(child:Column(mainAxisSize:MainAxisSize.min,children:[
      DropdownButtonFormField<String>(value:type,decoration:const InputDecoration(labelText:'نوع الفاتورة'),items:const [DropdownMenuItem(value:'SALE',child:Text('مبيعات')),DropdownMenuItem(value:'SUPPLY',child:Text('مشتريات'))],onChanged:(v)=>set(()=>type=v??'SALE')),
      field(TextEditingController(text:party),'اسم العميل / المورد'),
      DropdownButtonFormField<String>(value:selected,decoration:const InputDecoration(labelText:'الصنف'),items:products.map((p)=>DropdownMenuItem(value:p['id'].toString(),child:Text('${p['name']} • ${money(p['price'])}'))).toList(),onChanged:(v)=>set(()=>selected=v??selected)),
      field(qty,'الكمية',number:true),field(tax,'الضريبة %',number:true),field(paid,'المبلغ المدفوع',number:true),
      OutlinedButton.icon(onPressed:(){final p=products.firstWhere((x)=>x['id']==selected);chosen.add({'product_id':selected,'quantity':double.tryParse(qty.text)??1,'price':(p['price'] as num).toDouble(),'discount':0});ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('تمت إضافة الصنف للفاتورة')));},icon:const Icon(Icons.add),label:const Text('إضافة الصنف المحدد')),
      Text('الأصناف المضافة: ${chosen.length}')
    ])),actions:[TextButton(onPressed:()=>Navigator.pop(c,false),child:const Text('إلغاء')),FilledButton(onPressed:()=>Navigator.pop(c,true),child:const Text('حفظ الفاتورة'))])));
    if(ok==true&&chosen.isNotEmpty){try{await db.createInvoice(type:type,partyName:party.trim().isEmpty?(type=='SALE'?'عميل نقدي':'مورد'):party.trim(),items:chosen,paid:double.tryParse(paid.text)??0,taxRate:double.tryParse(tax.text)??0);await refresh();if(mounted)ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('تم حفظ الفاتورة والقيد المحاسبي')));}catch(e){if(mounted)ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(e.toString())));}}
  }
  Future<void> backup() async {
    final action=await showModalBottomSheet<String>(context:context,builder:(c)=>SafeArea(child:Column(mainAxisSize:MainAxisSize.min,children:[ListTile(leading:const Icon(Icons.upload_file),title:const Text('إنشاء نسخة احتياطية'),onTap:()=>Navigator.pop(c,'export')),ListTile(leading:const Icon(Icons.restore),title:const Text('استعادة نسخة احتياطية'),onTap:()=>Navigator.pop(c,'import'))])));
    if(action=='export'){
      final data=await db.exportAll(),dir=await getTemporaryDirectory(),file=File('${dir.path}/nasser-soft-backup.json');
      await file.writeAsString(const JsonEncoder.withIndent('  ').convert(data));
      await Share.shareXFiles([XFile(file.path)],text:'نسخة احتياطية من ناصر سوفت');
    } else if(action=='import'){
      final result=await FilePicker.platform.pickFiles(type:FileType.custom,allowedExtensions:['json'],withData:true);
      if(result!=null){try{final bytes=result.files.single.bytes??await File(result.files.single.path!).readAsBytes();await db.importAll(jsonDecode(utf8.decode(bytes)) as Map<String,dynamic>);await refresh();if(mounted)ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('تمت استعادة النسخة الاحتياطية')));}catch(e){if(mounted)ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text('فشلت الاستعادة: $e')));}}
    }
  }
}
