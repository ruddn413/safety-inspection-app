import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { put } from '@vercel/blob';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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
  const { factoryId, name, categoryMain, categorySub, categoryDetail, specification, capacity, manufacturingNum, recentPassNum, certificationNum, qrImageUrl, lastInspectionDate, nextInspectionDate, status } = req.body;
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
        qrImageUrl,
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

app.put('/api/equipment/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const updateData = { ...data };
    if (data.lastInspectionDate !== undefined) {
      updateData.lastInspectionDate = data.lastInspectionDate ? new Date(data.lastInspectionDate) : null;
    }
    if (data.nextInspectionDate !== undefined) {
      updateData.nextInspectionDate = data.nextInspectionDate ? new Date(data.nextInspectionDate) : null;
    }
    
    const updated = await prisma.equipment.update({
      where: { id: Number(id) },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

app.delete('/api/equipment', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No ids provided' });
  }
  try {
    await prisma.equipment.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete equipment' });
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

app.post('/api/equipment/bulk', async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Data must be an array' });
  }

  try {
    let importedCount = 0;
    
    let lastFactory = '안산공장';
    let lastName = '미분류 기계';
    let lastCategoryMain: string | null = null;

    for (const row of data) {
      const keys = Object.keys(row);
      const findKey = (keywords: string[]) => keys.find(k => 
        keywords.some(keyword => k.replace(/\s+/g, '').includes(keyword.replace(/\s+/g, '')))
      );

      const factoryKey = findKey(['공장']);
      const nameKey = findKey(['설비명', '기계명', '유해']);
      
      const categoryMainKey = findKey(['대분류', '공정', '팀']);
      const categorySubKey = findKey(['중분류', '설비분류']);
      const categoryDetailKey = findKey(['소분류', '세부분류', '비고']);
      const specKey = findKey(['규격', '형식']);
      const capKey = findKey(['용량', '등급']);
      const mNumKey = findKey(['기기제조번호', '기기번호']);
      const rNumKey = findKey(['최근합격번호', '합격번호']);
      const certNumKey = findKey(['기기인증번호', 'QR', '라벨']);
      const nextDateKey = findKey(['유효기간', '검사일']);
      const statusKey = findKey(['상태']);

      let factoryName = (factoryKey && row[factoryKey] ? row[factoryKey] : null) || lastFactory;
      lastFactory = factoryName;

      let name = nameKey && row[nameKey] ? row[nameKey] : null;
      if (!name || name === '-') name = lastName;
      
      // Standardize machine names
      if (name && name.trim() === '로봇') {
        name = '산업용로봇';
      }
      
      lastName = name;

      let categoryMain = categoryMainKey && row[categoryMainKey] ? row[categoryMainKey] : null;
      if (!categoryMain || categoryMain === '-') categoryMain = row['']; // 빈 헤더(병합셀) 처리
      if (!categoryMain || categoryMain === '-') categoryMain = lastCategoryMain;
      lastCategoryMain = categoryMain;

      if (!factoryName || !name) {
        console.log('Skipped row due to missing factory or name:', row);
        continue; 
      }

      let factory = await prisma.factory.findFirst({ where: { name: factoryName } });
      if (!factory) {
        factory = await prisma.factory.create({ data: { name: factoryName } });
      }

      const getVal = (key: string | undefined) => key && row[key] && row[key] !== '-' ? row[key] : null;

      let nextDateStr = getVal(nextDateKey);
      let lastDate = null;
      let nextDate = null;
      if (nextDateStr) {
        if (nextDateStr.includes('~')) {
          const parts = nextDateStr.split('~');
          lastDate = new Date(parts[0].trim());
          nextDate = new Date(parts[1].trim());
        } else {
          nextDate = new Date(nextDateStr.trim());
        }
      }

      await prisma.equipment.create({
        data: {
          factoryId: factory.id,
          name,
          categoryMain,
          categorySub: getVal(categorySubKey),
          categoryDetail: getVal(categoryDetailKey),
          specification: getVal(specKey),
          capacity: getVal(capKey),
          manufacturingNum: getVal(mNumKey),
          recentPassNum: getVal(rNumKey),
          certificationNum: getVal(certNumKey),
          lastInspectionDate: lastDate,
          nextInspectionDate: nextDate,
          status: getVal(statusKey) || 'ACTIVE'
        }
      });
      importedCount++;
    }
    res.json({ message: `${importedCount}건의 설비 데이터가 데이터베이스에 추가되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process bulk data' });
  }
});

app.post('/api/equipment/qr-upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
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

// --- FloorPlan API ---
app.get('/api/floorplans', async (req, res) => {
  try {
    const floorPlans = await prisma.floorPlan.findMany();
    res.json(floorPlans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch floor plans' });
  }
});

app.post('/api/floorplans', upload.single('image'), async (req, res) => {
  try {
    const { factoryId, name, processName } = req.body;
    let imageUrl = '';
    if (req.file) {
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: 'public',
      });
      imageUrl = blob.url;
    } else {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const floorPlan = await prisma.floorPlan.create({
      data: {
        factoryId: Number(factoryId),
        name,
        processName: processName || null,
        imageUrl
      }
    });
    res.status(201).json(floorPlan);
  } catch (error) {
    console.error('Error creating floor plan:', error);
    res.status(500).json({ error: 'Failed to create floor plan' });
  }
});

// Update Equipment Location
app.patch('/api/equipment/:id/location', async (req, res) => {
  const { id } = req.params;
  const { locationX, locationY, floorPlanId } = req.body;
  try {
    const eq = await prisma.equipment.update({
      where: { id: Number(id) },
      data: { 
        locationX: locationX !== undefined ? locationX : null, 
        locationY: locationY !== undefined ? locationY : null,
        floorPlanId: floorPlanId !== undefined ? floorPlanId : null
      }
    });
    res.json(eq);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update equipment location' });
  }
});

// Only listen on local dev, Vercel will export the app
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
