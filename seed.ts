import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {

    // RoleUser
    await prisma.roleUser.createMany({
        data: [
            { name: 'admin' },
            { name: 'worker' },
            { name: 'reviewer' }
        ],
        skipDuplicates: true,
    })

    // Activity Types
    await prisma.activityType.createMany({
        data: [
            { name: 'INSTALL' },
            { name: 'REMOVE' },
        ],
        skipDuplicates: true,
    })

    // Site
    await prisma.site.createMany({
        data: [
            { name: 'TCM' },
            { name: 'TIS' }
        ],
        skipDuplicates: true
    })

    // Purpose
    await prisma.removePurpose.createMany({
        data: [
            { name: 'SPARE' },
            { name: 'SCRAP' },
            { name: 'REPAIR' },
            { name: 'RETREAD' },
            { name: 'WARRANTY' },
        ],
        skipDuplicates: true,
    })

    // Air Condition
    await prisma.airCondition.createMany({
        data: [
            { name: 'HOT' },
            { name: 'COLD' },
        ],
        skipDuplicates: true,
    })


    //sizeTyre
    await prisma.tyreSize.createMany({
        data: [
            { size: '27.00R49' },
            { size: '24.00R35' },
            { size: '16.00R25' },
            { size: '14.00R24' },
            { size: '12.00R24' },
            { size: '12.00R20' },
            { size: '11.00R20' },
            { size: '23.5R25' },
            { size: '20.5R25' },
        ],
        skipDuplicates: true,
    })

    //removeReason
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
    await prisma.removeReason.createMany({
        data: reasons,
        skipDuplicates: true,
    })

    //user
    await prisma.user.createMany({
        data: [
            {
                name: 'adminpertama',
                password: 'proteksi',
                roleId: 1, // Pastikan roleId 1 = Admin
            },
            {
                name: 'workerpertama',
                password: 'pekerja',
                roleId: 2, // Misalnya roleId 2 = Worker
            },
            {
                name: 'reviewerpertama',
                password: 'pemantau',
                roleId: 3, // Misalnya roleId 3 = Reviewer
            }
        ],
        skipDuplicates: true, // Supaya tidak error kalau sudah ada
    })

    //unit
    await prisma.unit.createMany({
        data: [
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
                location: "BLOK 12"
            },
            {
                nomorUnit: "PJ-DT 109",
                hmUnit: 3990,
                siteId: 1,
            },
        ],
        skipDuplicates: true
    })
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

