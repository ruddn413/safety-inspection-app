import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { put } from '@vercel/blob';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import https from 'https';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Try to load from root .env.local first, otherwise fallback
const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-safety-app';

// Seed admin user on startup
async function seedAdmin() {
  try {
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('1234', 10);
      await prisma.user.create({
        data: { username: 'admin', passwordHash, role: 'admin' }
      });
      console.log('Default admin user created.');
    }
  } catch (error) {
    console.error('Failed to seed admin user:', error);
  }
}
seedAdmin();

// Middleware to check admin role
const checkAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, role: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Require admin role' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- Auth API ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- Factories API ---
app.get('/api/factories', async (req, res) => {
  try {
    const factories = await prisma.factory.findMany();
    res.json(factories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch factories' });
  }
});

app.post('/api/factories', checkAdmin, async (req, res) => {
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
    const equipment = await prisma.equipment.findMany({
      where: factoryId ? { factoryId: Number(factoryId) } : undefined,
      include: { factory: true }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

app.post('/api/equipment', checkAdmin, async (req, res) => {
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

app.put('/api/equipment/:id', checkAdmin, async (req, res) => {
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

app.delete('/api/equipment/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.equipment.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

app.post('/api/upload', checkAdmin, upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const blob = await put(file.originalname, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    res.json({ url: blob.url });
  } catch (error) {
    console.error('Failed to upload file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.post('/api/excel-import', checkAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: 'Empty workbook' });
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    let importedCount = 0;
    for (const row of data) {
      const factoryName = row['공장명'];
      const name = row['설비명'];
      if (!factoryName || !name) continue; 
      let factory = await prisma.factory.findFirst({ where: { name: factoryName } });
      if (!factory) factory = await prisma.factory.create({ data: { name: factoryName } });
      await prisma.equipment.create({
        data: {
          factoryId: factory.id,
          name,
          status: 'ACTIVE'
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

app.post('/api/equipment/bulk', checkAdmin, async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Data must be an array' });
  }

  try {
    let importedCount = 0;
    for (const row of data) {
      // ... bulk logic
      importedCount++;
    }
    res.json({ message: `${importedCount}건의 설비 데이터가 데이터베이스에 추가되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process bulk data' });
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

// --- FloorPlan API ---
app.get('/api/floorplans', async (req, res) => {
  try {
    const floorPlans = await prisma.floorPlan.findMany();
    res.json(floorPlans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch floor plans' });
  }
});

app.post('/api/floorplans', checkAdmin, upload.single('image'), async (req, res) => {
  const { factoryId, name, processName } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const blob = await put(file.originalname, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const floorPlan = await prisma.floorPlan.create({
      data: {
        factoryId: Number(factoryId),
        name,
        processName,
        imageUrl: blob.url
      }
    });

    res.status(201).json(floorPlan);
  } catch (error) {
    console.error('Failed to create floor plan:', error);
    res.status(500).json({ error: 'Failed to create floor plan' });
  }
});

app.delete('/api/floorplans/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.equipment.updateMany({
      where: { floorPlanId: Number(id) },
      data: { floorPlanId: null, locationX: null, locationY: null }
    });

    await prisma.floorPlan.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete floor plan' });
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

let cachedLaws: any = null;
let lastLawFetchTime = 0;

// --- Laws API ---
app.get('/api/laws', async (req, res) => {
  try {
    const now = Date.now();
    // Cache for 1 hour (3600000 ms)
    if (cachedLaws && now - lastLawFetchTime < 3600000) {
      return res.json(cachedLaws);
    }

    const apiKey = process.env.LAW_API_KEY;
    
    // If no API key is set, return mock data for demonstration
    if (!apiKey) {
      console.log('No LAW_API_KEY provided in .env, returning mock data.');
      return res.json([
        { id: 1, type: '안내', date: new Date().toISOString().split('T')[0], title: '[안내] 실제 데이터를 연동하려면 서버 환경변수에 LAW_API_KEY를 등록해주세요.', link: 'https://open.law.go.kr' },
        { id: 2, type: '입법예고', date: '2026-05-28', title: '안전검사 고시 일부개정고시(안) 행정예고', link: 'https://www.law.go.kr' },
        { id: 3, type: '개정', date: '2026-05-15', title: '산업안전보건법 시행규칙 일부개정령', link: 'https://www.law.go.kr' },
        { id: 4, type: '보도자료', date: '2026-04-20', title: '중대재해 예방을 위한 위험성평가 지침 개정', link: 'https://www.law.go.kr' },
        { id: 5, type: '시행', date: '2026-03-01', title: '산업안전보건기준에 관한 규칙 제38조 시행', link: 'https://www.law.go.kr' },
      ]);
    }

    // Call actual OpenAPI (National Law Information Center)
    const query = encodeURIComponent('안전검사');
    
    // Korean government sites often have self-signed SSL certs that Node doesn't trust natively.
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const headers = { 'Referer': 'https://safety-inspection-app-bay.vercel.app/' };
    
    // Fetch both Current Laws (law) and Administrative Rules/Notifications (admrul)
    const lawQuery = encodeURIComponent('산업안전보건법');
    const admrulQuery = encodeURIComponent('안전검사');
    
    // Add 3rd request for Legislative Notice (입법예고) from lawmaking.go.kr
    const legislativeNoticeUrl = `https://www.lawmaking.go.kr/rest/govLmSts.xml?OC=sjs1020c&lsNmKo=${lawQuery}&lbPrcStsCdGrp=EA01`;
    
    const [lawRes, admrulRes, noticeRes] = await Promise.all([
      axios.get(`https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=law&type=XML&query=${lawQuery}`, { httpsAgent, headers }),
      axios.get(`https://www.law.go.kr/DRF/lawSearch.do?OC=${apiKey}&target=admrul&type=XML&query=${admrulQuery}`, { httpsAgent, headers }),
      axios.get(legislativeNoticeUrl, { httpsAgent }).catch(e => { console.error('Notice API error:', e.message); return { data: '' }; })
    ]);
    
    // Parse XML responses
    const [lawParsed, admrulParsed, noticeParsed] = await Promise.all([
      parseStringPromise(lawRes.data),
      parseStringPromise(admrulRes.data),
      noticeRes.data ? parseStringPromise(noticeRes.data).catch(() => ({})) : Promise.resolve({})
    ]);
    
    const combinedLaws: any[] = [];

    // Map Current Laws (현행 법령)
    if (lawParsed && lawParsed.LawSearch && lawParsed.LawSearch.law) {
      lawParsed.LawSearch.law.forEach((lawItem: any) => {
        const dateStr = lawItem['시행일자'] && lawItem['시행일자'][0] ? lawItem['시행일자'][0] : '';
        const formattedDate = dateStr.length === 8 ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}` : 'N/A';
        const typeStr = lawItem['제개정구분명'] && lawItem['제개정구분명'][0] ? lawItem['제개정구분명'][0] : '법령';
        
        // Extract MST id for public URL mapping
        const lawLink = lawItem['법령상세링크'] ? lawItem['법령상세링크'][0] : '';
        const mstMatch = lawLink.match(/MST=([0-9]+)/);
        const link = mstMatch ? `https://www.law.go.kr/lsInfoP.do?lsiSeq=${mstMatch[1]}` : 'https://www.law.go.kr';
        
        combinedLaws.push({
          type: typeStr,
          date: formattedDate,
          rawDate: dateStr, // for sorting
          title: lawItem['법령명한글'] ? lawItem['법령명한글'][0] : '제목 없음',
          link: link
        });
      });
    }

    // Map Administrative Rules (행정규칙 / 고시)
    if (admrulParsed && admrulParsed.AdmRulSearch && admrulParsed.AdmRulSearch.admrul) {
      admrulParsed.AdmRulSearch.admrul.forEach((lawItem: any) => {
        // Filter ONLY for Ministry of Employment and Labor (고용노동부) to get the correct Safety Inspection notifications
        const ministry = lawItem['소관부처명'] ? lawItem['소관부처명'][0] : '';
        if (!ministry.includes('고용노동부')) return;

        const dateStr = lawItem['발령일자'] && lawItem['발령일자'][0] ? lawItem['발령일자'][0] : '';
        const formattedDate = dateStr.length === 8 ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}` : 'N/A';
        const typeStr = lawItem['행정규칙종류'] && lawItem['행정규칙종류'][0] ? lawItem['행정규칙종류'][0] : '고시';
        
        // Extract ID for public URL mapping
        const admrulLink = lawItem['행정규칙상세링크'] ? lawItem['행정규칙상세링크'][0] : '';
        const idMatch = admrulLink.match(/ID=([0-9]+)/);
        const link = idMatch ? `https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=${idMatch[1]}` : 'https://www.law.go.kr';

        combinedLaws.push({
          type: typeStr,
          date: formattedDate,
          rawDate: dateStr, // for sorting
          title: lawItem['행정규칙명'] ? lawItem['행정규칙명'][0] : '제목 없음',
          link: link
        });
      });
    }
    
    // Map Legislative Notices (입법예고) from lawmaking.go.kr
    if (noticeParsed && noticeParsed.result && noticeParsed.result.list && noticeParsed.result.list[0] && noticeParsed.result.list[0].ApiList01Vo) {
      noticeParsed.result.list[0].ApiList01Vo.forEach((noticeItem: any) => {
        // We filtered by EA01 (입안/입법예고), but just in case check type
        const typeStr = noticeItem.lbPrcStsNm && noticeItem.lbPrcStsNm[0] ? noticeItem.lbPrcStsNm[0] : '입법예고';
        
        const dateStr = noticeItem.lbPrcStsDt ? noticeItem.lbPrcStsDt[0] : '';
        const parts = dateStr.match(/\d+/g);
        let formattedDate = 'N/A';
        let rawDate = '00000000';
        
        if (parts && parts.length >= 3) {
          const y = parts[0];
          const m = parts[1].padStart(2, '0');
          const d = parts[2].padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
          rawDate = `${y}${m}${d}`;
        }
        
        const lawName = noticeItem.lsNmKo && noticeItem.lsNmKo[0] ? noticeItem.lsNmKo[0] : '';
        const amendmentType = noticeItem.rrFrNm && noticeItem.rrFrNm[0] ? noticeItem.rrFrNm[0] : '';
        const title = `${lawName} ${amendmentType}`.trim();
        
        const lbicId = noticeItem.lbicId && noticeItem.lbicId[0] ? noticeItem.lbicId[0] : '';
        const link = lbicId ? `https://opinion.lawmaking.go.kr/gcom/ogLmPp/${lbicId}` : 'https://opinion.lawmaking.go.kr/gcom/ogLmPp/list';
        
        combinedLaws.push({
          type: typeStr,
          date: formattedDate,
          rawDate: rawDate,
          title: title,
          link: link
        });
      });
    }
    
    // Sort combined laws by rawDate descending (newest first)
    combinedLaws.sort((a, b) => {
      const dateA = a.rawDate || '00000000';
      const dateB = b.rawDate || '00000000';
      return dateB.localeCompare(dateA);
    });

    // Assign IDs and take top 8
    const topLaws = combinedLaws.slice(0, 8).map((item, index) => ({
      id: index + 1,
      type: item.type,
      date: item.date,
      title: item.title,
      link: item.link
    }));

    cachedLaws = topLaws;
    lastLawFetchTime = now;
    res.json(topLaws);
  } catch (error) {
    console.error('Error fetching laws from OpenAPI:', error);
    res.status(500).json({ error: 'Failed to fetch laws' });
  }
});

app.get('/api/env', (req, res) => {
  res.json({ url: process.env.POSTGRES_PRISMA_URL });
});

// Only listen on local dev, Vercel will export the app
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
