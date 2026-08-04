import React from "react";
import ExpandableCard from "../../src/components/ExpandableCard";
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";
import "./page.css";

export const dynamic = 'force-dynamic';

const ROLE_WEIGHTS = {
  'Head of the Department': 1,
  'Alternate Head of Department': 2,
  'President': 3,
  'Chief Secretary': 4,
  'Treasurer': 5,
  'Advisor': 6,
  'Chief': 10,
  'Lead': 20,
  'Core Member': 30,
  'Associate': 40,
  'Speaker': 50,
  'Member': 90,
  'Student': 100,
  'General': 100
};

// Only these domains are shown on the team page — no General
const DOMAIN_ORDER = [
  'Zero Order',
  'Advisor',
  'Protocol & Operations',
  'Tech & Innovation',
  'Creative & Content',
  'Public Speaking',
  'Media & Broadcasting',
];

export default async function TeamPage() {
  await connectDB();
  const membersData = await Member.find({}).lean();
  
  // Transform to plain objects and map to TeamCards format
  const members = membersData.map(m => ({
    name: m.name,
    role: `${m.role}  •  ${m.rollNumber}`,
    description: m.bio || m.description || 'No description provided.',
    profileLink: `/${m.id}`,
    color: m.color || '#71C4FF',
    domain: m.domain || 'General',
    rawRole: m.role
  }));

  // Group and Sort natively by Domain
  const grouped = members.sort((a, b) => {
    const wA = ROLE_WEIGHTS[a.rawRole] || 1000;
    const wB = ROLE_WEIGHTS[b.rawRole] || 1000;
    return wA - wB;
  }).reduce((acc, m) => {
    const domain = m.domain;
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(m);
    return acc;
  }, {});

  // Only show domains in DOMAIN_ORDER — General and unassigned are excluded
  const orderedEntries = [];
  for (const domain of DOMAIN_ORDER) {
    if (grouped[domain]) {
      orderedEntries.push([domain, grouped[domain]]);
    }
  }

  return (
    <div className="team-page">
      <div className="team-page__header">
        <h1 className="team-page__title">Our Team</h1>
        <p className="team-page__subtitle">
          Click on a member to learn more about them
        </p>
      </div>

      <div className="team-page__content">
        {orderedEntries.length > 0 ? (
          orderedEntries.map(([domain, cards]) => (
            <div key={domain} className="team-page__domain-section">
              <h2 className="team-page__domain-title">
                {domain}
              </h2>
              <div className="team-page__cards">
                <ExpandableCard cards={cards} />
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>No team members found.</p>
        )}
      </div>
    </div>
  );
}
