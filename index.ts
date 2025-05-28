import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  // Hapus semua data (urutan penting karena foreign key)
  await prisma.inspectionTyre.deleteMany()
  await prisma.activityTyre.deleteMany()
  await prisma.actionTyre.deleteMany()
  await prisma.tyre.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.removePurpose.deleteMany()
  await prisma.removeReason.deleteMany()
  await prisma.airCondition.deleteMany()
  await prisma.stockTyre.deleteMany()

  console.log('✅ Semua data telah dihapus (reset data)')
}


main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })