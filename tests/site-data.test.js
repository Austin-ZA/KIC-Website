const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const context = {
  console,
  Date,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  firebase: {
    apps: [],
    initializeApp() {},
    firestore() {
      return {
        collection() {
          return {
            doc() {
              return {
                get: async () => ({ exists: false }),
                set: async () => true
              };
            }
          };
        }
      };
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const { defaultData, sanitizeAnnouncements, normalizeStructureMembers, mergeData } = context;

assert.ok(defaultData.structures.some((item) => item.name === "Men's Ministry"), 'Men\'s Ministry should exist in the default structure list');

const mergedStructures = mergeData(null).structures.map((item) => item.name);
assert.equal(mergedStructures.filter((name) => name === 'Announcements Team' || name === 'Announcement Team').length, 1, 'announcement team should be deduplicated across singular/plural names');

const expiredAnnouncements = sanitizeAnnouncements([
  { title: 'Old event', date: '2020-01-01', body: 'Past event' },
  { title: 'Current event', date: '2099-12-31', body: 'Future event' }
]);
assert.equal(expiredAnnouncements.length, 1, 'expired announcements should be removed');
assert.equal(expiredAnnouncements[0].title, 'Current event');

const members = normalizeStructureMembers([
  'Pastor T.G NDALA - Lead Pastor',
  'Elder Mary — Assistant Pastor',
  'Brother John | Youth Leader',
  'Sister Joy',
  ''
]);
assert.equal(JSON.stringify(members), JSON.stringify([
  { name: 'Pastor T.G NDALA', role: 'Lead Pastor' },
  { name: 'Elder Mary', role: 'Assistant Pastor' },
  { name: 'Brother John', role: 'Youth Leader' },
  { name: 'Sister Joy', role: 'Member' }
]));

console.log('site-data checks passed');
