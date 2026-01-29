export class AcademicYearHelper {
    static validateAcademicYear(academicYear: string) {
        if (!/^\d{4}-\d{4}$/.test(academicYear)) {
            return {
                valid: false,
                message: 'Academic year must be in format YYYY-YYYY (e.g., 2025-2026)',
                start_year: null,
                end_year: null
            };
        }

        const parts = academicYear.split('-');
        const start = parts[0] ? Number(parts[0]) : NaN;
        const end = parts[1] ? Number(parts[1]) : NaN;

        if (isNaN(start) || isNaN(end) || end !== start + 1) {
            return {
                valid: false,
                message: 'End year must be exactly one year after start year',
                start_year: start,
                end_year: end
            };
        }

        return {
            valid: true,
            message: 'Valid academic year',
            start_year: start,
            end_year: end
        };
    }

    static getStartYear(academicYear: string): number | null {
        const validation = this.validateAcademicYear(academicYear);
        return validation.valid ? validation.start_year : null;
    }

    static generateAcademicYear(startYear: number): string {
        return `${startYear}-${startYear + 1}`;
    }

    static getCurrentAcademicYear(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed

        // If we're in August (8) or later, we're in the new academic year
        if (month >= 8) {
            return this.generateAcademicYear(year);
        } else {
            return this.generateAcademicYear(year - 1);
        }
    }
}
