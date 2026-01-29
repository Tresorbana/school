import { RoleType, DayOfWeek, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function main() {
    console.log('Starting seeding...');

    // 1. Seed Roles
    console.log('Seeding roles...');
    let roles: any[] = [];
    try {
        const r1 = await prisma.role.upsert({
            where: { role_id: '00000000-0000-0000-0000-000000000001' },
            update: { role_name: RoleType.admin },
            create: { role_id: '00000000-0000-0000-0000-000000000001', role_name: RoleType.admin },
        });
        console.log('Role admin seeded');

        const r2 = await prisma.role.upsert({
            where: { role_id: '00000000-0000-0000-0000-000000000002' },
            update: { role_name: RoleType.teacher },
            create: { role_id: '00000000-0000-0000-0000-000000000002', role_name: RoleType.teacher },
        });
        console.log('Role teacher seeded');

        const r3 = await prisma.role.upsert({
            where: { role_id: '00000000-0000-0000-0000-000000000003' },
            update: { role_name: RoleType.inactive },
            create: { role_id: '00000000-0000-0000-0000-000000000003', role_name: RoleType.inactive },
        });
        console.log('Role inactive seeded');

        roles = [r1, r2, r3];
    } catch (error) {
        console.error('Error seeding roles:', error);
        throw error;
    }

    const adminRole = roles.find(r => r.role_name === RoleType.admin)!;
    const teacherRole = roles.find(r => r.role_name === RoleType.teacher)!;

    // 2. Seed Users
    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@build.com' },
        update: { password: hashedPassword },
        create: {
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@build.com',
            password: hashedPassword,
            roles: {
                create: { role_id: adminRole.role_id }
            }
        },
    });

    const teacher1 = await prisma.user.upsert({
        where: { email: 'teacher1@build.com' },
        update: { password: hashedPassword },
        create: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'teacher1@build.com',
            password: hashedPassword,
            roles: {
                create: { role_id: teacherRole.role_id }
            }
        },
    });

    const teacher2 = await prisma.user.upsert({
        where: { email: 'teacher2@build.com' },
        update: { password: hashedPassword },
        create: {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'teacher2@build.com',
            password: hashedPassword,
            roles: {
                create: { role_id: teacherRole.role_id }
            }
        },
    });

    // 3. Seed Intakes
    const intake2024 = await prisma.intake.upsert({
        where: { intake_name: 'Intake 2024' },
        update: {},
        create: {
            intake_name: 'Intake 2024',
            start_year: 2024,
            end_year: 2027,
            current_year_level: 1,
        },
    });

    console.log('Seeding classes...');
    const classA = await prisma.class.upsert({
        where: { class_id: '11111111-1111-1111-1111-111111111111' },
        update: {},
        create: {
            class_id: '11111111-1111-1111-1111-111111111111',
            class_name: 'S1A',
            year_level: 1,
        },
    });

    const classB = await prisma.class.upsert({
        where: { class_id: '22222222-2222-2222-2222-222222222222' },
        update: {},
        create: {
            class_id: '22222222-2222-2222-2222-222222222222',
            class_name: 'S1B',
            year_level: 1,
        },
    });

    // 5. Seed Students
    const studentsData = [
        { first_name: 'Alice', last_name: 'Munezero', email: 'alice@student.com', class_id: classA.class_id, intake_id: intake2024.intake_id },
        { first_name: 'Bob', last_name: 'Kamanzi', email: 'bob@student.com', class_id: classA.class_id, intake_id: intake2024.intake_id },
        { first_name: 'Charlie', last_name: 'Uwimana', email: 'charlie@student.com', class_id: classB.class_id, intake_id: intake2024.intake_id },
        { first_name: 'Diana', last_name: 'Iradukunda', email: 'diana@student.com', class_id: classB.class_id, intake_id: intake2024.intake_id },
    ];

    for (const student of studentsData) {
        await prisma.student.upsert({
            where: { email: student.email },
            update: { class_id: student.class_id, intake_id: student.intake_id },
            create: student,
        });
    }

    const allStudents = await prisma.student.findMany();

    console.log('Seeding courses...');
    const math = await prisma.course.upsert({
        where: { course_id: 'c1111111-1111-1111-1111-111111111111' },
        update: {},
        create: {
            course_id: 'c1111111-1111-1111-1111-111111111111',
            course_name: 'Mathematics',
            year_level: 1
        }
    });

    const english = await prisma.course.upsert({
        where: { course_id: 'c2222222-2222-2222-2222-222222222222' },
        update: {},
        create: {
            course_id: 'c2222222-2222-2222-2222-222222222222',
            course_name: 'English',
            year_level: 1
        }
    });

    const physics = await prisma.course.upsert({
        where: { course_id: 'c3333333-3333-3333-3333-333311111111' },
        update: {},
        create: {
            course_id: 'c3333333-3333-3333-3333-333311111111',
            course_name: 'Physics',
            year_level: 1
        }
    });

    console.log('Seeding course assignments...');
    await prisma.classCourseAssignment.deleteMany({
        where: {
            academic_year: 2024
        }
    });

    await prisma.classCourseAssignment.createMany({
        data: [
            { class_id: classA.class_id, course_id: math.course_id, teacher_id: teacher1.user_id, academic_year: 2024 },
            { class_id: classA.class_id, course_id: english.course_id, teacher_id: teacher2.user_id, academic_year: 2024 },
            { class_id: classB.class_id, course_id: math.course_id, teacher_id: teacher1.user_id, academic_year: 2024 },
            { class_id: classB.class_id, course_id: physics.course_id, teacher_id: teacher2.user_id, academic_year: 2024 },
        ]
    });

    console.log('Seeding class teachers...');
    await prisma.classTeacher.deleteMany({
        where: { academic_year: 2024 }
    });

    await prisma.classTeacher.createMany({
        data: [
            { class_id: classA.class_id, user_id: teacher1.user_id, academic_year: 2024 },
            { class_id: classB.class_id, user_id: teacher2.user_id, academic_year: 2024 },
        ]
    });

    console.log('Seeding timetables...');
    const timetableA = await prisma.timetable.upsert({
        where: { timetable_id: '11111111-1111-1111-1111-f11111111111' },
        update: {},
        create: {
            timetable_id: '11111111-1111-1111-1111-f11111111111',
            class_id: classA.class_id,
            year: 2024,
            term: 1,
            academic_year: '2024-2025',
            is_active: true,
        }
    });

    console.log('Seeding roster...');
    await prisma.timetableRoster.deleteMany({
        where: { timetable_id: timetableA.timetable_id }
    });

    await prisma.timetableRoster.createMany({
        data: [
            { roster_id: '11111111-1111-1111-1111-e11111111111', timetable_id: timetableA.timetable_id, day_of_week: DayOfWeek.Monday, period: 1, course_id: math.course_id, user_id: teacher1.user_id, class_id: classA.class_id, classroom: 'Room 101' },
            { roster_id: '11111111-1111-1111-1111-e22222222222', timetable_id: timetableA.timetable_id, day_of_week: DayOfWeek.Monday, period: 2, course_id: english.course_id, user_id: teacher2.user_id, class_id: classA.class_id, classroom: 'Room 101' },
        ]
    });

    const rosters = await prisma.timetableRoster.findMany({ where: { timetable_id: timetableA.timetable_id } });

    // 11. Records and Attendance
    for (const roster of rosters) {
        const record = await prisma.record.create({
            data: {
                timetable_roster_id: roster.roster_id,
                recording_status: 'on_time',
            }
        });

        const classStudents = allStudents.filter(s => s.class_id === roster.class_id);
        for (const student of classStudents) {
            await prisma.attendance.create({
                data: {
                    student_id: student.student_id,
                    record_id: record.record_id,
                    is_present: Math.random() > 0.1, // 90% attendance
                }
            });
        }
    }

    console.log('Seeding marks...');
    await prisma.mark.deleteMany({
        where: { academic_year: 2024 }
    });

    for (const student of allStudents) {
        await prisma.mark.createMany({
            data: [
                { student_id: student.student_id, course_id: math.course_id, teacher_id: teacher1.user_id, score: 75 + Math.random() * 20, academic_year: 2024, term: 1 },
                { student_id: student.student_id, course_id: english.course_id, teacher_id: teacher2.user_id, score: 80 + Math.random() * 15, academic_year: 2024, term: 1 },
            ]
        });
    }

    console.log('Seeding fee payments...');
    await prisma.feePayment.deleteMany({
        where: { academic_year: 2024 }
    });

    for (const student of allStudents) {
        await prisma.feePayment.create({
            data: {
                student_id: student.student_id,
                amount: 150000,
                academic_year: 2024,
                term: 1,
                category: 'Tuition',
                received_by: admin.user_id,
                description: 'First term fees',
            }
        });
    }

    console.log('Seeding financial records...');
    await prisma.financialRecord.deleteMany({});

    await prisma.financialRecord.createMany({
        data: [
            { type: TransactionType.INCOME, amount: 1200000, category: 'School Fees', description: 'Total fees collected for Q1', created_by: admin.user_id },
            { type: TransactionType.EXPENSE, amount: 450000, category: 'Salaries', description: 'Teacher salaries for March', created_by: admin.user_id },
            { type: TransactionType.EXPENSE, amount: 150000, category: 'Maintenance', description: 'Roof repairs', created_by: admin.user_id },
            { type: TransactionType.INCOME, amount: 50000, category: 'Donations', description: 'Alumni donation', created_by: admin.user_id },
        ]
    });

    console.log('Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
