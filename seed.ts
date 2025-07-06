import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import bcrypt from "bcryptjs";

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
    // ApiKey (anggap key unik)
    // await prisma.apiKey.upsert({
    //     where: { key: "halodek" },
    //     update: {},
    //     create: { key: "halodek" },
    // })

    // RoleUser
    const roles = ['admin', 'TCMM', 'TISM', 'inspector']
    for (const name of roles) {
        await prisma.roleUser.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    // Site
    const sites = ['TCMM', 'TISM']
    for (const name of sites) {
        await prisma.site.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    const tyreAmount = [2, 4, 6, 8, 10, 12, 20, 24]
    for (const amount of tyreAmount) {
        await prisma.unitTyreAmount.upsert({
            where: { amount },
            update: {},
            create: { amount },
        })
    }

    // Purpose (removePurpose)
    const purposes = ['SPARE', 'SCRAP', 'REPAIR', 'RETREAD', 'WARRANTY']
    for (const name of purposes) {
        await prisma.removePurpose.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    // AirCondition
    const airConditions = ['HOT', 'COLD']
    for (const name of airConditions) {
        await prisma.airCondition.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    // TyreSize
    const tyreSizes = [
        '27.00R49',
        '24.00R35',
        '16.00R25',
        '14.00R24',
        '12.00R24',
        '12.00R20',
        '11.00R20',
        '23.5R25',
        '20.5R25',
    ]
    for (const size of tyreSizes) {
        await prisma.tyreSize.upsert({
            where: { size },
            update: {},
            create: { size },
        })
    }

    const merkNames = [
        'BRIDGESTONE',
        'MAXAM',
        'AEOLUS',
        'TUTRIC',
        'UNINEST',
        'ADVANCE',
        'MICHELLIN',
        'GALAXY',
        'TECHKING',
    ]

    for (const name of merkNames) {
        await prisma.merk.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }



    // RemoveReason (id unik)
    const reasons = [
        { id: 'A', description: 'SMOOTH' },
        { id: 'B1', description: 'STONE DRILLING' },
        { id: 'C', description: 'O-RING PROBLEM' },
        { id: 'E', description: 'OUT OF ROUND, RUN OUT' },
        { id: 'F', description: 'PATCHY / SCALLOP WEAR' },
        { id: 'F1', description: 'ONE SIDE WEAR' },
        { id: 'G', description: 'DAMAGE VALVE' },
        { id: 'H', description: 'MATCHING' },
        { id: 'H1', description: 'ROLLING' },
        { id: 'I', description: 'BROKEN WHEEL FLANGE/ CRACKED RIM' },
        { id: 'J', description: 'TREAD LIFTING' },
        { id: 'J1', description: 'TREAD SEPARATION' },
        { id: 'K', description: 'FOREIGH OBJECT' },
        { id: 'L', description: 'SEIZED BRAKE' },
        { id: 'M', description: 'LOOSEN WHEEL NUT' },
        { id: 'M1', description: 'LOOSEN WHEEL HUB' },
        { id: 'N', description: 'ACCIDENTAL DAMAGE' },
        { id: 'NR', description: 'NEED TO REMOVE' },
        { id: 'P', description: 'ROCK BETWEEN DUAL' },
        { id: 'P1', description: 'SIDEWALL BULGING' },
        { id: 'P2', description: 'SIDEWALL CORD BREAKING UP' },
        { id: 'P3', description: 'SIDEWALL CRACK' },
        { id: 'P4', description: 'SIDEWALL CUT' },
        { id: 'P5', description: 'SIDEWALL CUT SEPARATION' },
        { id: 'P6', description: 'SIDEWALL IMPACT' },
        { id: 'P7', description: 'SIDEWALL REPAIR FAILURE EXT' },
        { id: 'P8', description: 'SIDEWALL REPAIR FAILURE INT' },
        { id: 'P9', description: 'SIDEWALL SEPARATION' },
        { id: 'Q', description: 'SHOULDER WEAR' },
        { id: 'Q1', description: 'SHOULDER CRACK' },
        { id: 'Q2', description: 'SHOULDER CUT' },
        { id: 'Q3', description: 'SHOULDER CUT SEPARATION' },
        { id: 'Q4', description: 'SHOULDER PATCH FAILURE' },
        { id: 'Q5', description: 'SHOULDER REPAIR FAILURE EXT' },
        { id: 'Q6', description: 'SHOULDER REPAIR FAILURE INT' },
        { id: 'Q7', description: 'SHOULDER SEPARATION' },
        { id: 'Q8', description: 'SHOULDER IMPACT' },
        { id: 'R', description: 'CENTER WEAR' },
        { id: 'S', description: 'TREAD CHIPPING' },
        { id: 'S1', description: 'TREAD CHUNKING' },
        { id: 'S2', description: 'TREAD CRACK' },
        { id: 'S3', description: 'TREAD CUT' },
        { id: 'S4', description: 'TREAD CUT SEPARATION' },
        { id: 'S6', description: 'TREAD IMPACT' },
        { id: 'S7', description: 'TREAD REPAIR FAILURE EXT' },
        { id: 'S8', description: 'TREAD REPAIR FAILURE INT' },
        { id: 'T', description: 'RADIAL CRACK' },
        { id: 'V', description: 'BEAD FATIQUE' },
        { id: 'V1', description: 'BEAD DAMAGE' },
        { id: 'V2', description: 'BEAD BULGING' },
        { id: 'V3', description: 'BEAD CORD BREAKING UP' },
        { id: 'V4', description: 'BEAD CRACK' },
        { id: 'V5', description: 'BEAD REPAIR FAILURE EXT' },
        { id: 'V6', description: 'BEAD SEPARATION' },
        { id: 'W', description: 'PRE WORN' },
        { id: 'W1', description: 'WORN IN PLY' },
        { id: 'X1', description: 'RUN FLAT' },
        { id: 'X10', description: 'INNER LINER PATCH FAILURE INT' },
        { id: 'X11', description: 'INNER LINER PATCH FAILURE EXT' },
        { id: 'X2', description: 'TUBE / FLAPPER FAILURE' },
        { id: 'X3', description: 'INNER LINER BULGING' },
        { id: 'X4', description: 'INNER LINER CRACK' },
        { id: 'X5', description: 'INNER LINER IMPACT' },
        { id: 'X7', description: 'INNER LINER REPAIR FAILURE EXT' },
        { id: 'X8', description: 'INNER LINER REPAIR FAILURE INT' },
        { id: 'X9', description: 'INNER LINER SEPARATION' },
        { id: 'Y', description: 'TREAD HEAT SEPARATION' },
        { id: 'Z', description: 'MECHANICAL MAINTENACE' },
    ]

    for (const reason of reasons) {
        await prisma.removeReason.upsert({
            where: { id: reason.id },
            update: { description: reason.description },
            create: reason,
        })
    }

    const users = [
        { name: 'administrator', password: 'admin', roleId: 1 },
        { name: 'admintcm', password: 'tcm', roleId: 2 },
        { name: 'admintis', password: 'tis', roleId: 3 },
    ];

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { name: user.name }, // unique constraint harus ada di model
            update: {
                password: hashedPassword,
                roleId: user.roleId,
            },
            create: {
                name: user.name,
                password: hashedPassword,
                roleId: user.roleId,
            },
        });
    }

    // Jika ingin insert unit, pakai upsert juga atau createMany (tanpa skipDuplicates)
    // Contoh upsert unit (commented)
    /*
    const units = [
      {
        nomorUnit: "PJ-SN 004",
        hmUnit: 6677,
        siteId: 1,
        location: "BLOK 12"
      },
      {
        nomorUnit: "PJ-SN 007",
        hmUnit: 5473,
        siteId: 1,
        location: "BLOK 10"
      }
    ]
  
    for (const unit of units) {
      await prisma.unit.upsert({
        where: { nomorUnit: unit.nomorUnit },
        update: {
          hmUnit: unit.hmUnit,
          siteId: unit.siteId,
          location: unit.location
        },
        create: unit,
      })
    }
    */
}

main()
    .then(() => {
        console.log('Seeding selesai')
        return prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('Error seeding:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
