import prisma from '../config/prisma.js';

export class IntakeService {
    static async getAllIntakes() {
        const intakes = await prisma.intake.findMany({
            orderBy: { start_year: 'desc' },
        });
        return intakes.map(intake => ({
            ...intake,
            year_name: `Year ${intake.current_year_level}`,
            status: intake.is_active ? 'Active' : 'Inactive'
        }));
    }

    static async getIntakeById(id: string) {
        const intake = await prisma.intake.findUnique({
            where: { intake_id: id },
            include: {
                students: {
                    where: { is_active: true },
                    include: { class: true }
                },
            }
        });

        if (!intake) return null;

        // Get classes for this intake's year level
        const classes = await prisma.class.findMany({
            where: { year_level: intake.current_year_level },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        });

        // Get courses for this intake's year level
        const courses = await prisma.course.findMany({
            where: { year_level: intake.current_year_level }
        });

        return {
            ...intake,
            classes,
            courses,
            year_name: `Year ${intake.current_year_level}`
        };
    }

    static async createIntake(data: { intake_name: string, current_year_level?: number }) {
        const intakeName = data.intake_name.trim();
        const startYear = parseInt(intakeName.split('-')[0] || '');

        if (isNaN(startYear)) {
            throw new Error('Invalid intake name format. Expected YYYY-YYYY');
        }

        const endYear = startYear + 3;
        const currentYearLevel = data.current_year_level || 1;

        return prisma.intake.create({
            data: {
                intake_name: intakeName,
                start_year: startYear,
                end_year: endYear,
                current_year_level: currentYearLevel,
                is_active: false
            }
        });
    }

    static async updateIntake(id: string, data: any) {
        return prisma.intake.update({
            where: { intake_id: id },
            data
        });
    }

    static async promoteIntake(id: string) {
        const intake = await prisma.intake.findUnique({ where: { intake_id: id } });
        if (!intake) throw new Error('Intake not found');
        if (intake.current_year_level >= 3) throw new Error('Intake already at max level');

        // Check if next year level is free (no active intake) - simplified check
        // Actually, if we promote Year 1 to Year 2, Year 2 must be free.
        const nextLevel = intake.current_year_level + 1;
        const conflict = await prisma.intake.findFirst({
            where: { current_year_level: nextLevel, is_active: true }
        });
        if (conflict) {
            throw new Error(`Cannot promote: Year ${nextLevel} is occupied by active intake ${conflict.intake_name}`);
        }

        return prisma.$transaction(async (tx) => {
            // 1. Update intake level
            const updated = await tx.intake.update({
                where: { intake_id: id },
                data: { current_year_level: nextLevel }
            });

            // 2. Clear old class assignments?
            // Actually, we will just overwrite them in auto-assign.
            // But good practice to clear if no classes available.

            // 3. Auto assign students to new classes
            await this.autoAssignIntakeStudentsInternal(tx, id, nextLevel);

            return updated;
        });
    }

    // Helper for transaction
    private static async autoAssignIntakeStudentsInternal(tx: any, intakeId: string, yearLevel: number) {
        // Get students
        const students = await tx.student.findMany({
            where: { intake_id: intakeId, is_active: true },
            orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }]
        });

        // Get classes
        const classes = await tx.class.findMany({
            where: { year_level: yearLevel },
            orderBy: { class_name: 'asc' }
        });

        if (classes.length === 0) {
            // Cannot assign, so just clear class_id? Or throw?
            // Throwing might block promotion. Let's just clear.
            await tx.student.updateMany({
                where: { intake_id: intakeId },
                data: { class_id: null }
            });
            return;
        }

        // Round robin
        let classIndex = 0;
        for (const student of students) {
            const targetClass = classes[classIndex % classes.length];
            await tx.student.update({
                where: { student_id: student.student_id },
                data: { class_id: targetClass.class_id }
            });
            classIndex++;
        }
    }

    static async autoAssignIntakeStudents(intakeId: string) {
        return prisma.$transaction(async (tx) => {
            const intake = await tx.intake.findUnique({ where: { intake_id: intakeId } });
            if (!intake) throw new Error('Intake not found');
            await this.autoAssignIntakeStudentsInternal(tx, intakeId, intake.current_year_level);
            return { success: true };
        });
    }

    static async setStatus(id: string, isActive: boolean) {
        return prisma.intake.update({
            where: { intake_id: id },
            data: { is_active: isActive }
        });
    }

    static async deleteIntake(id: string) {
        const studentCount = await prisma.student.count({
            where: { intake_id: id }
        });

        if (studentCount > 0) {
            throw new Error('Cannot delete intake with assigned students');
        }

        return prisma.intake.delete({
            where: { intake_id: id }
        });
    }
}
