import prisma from '../config/prisma.js';

export class ClassService {
    static async getAllClasses(withCourses: boolean = false) {
        const classes = await prisma.class.findMany({
            include: {
                _count: {
                    select: {
                        students: { where: { is_active: true } },
                        class_course_assignments: { where: { is_active: true } }
                    }
                },
                ...(withCourses ? {
                    class_course_assignments: {
                        where: { is_active: true },
                        include: { course: true }
                    }
                } : {})
            },
            orderBy: [{ year_level: 'asc' }, { class_name: 'asc' }]
        });

        return classes.map(c => ({
            ...c,
            student_count: c._count.students,
            course_count: c._count.class_course_assignments,
            courses: (c as any).class_course_assignments?.map((a: any) => a.course) || []
        }));
    }

    static async getClassById(id: string) {
        const classData = await prisma.class.findUnique({
            where: { class_id: id },
            include: {
                students: { where: { is_active: true } },
                class_course_assignments: {
                    where: { is_active: true },
                    include: { course: true, teacher: true }
                }
            }
        });

        if (!classData) return null;

        return {
            ...classData,
            student_count: classData.students.length,
            courses: classData.class_course_assignments.map(a => ({
                ...a.course,
                teacher: a.teacher
            }))
        };
    }

    static async createClass(data: { class_name: string, year_level: number }) {
        return prisma.class.create({ data });
    }

    static async updateClass(id: string, data: any) {
        return prisma.class.update({
            where: { class_id: id },
            data
        });
    }

    static async deleteClass(id: string) {
        const studentCount = await prisma.student.count({
            where: { class_id: id, is_active: true }
        });

        if (studentCount > 0) {
            throw new Error(`Cannot delete class with ${studentCount} active students`);
        }

        // Cascading delete is handled by Prisma via ON DELETE CASCADE in schema if defined,
        // otherwise we handle manually.
        return prisma.class.delete({
            where: { class_id: id }
        });
    }

    static async getClassesByYearLevel(yearLevel: number) {
        return prisma.class.findMany({
            where: { year_level: yearLevel },
            orderBy: { class_name: 'asc' }
        });
    }
}
