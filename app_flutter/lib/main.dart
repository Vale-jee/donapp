import 'package:flutter/material.dart';

import 'models/category.dart';
import 'services/category_service.dart';

void main() => runApp(const DonApp());

class DonApp extends StatelessWidget {
  const DonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DonApp',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const ApiConnectionPage(),
    );
  }
}

class ApiConnectionPage extends StatefulWidget {
  const ApiConnectionPage({super.key});

  @override
  State<ApiConnectionPage> createState() => _ApiConnectionPageState();
}

class _ApiConnectionPageState extends State<ApiConnectionPage> {
  final CategoryService _categoryService = const CategoryService();
  bool _isLoading = false;
  List<Category>? _categories;
  String? _errorMessage;

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _categories = null;
      _errorMessage = null;
    });
    try {
      final categories = await _categoryService.getCategories();
      if (!mounted) return;
      setState(() => _categories = categories);
    } on CategoryServiceException catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('DonApp')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Conexión con API',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _isLoading ? null : _testConnection,
                    child: const Text('Probar conexión'),
                  ),
                  if (_isLoading) ...[
                    const SizedBox(height: 24),
                    const Center(child: CircularProgressIndicator()),
                  ],
                  if (_categories case final categories?) ...[
                    const SizedBox(height: 24),
                    Text(
                      'Conexión exitosa con la API',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Categorías recibidas: ${categories.length}'),
                    const SizedBox(height: 12),
                    ...categories.map(
                      (category) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.category_outlined),
                        title: Text(category.nombre),
                      ),
                    ),
                  ],
                  if (_errorMessage case final error?) ...[
                    const SizedBox(height: 24),
                    Text(
                      error,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
