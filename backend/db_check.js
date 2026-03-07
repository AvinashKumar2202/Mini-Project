import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import ExamSubmission from './models/ExamSubmission.js';
import User from './models/User.js';

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let output = '';
        const log = (msg) => { output += msg + '\n'; console.log(msg); };
        log('Connected to DB');

        const totalSubmissions = await ExamSubmission.countDocuments();
        const recentSubmissions = await ExamSubmission.find().sort({ submittedAt: -1 }).limit(5).lean();
        log(`\nRecent Submissions Verification:`); // Modified line
        for (const s of recentSubmissions) { // Added loop
            const exam = await Exam.findById(s.examId); // Added line
            log(`- Submission ID: ${s._id} | ExamID: ${s.examId} | Exam Exists: ${!!exam} | StudentID: ${s.studentId} | Name: ${s.studentName}`); // Modified line
        } // Added loop

        log(`Total Submissions: ${totalSubmissions}`);

        const students = await User.find({ role: 'student' });
        log(`Total Students: ${students.length}`);

        for (const student of students) {
            const count = await ExamSubmission.countDocuments({ studentId: student._id });
            log(`Student: ${student.name} (${student.email}) | ID: ${student._id} | Submissions: ${count}`);
        }

        fs.writeFileSync('db_results.txt', output);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
