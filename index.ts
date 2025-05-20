import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {


  await prisma.apiKey.create({
    data: {
      key: "halodek"
    },
  });

  // const unit = await prisma.unit.findUnique({
  //   where: { nomor_unit: 'PJ-SN 004' },
  // })

  // const tyre = await prisma.tyre.findUnique({
  //   where: { serialNumber: 'KA230996279' },
  // })

  // if (!unit || !tyre) {
  //   console.error('Unit atau Tyre tidak ditemukan.')
  //   return
  // }

  // // Lalu gunakan unit.hm_unit sebagai hmAtActivity saat membuat Activity
  // await prisma.activity.create({
  //   data: {
  //     tyre: { connect: { id: tyre.id } },
  //     unit: { connect: { id: unit.id } },
  //     activityType: { connect: { name: 'REMOVE' } },
  //     posisi: 5,
  //     manpower: "BETRAN,ZAKY",
  //     dateTimeStart: new Date("2025-05-14T11:00:00"),
  //     dateTimeEnd: new Date("2025-05-14T15:15:00"),
  //     kedalaman1SaatRemove: 43,
  //     kedalaman2SaatRemove: 43,
  //     hmAtActivity: unit.hm_unit, // ← Ambil dari unit
  //   },
  // });

  // console.log('TyreActivity berhasil dipopulasi.')
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