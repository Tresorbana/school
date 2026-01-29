import prisma from '../config/prisma.js';
export class CourseService {
    static async getAllCourses() {
        return prisma.course.findMany({
            include: {
                _count: {
                    select: { class_course_assignments: { where: { is_active: true } } }
                }
            },
            orderBy: [{ year_level: 'asc' }, { course_name: 'asc' }]
        });
    }
    static async getCourseById(id) {
        const course = await prisma.course.findUnique({
            where: { course_id: id },
            include: {
                class_course_assignments: {
                    where: { is_active: true },
                    include: { class: true, teacher: true }
                }
            }
        });
        if (!course)
            return null;
        return {
            ...course,
            assignments: course.class_course_assignments
        };
    }
    static async createCourse(data) {
        return prisma.course.create({ data });
    }
    static async updateCourse(id, data) {
        return prisma.course.update({
            where: { course_id: id },
            data
        });
    }
    static async assignTeacher(courseId, classId, teacherId) {
        // Check if assignment exists
        const academicYear = new Date().getFullYear();
        return prisma.classCourseAssignment.upsert({
            where: {
                class_id_course_id_academic_year: {
                    class_id: classId,
                    course_id: courseId,
                    academic_year: academicYear
                }
            },
            update: {
                teacher_id: teacherId,
                is_active: true
            },
            create: {
                class_id: classId,
                course_id: courseId,
                teacher_id: teacherId,
                academic_year: academicYear,
                is_active: true
            }
        });
    }
    static async getTeacherCourses(teacherId) {
        return prisma.classCourseAssignment.findMany({
            where: { teacher_id: teacherId, is_active: true },
            include: { course: true, class: true }
        });
    }
    static async getCourseStats() {
        const [totalCourses, y1, y2, y3] = await Promise.all([
            prisma.course.count(),
            prisma.course.count({ where: { year_level: 1 } }),
            prisma.course.count({ where: { year_level: 2 } }),
            prisma.course.count({ where: { year_level: 3 } }),
        ]);
        return {
            total_courses: totalCourses,
            year_1_courses: y1,
            year_2_courses: y2,
            year_3_courses: y3
        };
    }
}
