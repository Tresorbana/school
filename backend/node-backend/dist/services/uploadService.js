import prisma from '../config/prisma.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
export class UploadService {
    static async importStudentsFromCsv(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
            if (!records.length) {
                return { status: 'error', message: 'File is empty' };
            }
            const validStudents = [];
            const emails = [];
            // 1. Validation & Collection
            for (const row of records) {
                const firstName = row['First Name'];
                const lastName = row['Last Name'];
                const email = row['Email'];
                if (firstName && lastName && email) {
                    validStudents.push({
                        first_name: firstName,
                        last_name: lastName,
                        email: email
                    });
                    emails.push(email);
                }
            }
            if (!validStudents.length) {
                return { status: 'error', message: 'No valid rows found' };
            }
            // 2. Check duplicates
            const existingStudents = await prisma.student.findMany({
                where: { email: { in: emails } },
                select: { email: true }
            });
            if (existingStudents.length > 0) {
                const existingEmails = existingStudents.map(s => s.email);
                return {
                    status: 'error',
                    message: `Import failed: Duplicate emails found: ${existingEmails.join(', ')}`
                };
            }
            // 3. Simple Bulk Insert (Validation passed)
            // Note: Prisma createMany is supported on Postgres
            const result = await prisma.student.createMany({
                data: validStudents,
                skipDuplicates: true // Optional extra safety, though we checked manual duplicates already
            });
            return {
                status: 'success',
                message: `${result.count} students imported successfully`,
                inserted: result.count
            };
        }
        catch (error) {
            console.error('Import error:', error);
            return { status: 'error', message: error.message };
        }
        finally {
            // Cleanup temp file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }
}
