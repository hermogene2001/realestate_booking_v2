import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) return const LoginScreen();

    final u = auth.user!;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 20),
          CircleAvatar(radius: 48, child: Text(u.name.isNotEmpty ? u.name[0].toUpperCase() : '?', style: const TextStyle(fontSize: 36))),
          const SizedBox(height: 12),
          Text(u.name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          Text(u.email, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
          Text(u.phone, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                ListTile(leading: const Icon(Icons.badge), title: const Text('Role'), trailing: Text(u.role, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold))),
                if (u.walletAddress != null) ListTile(leading: const Icon(Icons.account_balance_wallet), title: const Text('Wallet'), subtitle: Text(u.walletAddress!, style: const TextStyle(fontSize: 12))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                ListTile(leading: const Icon(Icons.logout, color: Colors.red), title: const Text('Logout', style: TextStyle(color: Colors.red)),
                  onTap: () { auth.logout(); Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())); }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
