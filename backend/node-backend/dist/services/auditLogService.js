import prisma from '../config/prisma.js';
export class AuditLogService {
    /**
     * Log an action (CREATE, UPDATE, DELETE, SUBMIT, ACTIVATE, etc.)
     */
    static async log(userId, tableName, actionType, recordId, details = {}, description = null) {
        try {
            await prisma.auditLog.create({
                data: {
                    user_id: userId,
                    table_name: tableName,
                    action_type: actionType,
                    record_id: String(recordId),
                    details: details,
                    description: description
                }
            });
            return true;
        }
        catch (error) {
            console.error('Audit log failed:', error);
            return false;
        }
    }
    static async logUserCreation(userId, email, roles) {
        return this.log(null, 'users', 'CREATE', userId, { email, roles }, `User created: ${email}`);
    }
    static async logRoleChange(userId, targetUserId, oldRoleId, newRoleId) {
        return this.log(userId, 'user_roles', 'UPDATE', targetUserId, {
            old_role: oldRoleId,
            new_role: newRoleId
        }, `User role changed from ${oldRoleId} to ${newRoleId}`);
    }
    static async logAttendanceSubmission(userId, recordId, classId, courseName, studentCount) {
        return this.log(userId, 'record', 'SUBMIT', recordId, {
            class_id: classId,
            course_name: courseName,
            student_count: studentCount
        }, `Attendance submitted for ${courseName} (${studentCount} students)`);
    }
    static async logTimetableActivation(userId, timetableId, year, term) {
        return this.log(userId, 'timetable', 'ACTIVATE', timetableId, {
            year,
            term
        }, `Timetable Year ${year} Term ${term} activated`);
    }
    static async logTimetableCreation(userId, timetableId, year, term, slotCount) {
        return this.log(userId, 'timetable', 'CREATE', timetableId, {
            year,
            term,
            slot_count: slotCount
        }, `Timetable created for Year ${year} Term ${term} with ${slotCount} slots`);
    }
    static async logIncident(userId, studentId, incidentType, notes) {
        return this.log(userId, 'incidents', 'CREATE', studentId, {
            student_id: studentId,
            incident_type: incidentType
        }, `${incidentType} logged: ${notes}`);
    }
    static async getLogs(filters, limit = 100, offset = 0) {
        const where = {};
        if (filters.userId)
            where.user_id = filters.userId;
        if (filters.tableName)
            where.table_name = filters.tableName;
        if (filters.actionType)
            where.action_type = filters.actionType;
        if (filters.startDate)
            where.created_at = { gte: filters.startDate };
        if (filters.endDate) {
            where.created_at = { ...where.created_at, lte: filters.endDate };
        }
        return prisma.auditLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                }
            }
        });
    }
}
