const mongoose = require('mongoose');
const Concert = require('./models/concertModel');


const events = [
    {
        title: 'A whole New Vibe',
        name: 'Thirumali',
        description: 'Feel the thunder with the top rock bands this summer',
        image: '/images/A Whole New Vibe.jpg',
        date: new Date('2025-06-15'),
        venue: 'Bangalore Palace Grounds',
        price: 1500,
        available: 500,
            published: true

    },
    {
        title: 'Appo Canada',
        name: 'Fejo',
        description: 'Feel the thunder with the top rock bands this summer',
        image: '/images/Appo Canada.jpg',
        date: new Date('2025-07-20'),
        venue: 'Jawaharlal Nehru Stadium, Delhi',
        price: 1500,
        available: 500,
            published: true

    },
    {
        title: 'Dont Loose',
        name: 'Hanumankind',
        description: 'Feel the thunder the top rock bands this summer',
        image: './images/Hanumankind.jpg',
        date: new Date('2025-08-16'),
        venue: 'Jawaharlal Nehru Stadium, Delhi',
        price: 1500,
        available: 500,
            published: true

    }
];

async function seedDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/my_db');

    await Event.deleteMany({});
        console.log('Cleared existing events');


    await Event.insertMany(events);
        console.log(`Inserted ${events.length} events`);


    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDB();