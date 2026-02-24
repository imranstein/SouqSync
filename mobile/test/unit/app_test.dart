import 'package:flutter_test/flutter_test.dart';
import 'package:souksync_mobile/app.dart';

void main() {
  testWidgets('SoukSyncApp renders', (WidgetTester tester) async {
    await tester.pumpWidget(const SoukSyncApp());
    expect(find.text('SoukSync'), findsOneWidget);
  });
}
