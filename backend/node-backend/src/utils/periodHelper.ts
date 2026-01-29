export type PeriodType = 'lesson' | 'break' | 'lunch';

export interface PeriodInfo {
    time: string;
    type: PeriodType;
}

export class PeriodHelper {
    static getAllPeriods(): Record<number, PeriodInfo> {
        return {
            1: { time: '08:30-09:20', type: 'lesson' },
            2: { time: '09:20-10:10', type: 'lesson' },
            3: { time: '10:10-10:30', type: 'break' },
            4: { time: '10:30-11:20', type: 'lesson' },
            5: { time: '11:20-12:10', type: 'lesson' },
            6: { time: '12:10-13:30', type: 'lunch' },
            7: { time: '13:30-14:20', type: 'lesson' },
            8: { time: '14:20-15:10', type: 'lesson' },
            9: { time: '15:10-15:20', type: 'break' },
            10: { time: '15:20-16:10', type: 'lesson' },
            11: { time: '16:10-17:00', type: 'lesson' }
        };
    }

    static getPeriodInfo(periodNumber: number): PeriodInfo | null {
        return this.getAllPeriods()[periodNumber] || null;
    }

    static isLessonPeriod(periodNumber: number): boolean {
        return this.getPeriodInfo(periodNumber)?.type === 'lesson';
    }

    static timeToPeriodNumber(time: string): number | null {
        const periods = this.getAllPeriods();
        for (const [num, info] of Object.entries(periods)) {
            if (info.time.startsWith(time)) {
                return parseInt(num);
            }
        }
        return null;
    }
}
