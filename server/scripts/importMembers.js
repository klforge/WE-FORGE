const mongoose = require('mongoose');
const path = require('path');

try {
  process.loadEnvFile(path.resolve(__dirname, '../..', '.env'));
} catch (e) {
  console.warn('No .env file found');
}

const connectDB = require('../config/db');
const Member = require('../models/Member');

const membersData = [
  // ADVISORS
  { name: "MARAM LAKSHMI YASWITHA", rollNumber: "2300033169", role: "Advisor", domain: "Advisors", department: "CSE" },
  { name: "V PAVAN", rollNumber: "2300033576", role: "Advisor", domain: "Advisors", department: "CSE" },
  { name: "GADALA KARTHIKEYA", rollNumber: "2300033789", role: "Advisor", domain: "Advisors", department: "CSE" },
  
  // VERY VERY VERY SPECIAL PEOPLE
  { name: "BHUVANA SUDHEER", rollNumber: "2400080210", role: "President", domain: "Leadership", department: "CSE" },
  { name: "ABU SUFIAN CHOUDHURY", rollNumber: "2400031520", role: "Chief Secretary", domain: "Leadership", department: "CSE" },
  { name: "PANDITI JESSICA", rollNumber: "2400033165", role: "Treasurer", domain: "Leadership", department: "CSE" },
  
  // CLUB OPERATIONS (Protocol)
  { name: "VALMETI SRINIDHI", rollNumber: "2300032936", role: "Protocol", domain: "Club Operations", department: "CSE" },
  { name: "M SAI NANDHAN", rollNumber: "2400033220", role: "Protocol", domain: "Club Operations", department: "CSE" },
  { name: "Pantadi saranya sri", rollNumber: "2400030597", role: "Protocol", domain: "Club Operations", department: "CSE" },
  { name: "Makkena Sreeja", rollNumber: "2400030533", role: "Protocol", domain: "Club Operations", department: "CSE-1" },
  { name: "Piyush Pattanayak", rollNumber: "2400032426", role: "Protocol", domain: "Club Operations", department: "CSE [HTE]" },
  { name: "Nivesh Padamata", rollNumber: "2400030538", role: "Protocol", domain: "Club Operations", department: "CSE" },
  { name: "Peddireddy Chaithanya Raj", rollNumber: "2500030104", role: "Protocol", domain: "Club Operations", department: "CSE" },
  { name: "Tottanapudi Karthik", rollNumber: "2400080016", role: "Protocol", domain: "Club Operations", department: "AI&DS" },
  { name: "ANKIT RAJ", rollNumber: "2500030949", role: "Protocol", domain: "Club Operations", department: "CSE PBL" },
  { name: "YEMCHARLA PAVAN KALYAN", rollNumber: "2400031969", role: "Protocol", domain: "Club Operations", department: "CSE" },

  // CREATIVE & CONTENT
  { name: "NAKKA CHANDINI LAKSHMI", rollNumber: "2400033147", role: "Core Member", domain: "Creative & Content", department: "CSE" },
  { name: "KVL KHYATI", rollNumber: "2400033157", role: "Core Member", domain: "Creative & Content", department: "CSE" },
  { name: "T Deepak Kumar Patro", rollNumber: "2400030499", role: "Core Member", domain: "Creative & Content", department: "CSE HTE" },
  { name: "Lekhya sree", rollNumber: "2400031881", role: "Core Member", domain: "Creative & Content", department: "CSE" },
  { name: "Sai Nikhil Vukka", rollNumber: "2500032630", role: "Core Member", domain: "Creative & Content", department: "CSE Hon" },

  // MEDIA & BROADCASTING
  { name: "SIVA HARSHA VARDHAN REDDY", rollNumber: "2400030361", role: "Core Member", domain: "Media & Broadcasting", department: "CSE (HTE)" },
  { name: "Harsha Vardhan Naidu", rollNumber: "2400031652", role: "Core Member", domain: "Media & Broadcasting", department: "CSE" },
  { name: "Ramisetty Sahithi", rollNumber: "2400031618", role: "Core Member", domain: "Media & Broadcasting", department: "CSE-4" },
  { name: "SREEPATHI NIKHIL", rollNumber: "2500080027", role: "Core Member", domain: "Media & Broadcasting", department: "AI&DS" },
  { name: "Gogala Rajkamal", rollNumber: "2400030306", role: "Core Member", domain: "Media & Broadcasting", department: "CSE" },
  { name: "Om preet", rollNumber: "2400030130", role: "Core Member", domain: "Media & Broadcasting", department: "CSE" },
  { name: "SHARVANDEEP BHARDWAJ", rollNumber: "2400032427", role: "Core Member", domain: "Media & Broadcasting", department: "CSE" },

  // PUBLIC SPEAKING / SPEAKER
  { name: "NADHAM SAI PALLAVI", rollNumber: "2300030459", role: "Speaker", domain: "Public Speaking", department: "CSE" },
  { name: "YELE MOHAN SAI VAIBHAV", rollNumber: "2400030527", role: "Speaker", domain: "Public Speaking", department: "CSE" },
  { name: "Ekansh Bhalla", rollNumber: "2500030992", role: "Speaker", domain: "Public Speaking", department: "Cse" },
  { name: "GADDALA SUREKHA", rollNumber: "2500040251", role: "Speaker", domain: "Public Speaking", department: "ECE" },
  { name: "KOVVURI SREE NAGA TAPASYANI", rollNumber: "2500031137", role: "Speaker", domain: "Public Speaking", department: "CSE" },
  { name: "Salagrama Shanmukha Chintamani Sharma", rollNumber: "2400031111", role: "Speaker", domain: "Public Speaking", department: "CSE [HTE]" },
  { name: "Samarth V Ratnam", rollNumber: "2400031630", role: "Speaker", domain: "Public Speaking", department: "CSE (HTE)" },

  // TECH & INNOVATION
  { name: "Kanaparthy Praveen", rollNumber: "2400080202", role: "Core Member", domain: "Tech & Innovation", department: "AIDS- HTE" },
  { name: "VUDATA SAI RAJ TRIPADH", rollNumber: "2400032045", role: "Core Member", domain: "Tech & Innovation", department: "CSE" },
  { name: "Aditya NARAYAN", rollNumber: "2500080041", role: "Core Member", domain: "Tech & Innovation", department: "AIDS" },
  { name: "ALLURI SAI SURYA MANOJ", rollNumber: "2400031798", role: "Core Member", domain: "Tech & Innovation", department: "CSE" },
  { name: "ANANDHINI SAHU", rollNumber: "2400031855", role: "Core Member", domain: "Tech & Innovation", department: "CSE-1" },
  { name: "BORRA ROHIT SIVA KUMAR", rollNumber: "2400030643", role: "Core Member", domain: "Tech & Innovation", department: "CSE" },
  { name: "BUMIKAA V", rollNumber: "2500030593", role: "Core Member", domain: "Tech & Innovation", department: "CSE" },
  { name: "MANCHINEELLA SATYANARAYANA", rollNumber: "2500030164", role: "Core Member", domain: "Tech & Innovation", department: "CSE" },
  { name: "MOHAMMAD MOHIDDIN", rollNumber: "2400030974", role: "Core Member", domain: "Tech & Innovation", department: "Cse-1" },
  { name: "OM Prakash Jena", rollNumber: "2400030760", role: "Core Member", domain: "Tech & Innovation", department: "HTE" },
  { name: "Potlapalli Shanmukha Ganesh", rollNumber: "2400031615", role: "Core Member", domain: "Tech & Innovation", department: "CSE-1" },
  { name: "Prabhav Sinha", rollNumber: "2500080110", role: "Core Member", domain: "Tech & Innovation", department: "AIDS" },
  { name: "Reshmitha Ganne", rollNumber: "2400032437", role: "Core Member", domain: "Tech & Innovation", department: "CSE" },
  { name: "Sohan Kumar Sahu", rollNumber: "2400031488", role: "Core Member", domain: "Tech & Innovation", department: "CSE" }
];

const importData = async () => {
    await connectDB();
    try {
        let docs = [];
        let count = await Member.countDocuments();
        const existingMembers = await Member.find().select('rollNumber').lean();
        const existingRolls = new Set(existingMembers.map(m => m.rollNumber));

        for (let i = 0; i < membersData.length; i++) {
            const m = membersData[i];
            if (existingRolls.has(m.rollNumber)) {
                // We're skipping fully duplicating existings, but if they want to override, 
                // they can clear the database or handle it via admin dashboard.
                continue;
            }
            
            const email = `${m.rollNumber.trim()}@kluniversity.in`;

            docs.push({
                id: String(Date.now() + i),
                name: m.name.trim(),
                role: m.role.trim(),
                domain: m.domain ? m.domain.trim() : '',
                rollNumber: m.rollNumber.trim(),
                department: m.department ? m.department.trim() : '',
                email: email,
                status: 'Online',
                orderIndex: count++
            });
            existingRolls.add(m.rollNumber.trim());
        }

        if (docs.length > 0) {
            await Member.insertMany(docs);
            console.log(`✓ successfully inserted ${docs.length} new members.`);
        } else {
            console.log(`✓ 0 members to insert (all duplicates).`);
        }
        
        process.exit();
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
};

importData();
