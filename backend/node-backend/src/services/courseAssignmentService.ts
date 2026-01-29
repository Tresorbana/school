import prisma from '../config/prisma.js';

export class CourseAssignmentService {

    // Assign a course to a class (optional teacher)
    static async assignCourseToClass(classId: string, courseId: string, teacherId?: string | null) {
        // Check if exists
        const existing = await prisma.classCourseAssignment.findFirst({
            where: { class_id: classId, course_id: courseId }
        });

        if (existing) {
            throw new Error('Course is already assigned to this class');
        }

        return prisma.classCourseAssignment.create({
            data: {
                class_id: classId,
                course_id: courseId,
                teacher_id: teacherId || null,
                academic_year: new Date().getFullYear() // Default to current year
            },
            include: {
                class: true,
                course: true,
                teacher: true
            }
        });
    }

    // Assign multiple courses to a class
    static async assignMultipleCourses(classId: string, assignments: { course_id: string, teacher_id?: string | null }[]) {
        const results = [];
        for (const assign of assignments) {
            try {
                // Skip if already assigned (or handle error)
                const exists = await prisma.classCourseAssignment.findFirst({
                    where: { class_id: classId, course_id: assign.course_id }
                });

                if (!exists) {
                    const created = await prisma.classCourseAssignment.create({
                        data: {
                            class_id: classId,
                            course_id: assign.course_id,
                            teacher_id: assign.teacher_id || null,
                            academic_year: new Date().getFullYear()
                        }
                    });
                    results.push(created);
                }
            } catch (error) {
                console.error(`Failed to assign course ${assign.course_id} to class ${classId}`, error);
            }
        }
        return results;
    }

    // Remove course from class
    static async removeCourseFromClass(classId: string, courseId: string) {
        // We need to delete based on composite or unique constraint.
        // Prisma schema says @@unique([class_id, course_id, academic_year]) but we might ignore year for now or find first?
        // Let's rely on finding it first.
        const assignment = await prisma.classCourseAssignment.findFirst({
            where: { class_id: classId, course_id: courseId }
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        return prisma.classCourseAssignment.delete({
            where: { assignment_id: assignment.assignment_id }
        });
    }

    // Update teacher for an assignment
    static async assignTeacher(classId: string, courseId: string, teacherId: string) {
        const assignment = await prisma.classCourseAssignment.findFirst({
            where: { class_id: classId, course_id: courseId }
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        return prisma.classCourseAssignment.update({
            where: { assignment_id: assignment.assignment_id },
            data: { teacher_id: teacherId },
            include: { teacher: true }
        });
    }

    // Remove teacher from assignment
    static async removeTeacher(classId: string, courseId: string) {
        const assignment = await prisma.classCourseAssignment.findFirst({
            where: { class_id: classId, course_id: courseId }
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        return prisma.classCourseAssignment.update({
            where: { assignment_id: assignment.assignment_id },
            data: { teacher_id: null }
        });
    }

    // Get courses for a class
    static async getClassCourses(classId: string) {
        return prisma.classCourseAssignment.findMany({
            where: { class_id: classId },
            include: {
                course: true,
                teacher: {
                    select: {
                        user_id: true,
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                }
            }
        });
    }

    // Get assignments for a teacher
    static async getTeacherAssignments(teacherId: string) {
        return prisma.classCourseAssignment.findMany({
            where: { teacher_id: teacherId },
            include: {
                class: true,
                course: true
            }
        });
    }

    // Get available courses for class (not yet assigned, matching year level)
    static async getAvailableCourses(classId: string, yearLevel: number) {
        // Get all courses for year level
        const allCourses = await prisma.course.findMany({
            where: { year_level: yearLevel }
        });

        // Get assigned course IDs
        const assigned = await prisma.classCourseAssignment.findMany({
            where: { class_id: classId },
            select: { course_id: true }
        });
        const assignedIds = new Set(assigned.map(a => a.course_id));

        return allCourses.filter(c => !assignedIds.has(c.course_id));
    }

    // Auto-assign all matching courses to specific class
    static async autoAssignCoursesToClass(classId: string) {
        const classInfo = await prisma.class.findUnique({ where: { class_id: classId } });
        if (!classInfo) throw new Error('Class not found');

        const courses = await this.getAvailableCourses(classId, classInfo.year_level);

        const results = [];
        for (const course of courses) {
            const created = await prisma.classCourseAssignment.create({
                data: {
                    class_id: classId,
                    course_id: course.course_id,
                    academic_year: new Date().getFullYear()
                }
            });
            results.push(created);
        }
        return results;
    }
}
