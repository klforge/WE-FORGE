/**
 * seed_atlas.mjs
 * ─────────────────────────────────────────────────────────────
 * Seeds the MongoDB Atlas 'klforge' database.
 *   • members   → from forge_members.csv (skips existing by roll number)
 *   • projects  → collection ensured (no seed data — add via admin panel)
 *   • notices   → collection ensured (no seed data — add via admin panel)
 *   • events    → collection ensured (no seed data — add via admin panel)
 *   • media     → collection ensured (no seed data — uploaded via admin)
 *
 * Run:  node seed_atlas.mjs
 * ─────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// ── Atlas connection string (.env takes priority, local dev fallback) ──
const ATLAS_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/klforge';

// ── Schemas (inline — no circular imports needed for a seed script) ──────

const memberSchema = new mongoose.Schema(
  {
    id:          { type: String, required: true, unique: true },
    name:        { type: String, required: true },
    role:        { type: String, required: true },
    domain:      { type: String, default: '' },
    rollNumber:  { type: String, required: true, unique: true },
    department:  { type: String, default: '' },
    email:       { type: String, default: '' },
    description: { type: String, default: '' },
    bio:         { type: String, default: '' },
    skills:      { type: [String], default: [] },
    telegram:    { type: String, default: '' },
    github:      { type: String, default: '' },
    linkedin:    { type: String, default: '' },
    status:      { type: String, default: 'Online' },
    photoUrl:    { type: String, default: '' },
    isSuspended: { type: Boolean, default: false },
    orderIndex:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    id:           { type: String, required: true, unique: true },
    name:         { type: String, required: true },
    description:  { type: String, default: '' },
    github:       { type: String, default: '' },
    demo:         { type: String, default: '' },
    technologies: { type: [String], default: [] },
    imageUrl:     { type: String, default: '' },
  },
  { timestamps: true }
);

const noticeSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true, unique: true },
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    id:                   { type: String, required: true, unique: true },
    title:                { type: String, required: true },
    description:          { type: String, default: '' },
    type:                 { type: String, default: '' },
    points:               { type: Number, default: 0 },
    slots:                { type: Number, default: 50 },
    registeredCount:      { type: Number, default: 0 },
    registrationDeadline: { type: Date },
    startTime:            { type: Date, required: true },
    endTime:              { type: Date, required: true },
    eventDate:            { type: Date, required: true },
    venue:                { type: String, default: '' },
    status:               { type: String, default: 'upcoming' },
    posterUrl:            { type: String, default: '' },
    accessType:           { type: String, enum: ['public', 'domain', 'private'], default: 'public' },
    allowedDomains:       { type: [String], default: [] },
    allowedMembers:       { type: [String], default: [] },
    roles:                { type: [String], default: ['Participant', 'Volunteer', 'Organizer'] },
    isRegistrationOpen:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

const mediaSchema = new mongoose.Schema(
  {
    url:          { type: String, required: true },
    thumbnailUrl: { type: String },
    type:         { type: String, enum: ['image', 'video'], default: 'image' },
    eventName:    { type: String, default: 'General' },
    s3Key:        { type: String, required: true },
    fileSize:     { type: Number },
    mimeType:     { type: String },
    uploadedBy:   { type: String },
  },
  { timestamps: true }
);

// ── Register models ────────────────────────────────────────────────────────
const Member  = mongoose.model('Member',  memberSchema);
const Project = mongoose.model('Project', projectSchema);
const Notice  = mongoose.model('Notice',  noticeSchema);
const Event   = mongoose.model('Event',   eventSchema);
const Media   = mongoose.model('Media',   mediaSchema);

// ── CSV parser ─────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const data  = [];

  for (let i = 1; i < lines.length; i++) {       // skip header row
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;

    let name       = parts[0].trim();
    let email      = parts[1].trim();
    let role       = parts[2].trim();
    let domain     = parts[3].trim();
    let rollNumber = parts[4].trim();

    if (!name || name.toLowerCase() === 'name') continue; // extra guard

    // Auto-correct swapped Role ↔ Domain (e.g. Domain = 'Core Member')
    const roleKeywords = ['Core Member', 'Member', 'Lead', 'Chief', 'President',
                          'Advisor', 'Speaker', 'Treasurer', 'Chief Secretary'];
    if (roleKeywords.includes(domain)) {
      [role, domain] = [domain, role];
    }

    data.push({ name, email, role, domain, rollNumber });
  }

  return data;
}

// ── Ensure a collection exists (creates it if empty / never created) ───────
async function ensureCollection(Model, label) {
  const count = await Model.countDocuments();
  console.log(`  ✓ ${label}: collection exists  (${count} document${count !== 1 ? 's' : ''})`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  KL Forge — MongoDB Atlas Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Connect ──────────────────────────────────────────────────────────────
  console.log('🔌 Connecting to MongoDB Atlas (klforge)…');
  await mongoose.connect(ATLAS_URI, {
    dbName: 'klforge',   // explicit, safety net
  });
  console.log('✅ Connected!\n');

  // ── Seed Members from CSV ────────────────────────────────────────────────
  console.log('👥 Seeding Members from forge_members.csv…');
  const csvMembers = parseCSV('forge_members.csv');
  let added = 0, skipped = 0;

  const totalBefore = await Member.countDocuments();

  for (let i = 0; i < csvMembers.length; i++) {
    const { name, email, role, domain, rollNumber } = csvMembers[i];

    // Skip if already exists by roll number OR by name (case-insensitive)
    const exists = await Member.findOne({
      $or: [
        { rollNumber },
        { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    });

    if (exists) {
      console.log(`  ⏭  Skipped (exists): ${name}`);
      skipped++;
      continue;
    }

    const count = await Member.countDocuments();
    await new Member({
      id:          String(Date.now() + Math.random()),
      name, email, role, domain, rollNumber,
      department:  '',
      description: '',
      bio:         '',
      skills:      [],
      telegram:    '',
      github:      '',
      linkedin:    '',
      status:      'Online',
      photoUrl:    '',
      isSuspended: false,
      orderIndex:  count,
    }).save();

    console.log(`  ✅ Added: ${name}  (${role} — ${domain})`);
    added++;
  }

  console.log(`\n  📊 Members: ${added} added, ${skipped} skipped`);
  console.log(`     Total in DB: ${totalBefore + added}\n`);

  // ── Ensure other collections exist ───────────────────────────────────────
  console.log('📁 Ensuring all collections are registered in Atlas…');
  await ensureCollection(Project, 'projects');
  await ensureCollection(Notice,  'notices');
  await ensureCollection(Event,   'events');
  await ensureCollection(Media,   'media');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ Seed complete! Database: klforge on Atlas');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
