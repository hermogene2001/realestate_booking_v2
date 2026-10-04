import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';
import 'home_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;

  Future<void> _login() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_emailController.text.trim(), _passwordController.text);
    if (ok && mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: 60),
                const Icon(Icons.home_work, size: 80, color: Color(0xFF6366F1)),
                const SizedBox(height: 16),
                const Text('Welcome to Kigali RE', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const Text('Decentralized Real Estate Booking', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 40),
                TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined), border: OutlineInputBorder())),
                const SizedBox(height: 16),
                TextField(controller: _passwordController, obscureText: _obscure,
                  decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outlined),
                    border: const OutlineInputBorder(), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure))),
                ),
                if (auth.error != null) Padding(
                  padding: const EdgeInsets.only(top: 8), child: Text(auth.error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                const SizedBox(height: 24),
                SizedBox(width: double.infinity, height: 48,
                  child: ElevatedButton(onPressed: auth.loading ? null : _login,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: auth.loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Login', style: TextStyle(fontSize: 16))),
                ),
                const SizedBox(height: 16),
                TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                  child: const Text("Don't have an account? Register")),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
