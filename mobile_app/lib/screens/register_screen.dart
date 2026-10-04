import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  String _role = 'TENANT';
  bool _obscure = true;

  Future<void> _register() async {
    if (_passwordController.text != _confirmController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
      return;
    }
    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      _nameController.text.trim(), _emailController.text.trim(),
      _passwordController.text, _phoneController.text.trim(), role: _role,
    );
    if (ok && mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            child: Column(
              children: [
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person), border: OutlineInputBorder())),
                const SizedBox(height: 16),
                TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined), border: OutlineInputBorder())),
                const SizedBox(height: 16),
                TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone), border: OutlineInputBorder())),
                const SizedBox(height: 16),
                TextField(controller: _passwordController, obscureText: _obscure,
                  decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outlined), border: const OutlineInputBorder(),
                    suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure))),
                ),
                const SizedBox(height: 16),
                TextField(controller: _confirmController, obscureText: true,
                  decoration: const InputDecoration(labelText: 'Confirm Password', prefixIcon: Icon(Icons.lock_outlined), border: OutlineInputBorder())),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('Register as: '),
                    ChoiceChip(label: const Text('Tenant'), selected: _role == 'TENANT', onSelected: (_) => setState(() => _role = 'TENANT')),
                    const SizedBox(width: 8),
                    ChoiceChip(label: const Text('Owner'), selected: _role == 'OWNER', onSelected: (_) => setState(() => _role = 'OWNER')),
                  ],
                ),
                if (auth.error != null) Padding(
                  padding: const EdgeInsets.only(top: 8), child: Text(auth.error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                const SizedBox(height: 24),
                SizedBox(width: double.infinity, height: 48,
                  child: ElevatedButton(onPressed: auth.loading ? null : _register,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: auth.loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Register', style: TextStyle(fontSize: 16))),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
