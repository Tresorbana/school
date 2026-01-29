import prisma from '../config/prisma.js';
export class StudentService {
    static async getAllStudents(params) {
        const { page = 1, limit = 20, search = '', sortBy = 'first_name', sortOrder = 'asc', filters = {} } = params;
        const skip = (page - 1) * limit;
        const where = { is_active: true };
        if (search) {
            where.OR = [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (filters.class_id)
            where.class_id = filters.class_id;
        if (filters.intake_id)
            where.intake_id = filters.intake_id;
        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: { class: true, intake: true },
            }),
            prisma.student.count({ where }),
        ]);
        return {
            students,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    static async createStudent(data) {
        return prisma.student.create({ data });
    }
    static async getStudentById(id) {
        return prisma.student.findUnique({
            where: { student_id: id },
            include: { class: true, intake: true },
        });
    }
    static async updateStudent(id, data) {
        return prisma.student.update({
            where: { student_id: id },
            data,
        });
    }
    static async assignToIntake(studentIds, intakeId) {
        const result = await prisma.student.updateMany({
            where: { student_id: { in: studentIds } },
            data: { intake_id: intakeId },
        });
        return result.count;
    }
    static async assignToClass(studentIds, classId) {
        const result = await prisma.student.updateMany({
            where: { student_id: { in: studentIds } },
            data: { class_id: classId },
        });
        return result.count;
    }
    static async bulkCreate(students) {
        // Prisma's createMany might not return individual records or handle errors per-row well in all scenarios,
        // but for basic bulk insert it's efficient.
        return prisma.student.createMany({
            data: students,
            skipDuplicates: true,
        });
    }
}
