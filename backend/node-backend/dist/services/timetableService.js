import prisma from '../config/prisma.js';
import { AcademicYearHelper } from '../utils/academicYearHelper.js';
import { PeriodHelper } from '../utils/periodHelper.js';
export class TimetableService {
    static async createTimetable(academicYear, classId, term) {
        const validation = AcademicYearHelper.validateAcademicYear(academicYear);
        if (!validation.valid) {
            throw new Error(validation.message || 'Invalid academic year');
        }
        // Check for existing timetable
        const existing = await prisma.timetable.findFirst({
            where: { class_id: classId, academic_year: academicYear, term }
        });
        if (existing) {
            throw new Error('Timetable for this class, academic year and term already exists');
        }
        return prisma.$transaction(async (tx) => {
            const timetable = await tx.timetable.create({
                data: {
                    year: validation.start_year,
                    academic_year: academicYear,
                    class_id: classId,
                    term: term,
                    is_active: false
                }
            });
            // Create 55 slots (5 days * 11 periods)
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const slotsData = [];
            for (const day of days) {
                for (let period = 1; period <= 11; period++) {
                    slotsData.push({
                        timetable_id: timetable.timetable_id,
                        day_of_week: day,
                        period: period,
                        class_id: classId
                    });
                }
            }
            await tx.timetableRoster.createMany({
                data: slotsData
            });
            return timetable;
        });
    }
    static async assignSlot(rosterId, assignmentId) {
        const roster = await prisma.timetableRoster.findUnique({
            where: { roster_id: rosterId },
            include: { timetable: true }
        });
        if (!roster)
            throw new Error('Slot not found');
        if (roster.timetable.is_active) {
            throw new Error('Cannot edit active timetable. Deactivate it first.');
        }
        if (!PeriodHelper.isLessonPeriod(roster.period)) {
            throw new Error('Cannot assign lessons to break or lunch periods');
        }
        const assignment = await prisma.classCourseAssignment.findUnique({
            where: { assignment_id: assignmentId }
        });
        if (!assignment)
            throw new Error('Course assignment not found');
        if (assignment.class_id !== roster.class_id) {
            throw new Error('Assignment class does not match timetable class');
        }
        // Teacher double-booking check
        if (assignment.teacher_id) {
            const conflict = await prisma.timetableRoster.findFirst({
                where: {
                    user_id: assignment.teacher_id,
                    day_of_week: roster.day_of_week,
                    period: roster.period,
                    timetable: {
                        academic_year: roster.timetable.academic_year,
                        term: roster.timetable.term,
                        is_active: true
                    },
                    NOT: { roster_id: rosterId }
                }
            });
            if (conflict) {
                throw new Error('Teacher is already assigned during this period in another active timetable');
            }
        }
        return prisma.timetableRoster.update({
            where: { roster_id: rosterId },
            data: {
                course_id: assignment.course_id,
                user_id: assignment.teacher_id
            }
        });
    }
    static async activateTimetable(id) {
        const timetable = await prisma.timetable.findUnique({ where: { timetable_id: id } });
        if (!timetable)
            throw new Error('Timetable not found');
        return prisma.$transaction(async (tx) => {
            // Deactivate others for the same class
            await tx.timetable.updateMany({
                where: { class_id: timetable.class_id, is_active: true },
                data: { is_active: false }
            });
            // Activate this one
            return tx.timetable.update({
                where: { timetable_id: id },
                data: { is_active: true }
            });
        });
    }
    static async getClassTimetable(classId) {
        const timetable = await prisma.timetable.findFirst({
            where: { class_id: classId, is_active: true },
            include: {
                timetable_roster: {
                    include: {
                        course: true,
                        user: true
                    },
                    orderBy: [{ day_of_week: 'asc' }, { period: 'asc' }]
                }
            }
        });
        if (!timetable)
            return null;
        // Helper to group by day
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const actions = days.map(day => {
            const daySlots = timetable.timetable_roster.filter(s => s.day_of_week === day);
            return Array.from({ length: 11 }, (_, i) => {
                const periodNum = i + 1;
                const slot = daySlots.find(s => s.period === periodNum);
                return {
                    subject: slot?.course?.course_name || (PeriodHelper.getPeriodInfo(periodNum)?.type !== 'lesson' ? PeriodHelper.getPeriodInfo(periodNum)?.type : ''),
                    teacher: slot?.user ? `${slot.user.first_name} ${slot.user.last_name}` : '',
                    roster_id: slot?.roster_id,
                    period: periodNum,
                    type: PeriodHelper.getPeriodInfo(periodNum)?.type
                };
            });
        });
        return {
            timetable_id: timetable.timetable_id,
            academic_year: timetable.academic_year,
            term: timetable.term,
            actions
        };
    }
    static async getTeacherTodaySchedule(teacherId) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        return prisma.timetableRoster.findMany({
            where: {
                user_id: teacherId,
                day_of_week: today,
                timetable: { is_active: true }
            },
            include: {
                course: true,
                class: true
            },
            orderBy: { period: 'asc' }
        });
    }
}
