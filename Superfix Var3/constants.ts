import { Hero, JobCategory } from './types';

export const INITIAL_HEROES: Hero[] = [
  {
    id: '1',
    alias: 'Căpitanul Voltaj',
    realName: 'Ion Popescu',
    category: JobCategory.ELECTRICIAN,
    description: 'Expert în instalații de înaltă tensiune și circuite domestice. Niciun scurtcircuit nu îi scapă.',
    imageUrl: 'https://picsum.photos/seed/elec1/400/600',
    hourlyRate: 150,
    trustFactor: 98,
    missionsCompleted: 342,
    phone: '0700000001',
    email: 'ion@superfix.ro',
    reviews: [
      { id: 'r1', clientName: 'Maria D.', rating: 5, comment: 'A venit, a văzut, a reparat! Super rapid.', date: '2023-10-12' },
      { id: 'r2', clientName: 'Alex B.', rating: 4, comment: 'Profesionist, dar costumul e cam strident.', date: '2023-11-05' }
    ]
  },
  {
    id: '2',
    alias: 'Aqua Man',
    realName: 'Vasile Ionescu',
    category: JobCategory.INSTALATOR,
    description: 'Stăpânul țevilor și inamicul scurgerilor. Rezolvă orice inundație în timp record.',
    imageUrl: 'https://picsum.photos/seed/plumb2/400/600',
    hourlyRate: 120,
    trustFactor: 95,
    missionsCompleted: 512,
    phone: '0700000002',
    email: 'vasile@superfix.ro',
    reviews: [
      { id: 'r3', clientName: 'Elena C.', rating: 5, comment: 'Mi-a salvat bucătăria!', date: '2023-12-01' }
    ]
  },
  {
    id: '3',
    alias: 'Mecanix Prime',
    realName: 'George Radu',
    category: JobCategory.MECANIC,
    description: 'Dacă are motor, Mecanix îl face să toarcă. Diagnosticare rapidă și reparații mobile.',
    imageUrl: 'https://picsum.photos/seed/mech3/400/600',
    hourlyRate: 200,
    trustFactor: 99,
    missionsCompleted: 120,
    phone: '0700000003',
    email: 'george@superfix.ro',
    reviews: []
  }
];

// In a real app, these would come from process.env
export const MOCK_ENV = {
  DB_HOST: 'localhost',
  DB_USER: 'admin',
  SMTP_HOST: 'smtp.superfix.ro',
};
