import prisma from '../config/prisma.js';

export class ClassTeacherService {

    // Assign class teacher (homeroom)
    static async assignClassTeacher(classId: string, teacherId: string, academicYear: number = new Date().getFullYear()) {
        // Check if already exists for this year
        const existing = await prisma.classTeacher.findUnique({
            where: {
                class_id_academic_year: {
                    class_id: classId,
                    academic_year: academicYear
                }
            }
        });

        if (existing) {
            // Update logic? Or unique constraint fails?
            // Since unique is [class_id, academic_year], only one teacher per class per year.
            return prisma.classTeacher.update({
                where: { class_id_academic_year: { class_id: classId, academic_year: academicYear } },
                data: { user_id: teacherId }
            });
        }

        return prisma.classTeacher.create({
            data: {
                class_id: classId,
                user_id: teacherId,
                academic_year: academicYear
            }
        });
    }

    static async getClassTeacher(classId: string, academicYear: number = new Date().getFullYear()) {
        const assignment = await prisma.classTeacher.findUnique({
            where: {
                class_id_academic_year: {
                    class_id: classId,
                    academic_year: academicYear
                }
            },
            include: { user: true }
        });
        return assignment?.user || null;
    }

    static async getTeacherClasses(teacherId: string) {
        return prisma.classTeacher.findMany({
            where: { user_id: teacherId, is_active: true },
            include: { class: true }
        });
    }

    static async removeClassTeacher(classId: string, academicYear: number = new Date().getFullYear()) {
        try {
            return await prisma.classTeacher.delete({
                where: {
                    class_id_academic_year: {
                        class_id: classId,
                        academic_year: academicYear
                    }
                }
            });
        } catch (e) {
            // Record not found
            return null;
        }
    }
}
