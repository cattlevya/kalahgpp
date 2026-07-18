const db = require('./config/db');

async function seedAdmin() {
    try {
        console.log('⏳ Menghubungkan ke database...');
        
        // Cek apakah email admin@respira.id sudah ada
        const [existing] = await db.query('SELECT * FROM users WHERE email = $1', ['admin@respira.id']);
        
        if (existing.length > 0) {
            console.log('ℹ️ Email admin@respira.id sudah terdaftar.');
            const user = existing[0];
            if (user.role !== 'admin') {
                console.log(`⚠️ Mengubah role user ${user.name} (${user.email}) dari '${user.role}' menjadi 'admin'...`);
                await db.query('UPDATE users SET role = $1, name = $2, password = $3 WHERE email = $4', [
                    'admin', 
                    'Admin Respira', 
                    'admin123', 
                    'admin@respira.id'
                ]);
                console.log('✅ Role berhasil diperbarui menjadi admin!');
            } else {
                console.log('✅ User tersebut sudah memiliki role admin.');
            }
        } else {
            console.log('➕ Mendaftarkan akun admin baru...');
            await db.query(
                'INSERT INTO users (name, email, password, role, license_code) VALUES ($1, $2, $3, $4, $5)',
                ['Admin Respira', 'admin@respira.id', 'admin123', 'admin', null]
            );
            console.log('✅ Akun admin berhasil ditambahkan!');
        }
        
        console.log('\n=======================================');
        console.log('Detail Akun Admin:');
        console.log('Email   : admin@respira.id');
        console.log('Password: admin123');
        console.log('Role    : admin');
        console.log('=======================================');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal melakukan seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
