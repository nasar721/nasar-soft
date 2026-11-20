import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

class AppDatabase {
  AppDatabase._();
  static final AppDatabase instance = AppDatabase._();
  Database? _db;
  Future<Database> get database async {
    if (_db != null) return _db!;
    final root = await getDatabasesPath();
    _db = await openDatabase(
      p.join(root, 'nasser_soft.db'),
      version: 1,
      onConfigure: (db) async {
        await db.execute('PRAGMA foreign_keys = ON');
        await db.execute('PRAGMA journal_mode = WAL');
      },
      onCreate: _create,
    );
    return _db!;
  }

  Future<void> _create(Database db, int version) async {
    await db.execute('''CREATE TABLE accounts(
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL
    )''');
    await db.execute('''CREATE TABLE parties(
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      initial_balance REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    )''');
    await db.execute('''CREATE TABLE products(
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '', price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0, quantity REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )''');
    await db.execute('''CREATE TABLE employees(
      id TEXT PRIMARY KEY, name TEXT NOT NULL, position TEXT NOT NULL DEFAULT '',
      salary REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active'
    )''');
    await db.execute('''CREATE TABLE invoices(
      id TEXT PRIMARY KEY, number TEXT NOT NULL, type TEXT NOT NULL,
      date TEXT NOT NULL, party_id TEXT, party_name TEXT NOT NULL,
      subtotal REAL NOT NULL, tax REAL NOT NULL, total_discount REAL NOT NULL,
      total REAL NOT NULL, paid_amount REAL NOT NULL, balance_amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash', notes TEXT NOT NULL DEFAULT ''
    )''');
    await db.execute('''CREATE TABLE invoice_items(
      id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL, name TEXT NOT NULL, quantity REAL NOT NULL,
      price REAL NOT NULL, tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL
    )''');
    await db.execute('''CREATE TABLE journal_headers(
      id TEXT PRIMARY KEY, date TEXT NOT NULL, description TEXT NOT NULL,
      tx_type TEXT NOT NULL, party_id TEXT, invoice_id TEXT
    )''');
    await db.execute('''CREATE TABLE journal_lines(
      id TEXT PRIMARY KEY, header_id TEXT NOT NULL REFERENCES journal_headers(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL, debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT ''
    )''');
    await db.execute('''CREATE TABLE settings(
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    )''');
    await db.execute('''CREATE TABLE currencies(
      code TEXT PRIMARY KEY, name TEXT NOT NULL, rate REAL NOT NULL DEFAULT 1
    )''');
    final accounts = [
      ['acc_cash','الخزينة','ASSET'], ['acc_bank','البنك والتحويلات','ASSET'],
      ['acc_inventory','المخزون','ASSET'], ['acc_receivable','العملاء - ذمم مدينة','ASSET'],
      ['acc_payable','الموردون - ذمم دائنة','LIABILITY'], ['acc_sales','المبيعات','INCOME'],
      ['acc_cost_sales','تكلفة المبيعات','EXPENSE'], ['acc_vat_out','ضريبة المخرجات','LIABILITY'],
      ['acc_vat_in','ضريبة المدخلات','ASSET'], ['acc_purchases','المشتريات','EXPENSE'],
      ['acc_other_exp','مصروفات أخرى','EXPENSE'], ['acc_equity','رأس المال','EQUITY']
    ];
    final batch = db.batch();
    for (final a in accounts) {
      batch.insert('accounts', {'id':a[0], 'name':a[1], 'type':a[2]});
    }
    batch.insert('currencies', {'code':'YER','name':'ريال يمني','rate':1});
    batch.insert('currencies', {'code':'SAR','name':'ريال سعودي','rate':1});
    batch.insert('currencies', {'code':'USD','name':'دولار أمريكي','rate':1});
    batch.insert('settings', {'key':'company_name','value':'ناصر سوفت'});
    batch.insert('settings', {'key':'currency','value':'YER'});
    await batch.commit(noResult: true);
  }

  String id() => DateTime.now().microsecondsSinceEpoch.toString();

  Future<List<Map<String,Object?>>> rows(String table, {String? orderBy}) async =>
      (await database).query(table, orderBy: orderBy);
  Future<int> addProduct(Map<String,Object?> row) async {
    final db = await database;
    return db.transaction((txn) async {
      final result = await txn.insert('products', row);
      final openingValue = ((row['quantity'] as num?)?.toDouble() ?? 0) * ((row['cost'] as num?)?.toDouble() ?? 0);
      if (openingValue > 0) {
        final header = 'h_open_${row['id']}';
        await txn.insert('journal_headers', {'id':header,'date':DateTime.now().toIso8601String(),'description':'رصيد مخزون افتتاحي: ${row['name']}','tx_type':'INITIAL'});
        await txn.insert('journal_lines', {'id':'${header}_1','header_id':header,'account_id':'acc_inventory','debit':openingValue,'credit':0,'note':'إثبات قيمة المخزون الافتتاحي'});
        await txn.insert('journal_lines', {'id':'${header}_2','header_id':header,'account_id':'acc_equity','debit':0,'credit':openingValue,'note':'مقابل رصيد المخزون الافتتاحي'});
      }
      return result;
    });
  }
  Future<int> addParty(Map<String,Object?> row) async {
    final db = await database;
    return db.transaction((txn) async {
      final result = await txn.insert('parties', row);
      final opening = (row['initial_balance'] as num?)?.toDouble() ?? 0;
      if (opening > 0) {
        final customer = row['type'] == 'CUSTOMER';
        final header = 'h_party_${row['id']}';
        await txn.insert('journal_headers', {'id':header,'date':DateTime.now().toIso8601String(),'description':'رصيد افتتاحي طرف: ${row['name']}','tx_type':'INITIAL','party_id':row['id']});
        await txn.insert('journal_lines', {'id':'${header}_1','header_id':header,'account_id':customer?'acc_receivable':'acc_equity','debit':opening,'credit':0,'note':'إثبات الرصيد الافتتاحي'});
        await txn.insert('journal_lines', {'id':'${header}_2','header_id':header,'account_id':customer?'acc_equity':'acc_payable','debit':0,'credit':opening,'note':'مقابل الرصيد الافتتاحي'});
      }
      return result;
    });
  }
  Future<int> addEmployee(Map<String,Object?> row) async => (await database).insert('employees', row);

  Future<void> createInvoice({
    required String type, required String partyName, String? partyId,
    required List<Map<String,dynamic>> items, required double paid,
    double taxRate = 0, String paymentMethod = 'cash', String notes = '',
  }) async {
    if (items.isEmpty) throw Exception('أضف صنفاً واحداً على الأقل');
    final db = await database;
    await db.transaction((txn) async {
      double subtotal = 0, discount = 0, tax = 0;
      final normalized = <Map<String,dynamic>>[];
      for (final item in items) {
        final matches = await txn.query('products', where:'id = ?', whereArgs:[item['product_id']], limit:1);
        final product = matches.isEmpty ? null : matches.first;
        if (product == null) throw Exception('أحد الأصناف غير موجود');
        final qty = (item['quantity'] as num).toDouble();
        final price = (item['price'] as num).toDouble();
        if (qty <= 0 || price < 0) throw Exception('تحقق من الكمية والسعر');
        if (type == 'SALE' && (product['quantity'] as num) < qty) {
          throw Exception('الكمية المتاحة من ${product['name']} غير كافية');
        }
        final lineDiscount = ((item['discount'] ?? 0) as num).toDouble();
        final base = qty * price;
        final lineTax = ((base - lineDiscount) * taxRate / 100);
        final lineTotal = base - lineDiscount + lineTax;
        subtotal += base; discount += lineDiscount; tax += lineTax;
        normalized.add({'product':product,'qty':qty,'price':price,'discount':lineDiscount,'tax':lineTax,'total':lineTotal});
      }
      final total = subtotal - discount + tax;
      if (paid < 0 || paid > total) throw Exception('المبلغ المدفوع غير صحيح');
      final balance = total - paid;
      final invoiceId = id(), headerId = 'h_$invoiceId';
      final number = 'INV-${DateTime.now().millisecondsSinceEpoch}';
      await txn.insert('invoices', {
        'id':invoiceId,'number':number,'type':type,'date':DateTime.now().toIso8601String(),
        'party_id':partyId,'party_name':partyName,'subtotal':subtotal,'tax':tax,
        'total_discount':discount,'total':total,'paid_amount':paid,'balance_amount':balance,
        'payment_method':paymentMethod,'notes':notes
      });
      final journal = <Map<String,Object?>>[];
      var lineNo = 0;
      void line(String account,double debit,double credit,String note) {
        journal.add({'id':'${headerId}_${lineNo++}','header_id':headerId,'account_id':account,'debit':debit,'credit':credit,'note':note});
      }
      if (type == 'SALE') {
        if (paid > 0) line('acc_cash',paid,0,'المقبوض من الفاتورة');
        if (balance > 0) line('acc_receivable',balance,0,'المتبقي على العميل');
        line('acc_sales',0,subtotal-discount,'صافي المبيعات');
        if (tax > 0) line('acc_vat_out',0,tax,'ضريبة المخرجات');
        double cogs = 0;
        for (final n in normalized) {
          final product = n['product'] as Map<String,Object?>;
          final qty = n['qty'] as double;
          cogs += (product['cost'] as num).toDouble() * qty;
          await txn.update('products', {'quantity':(product['quantity'] as num).toDouble()-qty}, where:'id = ?', whereArgs:[product['id']]);
        }
        if (cogs > 0) { line('acc_cost_sales',cogs,0,'تكلفة البضاعة المباعة'); line('acc_inventory',0,cogs,'صرف من المخزون'); }
      } else {
        line('acc_inventory',subtotal-discount,0,'إضافة للمخزون');
        if (tax > 0) line('acc_vat_in',tax,0,'ضريبة المدخلات');
        if (paid > 0) line('acc_cash',0,paid,'المدفوع للمورد');
        if (balance > 0) line('acc_payable',0,balance,'المتبقي للمورد');
        for (final n in normalized) {
          final product = n['product'] as Map<String,Object?>;
          final oldQty = (product['quantity'] as num).toDouble();
          final oldCost = (product['cost'] as num).toDouble();
          final qty = n['qty'] as double, price = n['price'] as double;
          final newQty = oldQty + qty;
          final avg = newQty == 0 ? price : ((oldQty*oldCost)+(qty*price))/newQty;
          await txn.update('products', {'quantity':newQty,'cost':avg}, where:'id = ?', whereArgs:[product['id']]);
        }
      }
      await txn.insert('journal_headers', {'id':headerId,'date':DateTime.now().toIso8601String(),'description':'فاتورة ${type == 'SALE' ? 'مبيعات' : 'مشتريات'} $number','tx_type':type,'party_id':partyId,'invoice_id':invoiceId});
      for (final l in journal) { await txn.insert('journal_lines',l); }
      for (var i=0;i<normalized.length;i++) {
        final n=normalized[i];
        await txn.insert('invoice_items', {'id':'${invoiceId}_$i','invoice_id':invoiceId,'product_id':(n['product'] as Map)['id'],'name':(n['product'] as Map)['name'],'quantity':n['qty'],'price':n['price'],'tax_rate':taxRate,'tax_amount':n['tax'],'discount':n['discount'],'total':n['total']});
      }
    });
  }

  Future<Map<String,dynamic>> dashboard() async {
    final db = await database;
    final income = await db.rawQuery("SELECT COALESCE(SUM(credit-debit),0) v FROM journal_lines WHERE account_id='acc_sales'");
    final expenses = await db.rawQuery("SELECT COALESCE(SUM(debit-credit),0) v FROM journal_lines WHERE account_id IN ('acc_cost_sales','acc_other_exp','acc_purchases')");
    final stock = await db.rawQuery('SELECT COALESCE(SUM(quantity*cost),0) v FROM products');
    final receivable = await db.rawQuery("SELECT COALESCE((SELECT SUM(balance_amount) FROM invoices WHERE type='SALE'),0) + COALESCE((SELECT SUM(initial_balance) FROM parties WHERE type='CUSTOMER'),0) v");
    final payable = await db.rawQuery("SELECT COALESCE((SELECT SUM(balance_amount) FROM invoices WHERE type='SUPPLY'),0) + COALESCE((SELECT SUM(initial_balance) FROM parties WHERE type='SUPPLIER'),0) v");
    final count = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM invoices')) ?? 0;
    double v(List<Map<String,Object?>> x) => (x.first['v'] as num).toDouble();
    return {'income':v(income),'expenses':v(expenses),'profit':v(income)-v(expenses),'stock':v(stock),'receivable':v(receivable),'payable':v(payable),'invoices':count};
  }

  Future<Map<String,dynamic>> exportAll() async {
    final db = await database;
    final result = <String,dynamic>{'format':'nasser-soft-sqlite-backup','version':1,'createdAt':DateTime.now().toIso8601String()};
    for (final table in ['accounts','parties','products','employees','invoices','invoice_items','journal_headers','journal_lines','settings','currencies']) {
      result[table] = await db.query(table);
    }
    return result;
  }

  Future<void> importAll(Map<String,dynamic> data) async {
    if (data['format'] != 'nasser-soft-sqlite-backup' || data['version'] != 1) throw Exception('ملف النسخة الاحتياطية غير مدعوم');
    final db = await database;
    final tables = ['journal_lines','journal_headers','invoice_items','invoices','employees','products','parties','accounts','currencies','settings'];
    await db.transaction((txn) async {
      for (final table in tables) { await txn.delete(table); }
      for (final table in tables.reversed) {
        final list = data[table];
        if (list is List) {
          for (final row in list) { await txn.insert(table, Map<String,Object?>.from(row as Map)); }
        }
      }
    });
  }

  Future<List<Map<String,Object?>>> invoiceItems(String id) async =>
      (await database).query('invoice_items', where:'invoice_id = ?', whereArgs:[id]);
}
