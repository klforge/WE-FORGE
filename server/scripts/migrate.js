const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

try {
  process.loadEnvFile(path.resolve(__dirname, '../..', '.env'));
} catch (e) {
  console.warn('No .env file found');
}

const connectDB = require('../config/db');
const Project = require('../models/Project');
const Event = require('../models/Event');
const Notice = require('../models/Notice');
const Member = require('../models/Member');
const Registration = require('../models/Registration');

const dataDir = path.resolve(__dirname, '..', 'data');
const readJson = (file) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    } catch {
        return [];
    }
};

const importData = async () => {
    await connectDB();
    try {
        await Project.deleteMany();
        await Event.deleteMany();
        await Notice.deleteMany();
        await Member.deleteMany();
        await Registration.deleteMany();

        const projects = readJson('projects.json');
        const events = readJson('events.json');
        const notices = readJson('notices.json');
        const members = readJson('members.json');
        const regs = readJson('registrations.json');

        if (projects.length) await Project.insertMany(projects);
        if (events.length) await Event.insertMany(events);
        if (notices.length) await Notice.insertMany(notices);
        if (members.length) await Member.insertMany(members);
        if (regs.length) await Registration.insertMany(regs);

        console.log('✓ Data successfully migrated to MongoDB');
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

importData();
