import 'package:flutter_test/flutter_test.dart';
import 'package:nasser_soft/database/app_database.dart';

void main() {
  test('database singleton is available', () {
    expect(AppDatabase.instance, isNotNull);
  });
}
