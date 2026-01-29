import prisma from '../config/prisma.js';

export class MarkService {
    static async upsertMark(data: {
        student_id: string;
        course_id: string;
        teacher_id: string;
        score: number;
        academic_year: number;
        term: number;
        comments?: string;
    }) {
        return prisma.mark.upsert({
            where: {
                student_id_course_id_academic_year_term: {
                    student_id: data.student_id,
                    course_id: data.course_id,
                    academic_year: data.academic_year,
                    term: data.term
                }
            },
            update: {
                score: data.score,
                comments: data.comments ?? null,
                teacher_id: data.teacher_id,
                updated_at: new Date()
            },
            create: {
                student_id: data.student_id,
                course_id: data.course_id,
                teacher_id: data.teacher_id,
                score: data.score,
                academic_year: data.academic_year,
                term: data.term,
                comments: data.comments ?? null
            }
        });
    }

    static async getMarksByClass(classId: string, academicYear: number, term: number) {
        return prisma.mark.findMany({
            where: {
                student: { class_id: classId },
                academic_year: academicYear,
                term: term
            },
            include: {
                student: true,
                course: true,
                teacher: true
            }
        });
    }

    static async getStudentMarks(studentId: string, academicYear: number) {
        return prisma.mark.findMany({
            where: {
                student_id: studentId,
                academic_year: academicYear
            },
            include: {
                course: true,
                teacher: true
            },
            orderBy: { term: 'asc' }
        });
    }
}
