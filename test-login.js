const testLogin = async () => {
    try {
        console.log('Testing login API...');
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' })
        });

        console.log('Status:', res.status);
        console.log('Headers:', Object.fromEntries(res.headers.entries()));

        const text = await res.text();
        console.log('Response text:', text);
        console.log('Response length:', text.length);

        if (text) {
            try {
                const json = JSON.parse(text);
                console.log('Parsed JSON:', json);
            } catch (e) {
                console.error('Failed to parse JSON:', e.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

testLogin();
