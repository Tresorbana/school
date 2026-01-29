import prisma from '../config/prisma.js';
import { AuditLogService } from './auditLogService.js';
export class HealthIncidentService {
    /**
     * Record a sick student
     */
    static async recordSickness(studentId, illness, notes, userId) {
        const result = await prisma.$transaction(async (tx) => {
            // Logic for new HealthRecord system if applicable, or updating Attendance/Student status
            // For now, mirroring the PHP logic which seems to update attendance/health records
            // The PHP code references Models\HealthRecord but that seems to be a new addition or separate table not fully in schema.prisma?
            // schema.prisma has HealthIncident, but PHP also uses HealthRecord for markAsSick/markAsHealthy.
            // Based on schema, we have HealthIncident and Attendance.is_sick.
            // Let's assume recording sickness updates attendance for today and logs an incident?
            // Or just creates an incident of type 'medical'?
            // PHP `recordSickness` calls `HealthRecord->markAsSick`.
            // Implementing basic "Health Incident" creation for now as per schema
            const incident = await tx.healthIncident.create({
                data: {
                    student_id: studentId,
                    incident_type: 'medical', // Mapping to Enum
                    description: `${illness}. ${notes || ''}`
                }
            });
            // Also potentially update today's attendance to "sick"?
            // This part depends on if we want to auto-update attendance records.
            // PHP does: $audit->logSicknessRecord($studentId, $illness);
            return incident;
        });
        await AuditLogService.log(userId, 'attendance', 'UPDATE', studentId, { status: 'sick', illness }, `Student marked sick: ${illness}`);
        return result;
    }
    /**
     * Mark student as healed
     */
    static async markHealed(studentId, notes, userId) {
        // Based on PHP, this seems to be the inverse of recordSickness.
        // If we are tracking "currently sick" state, we might need a field on Student or a separate table.
        // Schema has `is_sick` on `Attendance` model but that is per record.
        // Schema does NOT have an `is_sick` field on Student model, only `is_active`.
        // For now, we'll log the "healed" event as a 'medical' incident with description 'Healed/Healthy'.
        const incident = await prisma.healthIncident.create({
            data: {
                student_id: studentId,
                incident_type: 'medical',
                description: `Marked as healthy. ${notes || ''}`
            }
        });
        await AuditLogService.log(userId, 'student', 'UPDATE', studentId, { status: 'healthy' }, `Student marked as healthy`);
        return incident;
    }
    /**
     * Log student incident
     */
    static async logIncident(studentId, incidentType, notes, userId) {
        const incident = await prisma.healthIncident.create({
            data: {
                student_id: studentId,
                incident_type: incidentType,
                description: notes
            }
        });
        await AuditLogService.logIncident(userId, studentId, incidentType, notes);
        return incident;
    }
    /**
     * Get incidents with filtering
     */
    static async getIncidents(filters, limit = 50) {
        const where = {};
        if (filters.studentId)
            where.student_id = filters.studentId;
        if (filters.date) {
            const start = new Date(filters.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.date);
            end.setHours(23, 59, 59, 999);
            where.created_at = {
                gte: start,
                lte: end
            };
        }
        return prisma.healthIncident.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                student: {
                    select: {
                        first_name: true,
                        last_name: true
                    }
                }
            }
        });
    }
}
