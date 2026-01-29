const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
    console.log('--- Testing Auth ---');
    // We'd normally login here, but need credentials.
    // For local testing, we might assume a test admin user exists.
    console.log('Skipping auth test (manual login required or seed data needed)');
}

async function testStudents() {
    console.log('\n--- Testing Students ---');
    try {
        const res = await fetch(`${BASE_URL}/students`);
        console.log('GET /students status:', res.status);
    } catch (e) {
        console.error('Students test failed', e);
    }
}

async function testFees() {
    console.log('\n--- Testing Fees ---');
    try {
        const res = await fetch(`${BASE_URL}/fees/summary`);
        console.log('GET /fees/summary status:', res.status);
    } catch (e) {
        console.error('Fees test failed', e);
    }
}

async function testFinancials() {
    console.log('\n--- Testing Financials ---');
    try {
        const res = await fetch(`${BASE_URL}/financials/summary`);
        console.log('GET /financials/summary status:', res.status);
    } catch (e) {
        console.error('Financials test failed', e);
    }
}

async function testDeliberation() {
    console.log('\n--- Testing Deliberation ---');
    try {
        const res = await fetch(`${BASE_URL}/deliberation/rules`);
        console.log('GET /deliberation/rules status:', res.status);
    } catch (e) {
        console.error('Deliberation test failed', e);
    }
}

async function runTests() {
    console.log('Starting API Tests...');
    await testAuth();
    await testStudents();
    await testFees();
    await testFinancials();
    await testDeliberation();
    console.log('\nTests completed.');
}

runTests();
