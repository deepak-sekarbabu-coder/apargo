const { voteOnPoll } = require('../../src/lib/firestore');

// Mock poll data
const poll = {
  id: 'poll1',
  question: 'Test Poll',
  options: [
    { id: 'opt1', text: 'Option 1' },
    { id: 'opt2', text: 'Option 2' },
  ],
  createdBy: 'admin1',
  createdAt: new Date().toISOString(),
  isActive: true,
  votes: {},
};

async function testApartmentVotingConstraint() {
  // Simulate two users from the same apartment trying to vote
  const pollId = poll.id;
  const apartmentId = 'apt1';
  try {
    await voteOnPoll(pollId, apartmentId, 'opt1');
    console.log('First vote succeeded');
    await voteOnPoll(pollId, apartmentId, 'opt2');
    console.error('Second vote should have failed but succeeded');
  } catch (e) {
    console.log('Second vote correctly failed:', e.message);
  }
}

testApartmentVotingConstraint();
