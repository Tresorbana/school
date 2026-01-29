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
    static async getIntakeById(id) {
        const intake = await prisma.intake.findUnique({
            where: { intake_id: id },
            include: {
                students: {
                    where: { is_active: true },
                    include: { class: true }
                },
            }
        });
        if (!intake)
            return null;
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
    static async createIntake(data) {
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
    static async updateIntake(id, data) {
        return prisma.intake.update({
            where: { intake_id: id },
            data
        });
    }
    static async promoteIntake(id) {
        const intake = await prisma.intake.findUnique({ where: { intake_id: id } });
        if (!intake)
            throw new Error('Intake not found');
        if (intake.current_year_level >= 3)
            throw new Error('Intake already at max level');
        return prisma.intake.update({
            where: { intake_id: id },
            data: { current_year_level: intake.current_year_level + 1 }
        });
    }
    static async setStatus(id, isActive) {
        return prisma.intake.update({
            where: { intake_id: id },
            data: { is_active: isActive }
        });
    }
    static async deleteIntake(id) {
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
