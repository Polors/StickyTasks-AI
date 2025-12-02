async function test() {
    const API_URL = 'http://localhost:3000/api';

    console.log('1. Login as Admin');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const { token, user } = await loginRes.json();
    console.log('Login success, token received.');

    console.log('2. Create User');
    const userRes = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Test User', email: 'test@test.com', password: 'password' })
    });

    if (userRes.status === 400) {
        console.log('User might already exist, continuing...');
    } else if (!userRes.ok) {
        console.error('Create user failed:', await userRes.text());
    } else {
        console.log('User created.');
    }

    console.log('3. Login as New User');
    const userLoginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password' })
    });

    if (!userLoginRes.ok) {
        console.error('User login failed');
        return;
    }
    const userData = await userLoginRes.json();
    const userToken = userData.token;
    console.log('User login success.');

    console.log('4. Save Notes');
    const notes = [{
        id: 'note-1',
        title: 'Test Note',
        color: '#fef3c7',
        items: [{ id: '1', text: 'Hello', done: false }],
        rotation: 0,
        zIndex: 1,
        createdAt: Date.now()
    }];

    const saveRes = await fetch(`${API_URL}/notes`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(notes)
    });

    if (!saveRes.ok) {
        console.error('Save notes failed');
    } else {
        console.log('Notes saved.');
    }

    console.log('5. Get Notes');
    const getRes = await fetch(`${API_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const fetchedNotes = await getRes.json();
    if (fetchedNotes.length === 1 && fetchedNotes[0].title === 'Test Note') {
        console.log('Notes fetched successfully.');
    } else {
        console.error('Notes fetch mismatch:', fetchedNotes);
    }
}

test();
