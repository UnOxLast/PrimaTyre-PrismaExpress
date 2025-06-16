import { PrismaClient, Tyre } from "@prisma/client";
import { Request, Response } from "express";
import ExcelJS from 'exceljs';
import { formatInTimeZone } from 'date-fns-tz'; // Install date-fns-tz if not already installed


const activityClient = new PrismaClient().activityTyre;
const tyreClient = new PrismaClient().tyre
const prismaClient = new PrismaClient();

//getAllActivity
export const getAllActivityTyre = async (req: Request, res: Response) => {
    try {
        const activities = await activityClient.findMany({
            include: {
                inspections: {
                    include: {
                        actionTyre: true, // Jika ingin info actionTyre terkait
                    }
                }
            },
            orderBy: {
                dateTimeWork: 'asc',
            },
        });
        res.status(200).json({ data: activities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve activities' });
    }
};

//getActivityByTyreId
export const getActivityByTyreId = async (req: Request, res: Response) => {
    try {
        const tyreId = Number(req.params.id);
        if (!tyreId) {
            res.status(400).json({ error: 'Invalid tyre ID' });
            return;
        }

        // Ambil data tyre beserta stockTyre-nya
        const tyre = await tyreClient.findUnique({
            where: { id: tyreId },
            include: {
                stockTyre: {
                    include: {
                        merk: true,
                        tyreSize: true
                    }
                },
                installedUnit: true
            }
        });


        if (!tyre) {
            res.status(404).json({ error: 'Tyre not found' });
            return;
        }

        // Ambil semua activity yang melibatkan tyre ini
        const activities = await activityClient.findMany({
            where: {
                OR: [
                    { installedTyreId: tyreId },
                    { removedTyreId: tyreId }
                ]
            },
            orderBy: {
                dateTimeWork: 'asc'
            },
            include: {
                installedTyre: true,
                removedTyre: true,
                unit: true,
                removePurpose: true,
                airCondition: true,
                inspections: {
                    include: {
                        removePurpose: true, // Jika ingin info removePurpose terkait
                        actionTyre: {
                            include: {
                                removePurpose: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            tyre,
            stockTyre: tyre.stockTyre,
            activities
        });

    } catch (error: any) {
        console.error("Failed to get activity history:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};

//activityTyre
export const createActivityTyre = async (req: Request, res: Response) => {
    try {
        const {
            unitId,
            hmAtActivity,
            kmAtActivity,
            location,
            removedTyreId,
            tread1Remove,
            tread2Remove,
            removeReasonId,
            removePurposeId,
            installedTyreId,
            tread1Install,
            tread2Install,
            airConditionId,
            airPressure,
            manpower,
            dateTimeWork,
            dateTimeDone,
            tyrePosition // posisi ban pada unit (1-based)
        } = req.body;

        const result = await prismaClient.$transaction(async (tx) => {
            // 1. Validasi Unit
            const unit = await tx.unit.findUnique({
                where: { id: unitId },
                include: {
                    tyres: true // relasi ke UnitTyrePosition
                }
            });
            if (!unit) throw new Error("Unit not found");

            // 2. Validasi posisi dan ban yang dilepas
            let positionToUse = tyrePosition;
            let removedPosition: number | undefined = undefined;

            if (removedTyreId) {
                const pos = unit.tyres.find((pos) => pos.tyreId === removedTyreId);
                if (!pos) throw new Error("Removed tyre is not currently installed in this unit");
                removedPosition = pos.position === null ? undefined : pos.position;
                // Jika posisi tidak diberikan, gunakan posisi dari DB
                if (!positionToUse) positionToUse = removedPosition;
            }

            // 3. Update posisi ban pada UnitTyrePosition
            if (removedTyreId && positionToUse) {
                // Kosongkan posisi lama (hapus atau set tyreId ke null)
                await tx.unitTyrePosition.updateMany({
                    where: { unitId, position: positionToUse, tyreId: removedTyreId },
                    data: { tyreId: { set: null } }
                });
            }
            if (installedTyreId && positionToUse) {
                // Pasang ban baru di posisi tersebut
                await tx.unitTyrePosition.upsert({
                    where: {
                        unitId_position: {
                            unitId,
                            position: positionToUse
                        }
                    },
                    update: { tyreId: installedTyreId },
                    create: {
                        unitId,
                        position: positionToUse,
                        tyreId: installedTyreId
                    }
                });
            }

            // 4. Ambil data tread dari Tyre jika tidak diisi
            const removedTyre = removedTyreId
                ? await tx.tyre.findUnique({ where: { id: removedTyreId }, select: { tread1: true, tread2: true } })
                : null;

            const installedTyre = installedTyreId
                ? await tx.tyre.findUnique({ where: { id: installedTyreId }, select: { tread1: true, tread2: true } })
                : null;

            // 5. Update status Tyre yang dilepas
            if (removedTyreId) {
                await tx.tyre.update({
                    where: { id: removedTyreId },
                    data: {
                        tread1: tread1Remove ?? removedTyre?.tread1 ?? undefined,
                        tread2: tread2Remove ?? removedTyre?.tread2 ?? undefined,
                        isReady: false,
                        isInstalled: false,
                        installedUnitId: null,
                        positionTyre: null,
                        removedPurposeId: removePurposeId,
                        dateTimeWork: new Date(dateTimeDone),
                    }
                });
            }

            // 6. Update status Tyre yang dipasang
            if (installedTyreId) {
                await tx.tyre.update({
                    where: { id: installedTyreId },
                    data: {
                        tread1: tread1Install ?? installedTyre?.tread1 ?? undefined,
                        tread2: tread2Install ?? installedTyre?.tread2 ?? undefined,
                        isReady: false,
                        isInstalled: true,
                        installedUnitId: unitId,
                        positionTyre: positionToUse,
                        removedPurposeId: null,
                    }
                });
            }

            // 6. Update Unit jika ada perubahan HM/KM/Location
            const unitUpdateData: any = {};
            if (unit.hmUnit !== hmAtActivity) unitUpdateData.hmUnit = hmAtActivity;
            if (unit.kmUnit !== kmAtActivity) unitUpdateData.kmUnit = kmAtActivity;
            if (location && unit.location !== location) unitUpdateData.location = location;
            if (Object.keys(unitUpdateData).length > 0) {
                await tx.unit.update({
                    where: { id: unitId },
                    data: unitUpdateData
                });
            }

            // 7. Simpan log aktivitas
            const newActivity = await tx.activityTyre.create({
                data: {
                    unitId,
                    hmAtActivity,
                    kmAtActivity,
                    location: location || undefined,
                    removedTyreId,
                    tread1Remove: tread1Remove ?? removedTyre?.tread1 ?? undefined,
                    tread2Remove: tread2Remove ?? removedTyre?.tread2 ?? undefined,
                    removeReasonId,
                    removePurposeId,
                    installedTyreId,
                    tread1Install: tread1Install ?? installedTyre?.tread1 ?? undefined,
                    tread2Install: tread2Install ?? installedTyre?.tread2 ?? undefined,
                    airConditionId,
                    airPressure,
                    manpower,
                    dateTimeWork: new Date(dateTimeWork),
                    dateTimeDone: dateTimeDone ? new Date(dateTimeDone) : null,
                    tyrePosition: positionToUse
                }
            });

            // 8. Jika ban dilepas, hitung total HM/KM pemakaian dan update ke ban
            if (removedTyreId) {
                const allInstalled = await tx.activityTyre.findMany({
                    where: {
                        installedTyreId: removedTyreId,
                        tyrePosition: positionToUse,
                        unitId: unitId,
                        hmAtActivity: { not: undefined },
                        kmAtActivity: { not: undefined }
                    },
                    orderBy: { dateTimeWork: 'asc' }
                });

                const allRemoved = await tx.activityTyre.findMany({
                    where: {
                        removedTyreId: removedTyreId,
                        tyrePosition: positionToUse,
                        unitId: unitId,
                        hmAtActivity: { not: undefined },
                        kmAtActivity: { not: undefined }
                    },
                    orderBy: { dateTimeWork: 'asc' }
                });

                // Ambil nilai oHM dan oKM dari StockTyre
                const tyreWithStock = await tx.tyre.findUnique({
                    where: { id: removedTyreId },
                    include: {
                        stockTyre: {
                            select: {
                                oHM: true,
                                oKM: true,
                            }
                        }
                    }
                });

                let totalHM = tyreWithStock?.stockTyre?.oHM || 0;
                let totalKM = tyreWithStock?.stockTyre?.oKM || 0;

                const len = Math.min(allInstalled.length, allRemoved.length);
                for (let i = 0; i < len; i++) {
                    const iHM = allInstalled[i].hmAtActivity || 0;
                    const rHM = allRemoved[i].hmAtActivity || 0;
                    totalHM += rHM - iHM;

                    const iKM = allInstalled[i].kmAtActivity || 0;
                    const rKM = allRemoved[i].kmAtActivity || 0;
                    totalKM += rKM - iKM;
                }

                await tx.tyre.update({
                    where: { id: removedTyreId },
                    data: {
                        hmTyre: totalHM,
                        kmTyre: totalKM,
                    }
                });
            }

            // 9. Buat InspectionTyre untuk ban yang dilepas/dipasang
            let installDate: Date | undefined = undefined;
            let removeDate: Date | undefined = undefined;

            if (removedTyreId) {
                const lastInstall = await tx.activityTyre.findFirst({
                    where: {
                        installedTyreId: removedTyreId,
                        unitId: unitId,
                        tyrePosition: positionToUse,
                    },
                    orderBy: { dateTimeWork: 'desc' },
                });

                installDate = lastInstall?.dateTimeWork ?? undefined;
                removeDate = dateTimeWork ? new Date(dateTimeWork) : new Date();
            }

            if (installedTyreId) {
                installDate = dateTimeWork ? new Date(dateTimeWork) : new Date();
            }

            const tyreForInspection = removedTyreId
                ? await tx.tyre.findUnique({ where: { id: removedTyreId } })
                : installedTyreId
                    ? await tx.tyre.findUnique({ where: { id: installedTyreId } })
                    : null;

            if (tyreForInspection) {
                await tx.inspectionTyre.create({
                    data: {
                        tyreId: tyreForInspection.id,
                        activityTyreId: newActivity.id,
                        unitId: newActivity.unitId || null,
                        positionTyre: positionToUse,
                        treadRemaining: tyreForInspection.tread1 ?? undefined,
                        ageTotal: tyreForInspection.hmTyre,
                        installDate,
                        removeDate,
                        removePurposeId: removePurposeId ?? undefined,
                        dateTimeIn: dateTimeWork ? new Date(dateTimeWork) : new Date(),
                        // ...field lain default/null
                    }
                });
            }

            return newActivity;
        });

        res.status(201).json({ message: "Activity Created Successfully", result });
    } catch (error: any) {
        console.error("Failed to create activity:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};

//exportActivityToExcel
export const exportActivityToExcel = async (req: Request, res: Response) => {
    try {
        const { siteId, startDate, endDate, roleId } = req.body;

        // Validasi input
        if (roleId !== 1 && !siteId) {
            res.status(400).json({ error: 'siteId is required for non-admin roles' });
            return;
        }

        const filters: any = {};
        if (roleId !== 1) {
            filters.unit = { siteId: Number(siteId) };
        }

        // Jika tanggal tidak diberikan, gunakan hari ini
        const today = new Date();
        if (!startDate && !endDate) {
            filters.dateTimeWork = {
                gte: new Date(today.setHours(0, 0, 0, 0)), // Awal hari ini
                lte: new Date(today.setHours(23, 59, 59, 999)), // Akhir hari ini
            };
        } else if (startDate && !endDate) {
            const start = new Date(startDate as string);
            filters.dateTimeWork = {
                gte: new Date(start.setHours(0, 0, 0, 0)), // Awal hari
                lte: new Date(start.setHours(23, 59, 59, 999)), // Akhir hari
            };
        } else {
            filters.dateTimeWork = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        const activities = await activityClient.findMany({
            where: filters,
            include: {
                unit: { include: { site: true } },
                removedTyre: {
                    include: {
                        stockTyre: {
                            include: { merk: true, tyreSize: true }
                        }
                    }
                },
                installedTyre: {
                    include: {
                        stockTyre: {
                            include: { merk: true, tyreSize: true }
                        }
                    }
                },
                removeReason: true,
                removePurpose: true,
                airCondition: true,
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ActivityTyre');


        // Merge kolom header utama
        worksheet.mergeCells('A1:A2'); // SITE
        worksheet.mergeCells('B1:B2'); // TANGGAL JAM PENGERJAAN
        worksheet.mergeCells('C1:C2'); // NOMOR UNIT
        worksheet.mergeCells('D1:D2'); // HM UNIT
        worksheet.mergeCells('E1:E2'); // LOKASI
        worksheet.mergeCells('F1:F2'); // POSISI TYRE

        worksheet.mergeCells('G1:M1'); // REMOVE group
        worksheet.mergeCells('N1:T1'); // INSTALL group

        worksheet.mergeCells('U1:U2'); // MANPOWER
        worksheet.mergeCells('V1:V2'); // TANGGAL JAM SELESAI

        // Header utama (baris 1)
        worksheet.getCell('A1').value = 'SITE'
        worksheet.getCell('B1').value = 'TANGGAL JAM PENGERJAAN'
        worksheet.getCell('C1').value = 'NOMOR UNIT'
        worksheet.getCell('D1').value = 'HM UNIT'
        worksheet.getCell('E1').value = 'LOKASI'
        worksheet.getCell('F1').value = 'POSISI TYRE'
        worksheet.getCell('G1').value = 'REMOVE TYRE'
        worksheet.getCell('N1').value = 'INSTALL TYRE'
        worksheet.getCell('U1').value = 'MANPOWER'
        worksheet.getCell('V1').value = 'TANGGAL JAM SELESAI'

        //'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'ALASAN DILEPAS', 'DIPOSISIKAN UNTUK',
        //     'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'PSI', 'KONDISI TEKANAN',
        // Sub-header (baris 2)
        const removeHeaders = [
            'SN TYRE', 'SIZE TYRE',
            'MERK & PATTERN TYRE', 'TREAD TYRE', 'HM/KM TYRE',
            'ALASAN DILEPAS', 'DISPOSISI UNTUK'
        ]
        removeHeaders.forEach((text, i) => {
            worksheet.getCell(2, 7 + i).value = text // Kolom I (9) sampai Q (17)
        })

        const installHeaders = [
            'SN TYRE', 'SIZE TYRE', 'MERK & PATTERN TYRE',
            'TREAD TYRE', 'HM/KM TYRE', 'KONDISI TEKANAN ANGIN', 'PRESSURE (Psi)'
        ]
        installHeaders.forEach((text, i) => {
            worksheet.getCell(2, 14 + i).value = text // Kolom R (18) sampai X (24)
        })
            ;['G1'].forEach((cell) => {
                worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' }
                worksheet.getCell(cell).font = { bold: true, color: { argb: 'FFFFFFFF' } }
                worksheet.getCell(cell).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF3333' } // merah gelap
                }
            })
            ;['N1'].forEach((cell) => {
                worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' }
                worksheet.getCell(cell).font = { bold: true, color: { argb: 'FFFFFFFF' } }
                worksheet.getCell(cell).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '228B22' } // merah gelap
                }
            })

        const allBorders = {
            top: { style: 'thin' as ExcelJS.BorderStyle },
            left: { style: 'thin' as ExcelJS.BorderStyle },
            bottom: { style: 'thin' as ExcelJS.BorderStyle },
            right: { style: 'thin' as ExcelJS.BorderStyle },
        };

        // // Header styling
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } } // biru
            cell.border = allBorders
        })
        worksheet.getRow(2).eachCell((cell) => {
            cell.font = { bold: true }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } } // ungu muda
            cell.border = allBorders
        })

        worksheet.columns = [
            { key: 'site', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'dateTimeWork', width: 25, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // TANGGAL JAM PENGERJAAN
            { key: 'nomorUnit', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // NOMOR UNIT
            { key: 'hmUnit', width: 10, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // HM UNIT
            { key: 'location', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // LOKASI
            { key: 'tyrePosition', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } }, // POSISI TYRE

            // REMOVE
            { key: 'removeSN', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeSize', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeMerk', width: 30, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeTread', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeHMKM', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removeReason', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'removePurpose', width: 25, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },

            // INSTALL
            { key: 'installSN', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installSize', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installMerk', width: 30, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installTread', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'installHMKM', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'airPressure', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'airCondition', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },

            { key: 'manpower', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
            { key: 'dateTimeDone', width: 25, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
        ]






        // worksheet.getRow(1).height = 25
        // worksheet.getRow(2).height = 20

        // //header
        // worksheet.getCell('A1').value = 'SITE'
        // worksheet.getCell('B1').value = 'TANGGAL JAM PENGERJAAN'
        // worksheet.getCell('C1').value = 'NOMOR UNIT'
        // worksheet.getCell('D1').value = 'HM UNIT'
        // worksheet.getCell('E1').value = 'LOKASI'
        // worksheet.getCell('F1').value = 'POSISI TYRE'
        // worksheet.getCell('U1').value = 'MANPOWER'
        // worksheet.getCell('V1').value = 'TANGGAL JAM SELESAI'

        // // Header Group Labels (bold, caps, colored)
        // worksheet.getCell('G1').value = 'REMOVE'
        // worksheet.getCell('N1').value = 'INSTALL'



        // // Sub-headers (baris ke-2)
        // worksheet.getRow(2).values = [
        //     '',
        //     '',
        //     '',
        //     '',
        //     '',
        //     'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'ALASAN DILEPAS', 'DIPOSISIKAN UNTUK',
        //     'SN', 'SIZE', 'MERK & PATTERN', 'TREAD', 'HM/KM', 'PSI', 'KONDISI TEKANAN',
        //     '', ''
        // ]



        // // ExcelJS BorderStyle expects specific string literals, not just any string.
        // // Use 'thin' as type: BorderStyle
        // const allBorders = {
        //     top: { style: 'thin' as ExcelJS.BorderStyle },
        //     left: { style: 'thin' as ExcelJS.BorderStyle },
        //     bottom: { style: 'thin' as ExcelJS.BorderStyle },
        //     right: { style: 'thin' as ExcelJS.BorderStyle },
        // };
        // // Style baris sub-header
        // worksheet.getRow(1).eachCell((cell) => {
        //     cell.border = allBorders
        // })
        // worksheet.getRow(2).eachCell((cell) => {
        //     cell.border = allBorders
        //     cell.alignment = { vertical: 'middle', horizontal: 'center' }
        //     cell.font = { bold: true }
        //     cell.fill = {
        //         type: 'pattern',
        //         pattern: 'solid',
        //         fgColor: { argb: 'FFE5E5E5' } // abu terang
        //     }
        // })


        activities.forEach((activity) => {
            const formatDateTime = (date: Date | null | undefined) => {
                if (!date) return '';
                return formatInTimeZone(date, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
            };

            const row = {
                site: activity.unit?.site?.name,
                dateTimeWork: formatDateTime(activity.dateTimeWork), // Format to Jakarta timezone
                nomorUnit: activity.unit?.nomorUnit,
                hmUnit: activity.hmAtActivity,
                location: activity.location,
                tyrePosition: activity.tyrePosition,

                removeSN: activity.removedTyre?.stockTyre?.serialNumber || '',
                removeSize: activity.removedTyre?.stockTyre?.tyreSize?.size || '',
                removeMerk: `${activity.removedTyre?.stockTyre?.merk?.name || ''} - ${activity.removedTyre?.stockTyre?.pattern || ''}`,
                removeTread: `${activity.tread1Remove || ''}/${activity.tread2Remove || ''}`,
                removeHMKM: `${activity.removedTyre?.hmTyre || ''}/${activity.removedTyre?.kmTyre || ''}`,
                removeReason: activity.removeReason?.description || '',
                removePurpose: activity.removePurpose?.name || '',

                installSN: activity.installedTyre?.stockTyre?.serialNumber || '',
                installSize: activity.installedTyre?.stockTyre?.tyreSize?.size || '',
                installMerk: `${activity.installedTyre?.stockTyre?.merk?.name || ''} - ${activity.installedTyre?.stockTyre?.pattern || ''}`,
                installTread: `${activity.tread1Install || ''}/${activity.tread2Install || ''}`,
                installHMKM: `${activity.installedTyre?.hmTyre || '0'}/${activity.installedTyre?.kmTyre || '0'}`,
                airPressure: activity.airPressure || '',
                airCondition: activity.airCondition?.name || '',

                manpower: activity.manpower || '',
                dateTimeDone: formatDateTime(activity.dateTimeDone), // Format to Jakarta timezone
            };

            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=activity_tyre.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal membuat file Excel' });
    }
};




