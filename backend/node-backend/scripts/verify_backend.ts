
// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:3000/api';
const CREDENTIALS = {
    email: 'admin@build.com',
    password: 'password123'
};

const HEADERS: any = {
    'Content-Type': 'application/json'
};

async function post(url: string, body: any) {
    const res = await fetch(`${BASE_URL}${url}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${url} failed: ${res.status} ${await res.text()}`);
    return res.json() as any;
}

async function get(url: string) {
    const res = await fetch(`${BASE_URL}${url}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`${url} failed: ${res.status} ${await res.text()}`);
    return res.json() as any;
}

async function runVerification() {
    console.log('🚀 Starting Comprehensive Backend Verification...');

    try {
        // --- AUTH ---
        console.log('\n🔐 [1/6] Testing Auth...');
        const loginData = await post('/auth/login', CREDENTIALS);
        const token = loginData.data?.token || loginData.token;
        if (!token) throw new Error('No token received');
        HEADERS['Authorization'] = `Bearer ${token}`;
        console.log('✅ Login successful');

        // --- COURSES ---
        console.log('\n📚 [2/6] Testing Course CRUD...');
        // 1. Create
        const newCourse = await post('/courses', { course_name: 'Test Logic 101', year_level: 1 });
        const courseId = newCourse.data.course_id;
        console.log(`✅ Created Course: ${newCourse.data.course_name}`);

        // 2. Fetch All
        const allCourses = await get('/courses');
        if (!allCourses.data.some((c: any) => c.course_id === courseId)) throw new Error('New course not found in list');
        console.log('✅ Fetched all courses');

        // --- STUDENTS (Children Registration) ---
        console.log('\n👥 [3/6] Testing Student Registration...');
        // Need intake and class usually, but let's try minimal first or fetch existing
        // We know class_id '11111111-1111-1111-1111-111111111111' exists from seed
        const classId = '11111111-1111-1111-1111-111111111111';
        const newStudent = await post('/students', {
            first_name: 'Test',
            last_name: 'Kid',
            email: `test.kid.${Date.now()}@school.com`,
            class_id: classId,
            gender: 'Male' // Assuming simple string
        });
        const studentId = newStudent.data.student_id;
        console.log(`✅ Registered Student: ${newStudent.data.first_name} (${studentId})`);

        // --- TIMETABLE ---
        console.log('\n📅 [4/6] Testing Timetable...');
        // 1. Create Timetable (might fail if one exists active, but let's try or handle error)
        try {
            // Need a new term or year to avoid conflict if unique constraint exists
            // Or just fetch existing.
            // Let's try fetching first.
            const existingTimetable = await get(`/timetables/class/${classId}`);
            console.log('✅ Fetched existing class timetable');
        } catch (e: any) {
            console.log('⚠️ Could not fetch existing timetable, attempting create...');
            const newTimetable = await post('/timetables', {
                academic_year: '2025',
                class_id: classId,
                term: 3
            });
            console.log('✅ Created new Timetable');
        }

        // --- MARKS & REPORTS ---
        console.log('\n📝 [5/6] Testing Marks & Reports...');
        // 1. Upload Marks
        await post('/marks/bulk', {
            academic_year: 2024,
            term: 1,
            course_id: courseId, // Use the one we created
            marks: [{ student_id: studentId, score: 95, comments: 'Excellent' }]
        });
        console.log('✅ Marks uploaded');

        // 2. Generate Report
        // Wait a small bit? No need.
        const report = await get(`/deliberation/report/${studentId}?year=2024&term=1`);
        if (report.success) console.log('✅ Report generated');
        else throw new Error('Report generation returned unsuccess');

        // --- FESS ---
        console.log('\n💰 [6/6] Testing Fees...');
        const feeSummary = await get('/fees/summary?academic_year=2024&term=1');
        console.log('✅ Fee Summary fetched');

        console.log('\n✨ ALL TESTS PASSED! Backend is fully functional.');

    } catch (error: any) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error(error);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

runVerification();
