import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const brands = [
  {
    name: 'Seiko',
    notification: 'Please ensure you have the original warranty card for Seiko watches.',
  },
  {
    name: 'Casio',
    notification: 'Casio requires a copy of the purchase receipt for all warranty claims.',
  },
  {
    name: 'Timex',
    notification: 'Timex warranty claims must be submitted within 30 days of the issue occurring.',
  },
  {
    name: 'Aistrup',
    notification: 'Aistrup watches have a 2-year warranty period from the date of purchase.',
  },
  {
    name: 'Fibex',
    notification: 'Fibex requires detailed photos of the issue for all warranty claims.',
  },
  {
    name: 'Others',
    notification: 'For brands not listed, please provide as much information about the purchase and issue as possible.',
  },
];

async function main() {
  console.log('Start seeding...');
  
  // Check if brands already exist
  const existingBrands = await prisma.brand.findMany();
  
  if (existingBrands.length === 0) {
    for (const brand of brands) {
      const createdBrand = await prisma.brand.create({
        data: brand,
      });
      console.log(`Created brand with id: ${createdBrand.id}`);
    }
    console.log('Seeding finished.');
  } else {
    console.log('Brands already exist. Skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });