import fs from 'fs';
import prisma from '../src/config/prisma.js';

async function testAPIs() {
    console.log('--- Starting Financial API Tests ---');
    const results: any = {};
    try {
        // 0. Find dynamic data
        const testStudent = await prisma.student.findFirst({
            where: { class: { class_name: 'S1A' } },
            select: { student_id: true }
        });

        if (!testStudent) {
            console.error('Failed to find dynamic test data.');
            return;
        }

        // 1. Login
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@build.com', password: 'password123' })
        });
        const loginData: any = await loginResponse.json();
        results.login = loginData;

        if (loginData.status === 'success') {
            const token = loginData.token;

            // 2. POST /api/fees/payment
            console.log(`Testing Fee Payment for Student ${testStudent.student_id}...`);
            const feeReq = await fetch('http://localhost:3000/api/fees/payment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: testStudent.student_id,
                    amount: 50000,
                    academic_year: 2024,
                    term: 1,
                    category: 'Tuition',
                    description: 'Partial payment for term 1'
                })
            });
            results.feePayment = await feeReq.json();
            console.log('Fee Payment Result:', results.feePayment?.success);

            // 3. GET /api/financials/summary
            console.log('Testing GET /api/financials/summary...');
            const financeSummaryReq = await fetch('http://localhost:3000/api/financials/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            results.financeSummary = await financeSummaryReq.json();
            console.log('Finance Summary Success:', results.financeSummary?.success);
            console.log('Current Revenue:', results.financeSummary?.data?.totalRevenue);
        }

        fs.writeFileSync('scripts/api_results.json', JSON.stringify(results, null, 2));
        console.log('--- Financial API Tests Completed ---');
    } catch (error) {
        console.error('API Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAPIs();
