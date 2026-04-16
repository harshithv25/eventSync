'use strict';
require('dotenv').config();
const pool = require('./src/db/pool');
const SeatCounterService = require('./src/services/seatCounter.service');
const CacheService = require('./src/services/cache.service');

async function seed() {
  console.log("Generating fresh events with new capacities...");
  try {
    // Obtain an Organizer (Create if not exists)
    const orgRes = await pool.query('SELECT organizer_id FROM organizers LIMIT 1');
    let organizer_id;
    if (orgRes.rows.length === 0) {
      const orgIns = await pool.query(`INSERT INTO organizers (name, email, phone, organization_name) VALUES ('Tech Corp', 'hello@techcorp.com', '1234567890', 'Tech Corp') RETURNING organizer_id`);
      organizer_id = orgIns.rows[0].organizer_id;
    } else {
      organizer_id = orgRes.rows[0].organizer_id;
    }

    // Obtain a Category (Create if not exists)
    const catRes = await pool.query('SELECT category_id FROM event_categories LIMIT 1');
    let category_id;
    if (catRes.rows.length === 0) {
      const catIns = await pool.query(`INSERT INTO event_categories (name, description) VALUES ('Technology', 'All things tech') RETURNING category_id`);
      category_id = catIns.rows[0].category_id;
    } else {
      category_id = catRes.rows[0].category_id;
    }

    // Dummy events dataset
    const events = [
      { title: 'Global AI Summit 2026', location: 'San Francisco, CA', date: '2026-09-15T09:00:00Z', capacity: 1500, price: 299.99 },
      { title: 'React vs Vue Masterclass', location: 'Remote / Online', date: '2026-05-20T10:00:00Z', capacity: 300, price: 49.00 },
      { title: 'Exclusive Startup Pitch Night', location: 'New York, NY', date: '2026-08-10T18:00:00Z', capacity: 30, price: 15.00 },
      { title: 'Cybersecurity BlackHat Demo', location: 'Las Vegas, NV', date: '2026-11-05T08:00:00Z', capacity: 100, price: 150.00 }
    ];

    for (const e of events) {
      const eventRes = await pool.query(`
        INSERT INTO events (organizer_id, category_id, title, description, location, date, capacity, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING event_id, capacity
      `, [organizer_id, category_id, e.title, 'Join thousands of professionals for this incredible event.', e.location, e.date, e.capacity, e.price]);
      
      const evt = eventRes.rows[0];
      
      // Stage 2/3 Feature: Prime the Redis Seat Counter so booking checks work flawlessly
      await SeatCounterService.init(evt.event_id, evt.capacity);
    }

    // Clear caches so the new events show up immediately!
    await CacheService.invalidateEventLists();
    console.log("✅ Successfully added 4 new active events!");
    
  } catch (err) {
    console.error("Seeding Error:", err);
  } finally {
    process.exit(0);
  }
}

seed();
