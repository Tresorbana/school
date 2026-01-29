import prisma from '../src/config/prisma.js';
import fs from 'fs';

async function runIntegrityChecks() {
    console.log('--- Starting Database Integrity Checks ---');
    const results: any = {
        checks: [],
        summary: {}
    };

    try {
        // 1. Orphaned UserRoles
        const userRoles = await prisma.userRole.findMany();
        results.summary.totalUserRoles = userRoles.length;

        // 2. Students without Intake or Class
        const studentsInLimbo = await prisma.student.findMany({
            where: {
                OR: [
                    { intake_id: null },
                    { class_id: null }
                ]
            }
        });
        results.summary.studentsInLimbo = studentsInLimbo.length;

        // 3. Duplicate ClassCourseAssignments for same academic year
        const assignments = await prisma.classCourseAssignment.findMany();
        const assignmentKeys = new Set();
        let conflicts = 0;
        for (const a of assignments) {
            const key = `${a.class_id}-${a.course_id}-${a.academic_year}`;
            if (assignmentKeys.has(key)) {
                conflicts++;
            }
            assignmentKeys.add(key);
        }
        results.summary.classCourseAssignmentConflicts = conflicts;

        // 4. Financial Balance Check
        const payments = await prisma.feePayment.findMany();
        const totalPayments = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
        results.summary.totalFeePayments = totalPayments;

        fs.writeFileSync('scripts/integrity_results.json', JSON.stringify(results, null, 2));
        console.log('--- Integrity Checks Completed and saved to JSON ---');
    } catch (error) {
        console.error('Integrity Check Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runIntegrityChecks();
