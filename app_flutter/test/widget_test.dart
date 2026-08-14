import 'package:donapp_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('muestra la pantalla de conexion con la API', (tester) async {
    await tester.pumpWidget(const DonApp());

    expect(find.text('DonApp'), findsOneWidget);
    expect(find.text('Conexión con API'), findsOneWidget);
    expect(find.text('Probar conexión'), findsOneWidget);
  });
}
