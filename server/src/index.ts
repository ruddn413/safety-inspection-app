import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as xlsx from 'xlsx';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// --- Factories API ---
app.get('/api/factories', async (req, res) => {
  try {
    const factories = await prisma.factory.findMany();
    res.json(factories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch factories' });
  }
});

app.post('/api/factories', async (req, res) => {
  const { name, location } = req.body;
  try {
    const factory = await prisma.factory.create({
      data: { name, location }
    });
    res.status(201).json(factory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create factory' });
  }
});

// --- Equipment API ---
app.get('/api/equipment', async (req, res) => {
  const { factoryId } = req.query;
  try {
    const query = factoryId ? { where: { factoryId: Number(factoryId) } } : {};
    const equipment = await prisma.equipment.findMany({
      ...query,
      include: { factory: true }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

app.post('/api/equipment', async (req, res) => {
  const { factoryId, name, categoryMain, categorySub, categoryDetail, specification, capacity, manufacturingNum, recentPassNum, certificationNum, lastInspectionDate, nextInspectionDate, status } = req.body;
  try {
    const equipment = await prisma.equipment.create({
      data: {
        factoryId: Number(factoryId),
        name,
        categoryMain,
        categorySub,
        categoryDetail,
        specification,
        capacity,
        manufacturingNum,
        recentPassNum,
        certificationNum,
        lastInspectionDate: lastInspectionDate ? new Date(lastInspectionDate) : null,
        nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
        status: status || 'ACTIVE'
      }
    });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

app.post('/api/equipment/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Expected Excel columns based on manual p.6: 
    // 공장명, 설비명, 대상품(대분류), 대상품(중분류), 대상품(소분류), 규격/형식번호, 용량/등급, 기기제조번호, 최근합격번호, 기기인증번호, 유효기간, 상태
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    let importedCount = 0;

    for (const row of data) {
      const factoryName = row['공장명'];
      const name = row['설비명'];
      
      const categoryMain = row['대상품(대분류)'];
      const categorySub = row['대상품(중분류)'];
      const categoryDetail = row['대상품(소분류)'];
      const specification = row['규격/형식번호'];
      const capacity = row['용량/등급'];
      const manufacturingNum = row['기기제조번호'];
      const recentPassNum = row['최근합격번호'];
      const certificationNum = row['기기인증번호'];
      const nextInspectionDateRaw = row['유효기간'];
      const status = row['상태'] || 'ACTIVE';

      // Required fields for our logic
      if (!factoryName || !name) continue; 

      // Find or create factory
      let factory = await prisma.factory.findFirst({ where: { name: factoryName } });
      if (!factory) {
        factory = await prisma.factory.create({ data: { name: factoryName } });
      }

      // We map 유효기간 to nextInspectionDate. lastInspectionDate could be deduced but left null if not provided.
      await prisma.equipment.create({
        data: {
          factoryId: factory.id,
          name,
          categoryMain: categoryMain !== '-' ? categoryMain : null,
          categorySub: categorySub !== '-' ? categorySub : null,
          categoryDetail: categoryDetail !== '-' ? categoryDetail : null,
          specification: specification !== '-' ? specification : null,
          capacity: capacity !== '-' ? capacity : null,
          manufacturingNum: manufacturingNum !== '-' ? manufacturingNum : null,
          recentPassNum: recentPassNum !== '-' ? recentPassNum : null,
          certificationNum: certificationNum !== '-' ? certificationNum : null,
          nextInspectionDate: nextInspectionDateRaw && nextInspectionDateRaw !== '-' ? new Date(nextInspectionDateRaw) : null,
          status
        }
      });
      importedCount++;
    }

    res.json({ message: `Successfully imported ${importedCount} equipment records.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

// Dashboard specific endpoint for summary
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const totalEquipment = await prisma.equipment.count();
    
    const overdue = await prisma.equipment.count({
      where: {
        nextInspectionDate: {
          lt: now
        }
      }
    });

    const approaching = await prisma.equipment.count({
      where: {
        nextInspectionDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      }
    });

    res.json({
      totalEquipment,
      overdue,
      approaching
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
