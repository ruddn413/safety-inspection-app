import imageCompression from 'browser-image-compression';

export interface Factory {
  id: number;
  name: string;
  location?: string;
}

export interface Equipment {
  id: number;
  factoryId: number;
  factory?: Factory;
  name: string;
  categoryMain?: string;
  categorySub?: string;
  categoryDetail?: string;
  specification?: string;
  capacity?: string;
  manufacturingNum?: string;
  recentPassNum?: string;
  certificationNum?: string;
  qrImageUrl?: string;
  attachmentUrl?: string;
  attachmentMemo?: string;
  certificateUrl?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  status: string;
  floorPlanId?: number | null;
  locationX?: number | null;
  locationY?: number | null;
}

export interface FloorPlan {
  id: number;
  factoryId: number;
  name: string;
  processName?: string;
  imageUrl: string;
}

export interface DashboardSummary {
  totalEquipment: number;
  overdue: number;
  approaching: number;
}

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchFactories(): Promise<Factory[]> {
  const res = await fetch('/api/factories');
  if (!res.ok) throw new Error('Failed to fetch factories');
  return res.json();
}

export async function createFactory(data: { name: string; location?: string }): Promise<Factory> {
  const res = await fetch('/api/factories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create factory');
  return res.json();
}

export async function fetchEquipment(factoryId?: number): Promise<Equipment[]> {
  const url = factoryId ? `/api/equipment?factoryId=${factoryId}` : '/api/equipment';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch equipment');
  return res.json();
}

export async function createEquipment(data: Partial<Equipment>): Promise<Equipment> {
  const res = await fetch('/api/equipment', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errText = await res.text();
    let errDetail = errText;
    try { errDetail = JSON.parse(errText).details || JSON.parse(errText).error || errText; } catch(e) {}
    throw new Error(errDetail);
  }
  return res.json();
}

export async function updateEquipment(id: number, data: Partial<Equipment>): Promise<Equipment> {
  const res = await fetch(`/api/equipment/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update equipment');
  return res.json();
}

export async function deleteEquipment(ids: number[]): Promise<{ message: string }> {
  // Wait, backend deleteEquipment is now expecting /api/equipment/:id. We need to do it one by one or change backend. 
  // Wait! I updated backend to delete by id! So this needs to be a promise.all
  await Promise.all(ids.map(id => 
    fetch(`/api/equipment/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(r => { if (!r.ok) throw new Error('Fail') })
  ));
  return { message: 'Deleted successfully' };
}

export async function uploadExcel(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/excel-import', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload excel');
  return res.json();
}

export async function uploadBulkEquipment(data: any[]): Promise<{ message: string }> {
  const res = await fetch('/api/equipment/bulk', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to upload bulk data');
  return res.json();
}

export async function uploadQrImage(file: File): Promise<{ url: string }> {
  try {
    let uploadFile = file;

    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      const compressedBlob = await imageCompression(file, options);
      uploadFile = new File([compressedBlob], file.name, { type: file.type });
    } else if (file.type === 'application/pdf') {
      if (file.size > 4.5 * 1024 * 1024) {
        alert('사내 방화벽 우회 시스템의 한계로 인해 PDF 파일은 4.5MB 이하만 업로드 가능합니다.');
        throw new Error('PDF size exceeds 4.5MB');
      }
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData
    });
    
    if (!res.ok) {
      if (res.status === 413) throw new Error('파일 크기가 너무 큽니다 (최대 4.5MB)');
      const errText = await res.text();
      let errDetail = errText;
      try {
        errDetail = JSON.parse(errText).error;
      } catch(e) {}
      throw new Error(`서버 전송 실패: ${errDetail || res.status}`);
    }
    
    const json = await res.json();
    return json;
  } catch (error: any) {
    console.error('Failed to upload file:', error);
    throw error;
  }
}

export interface LawUpdate {
  id: number;
  type: string;
  date: string;
  title: string;
  link: string;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch('/api/dashboard/summary');
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchLaws(): Promise<LawUpdate[]> {
  const res = await fetch('/api/laws?t=' + new Date().getTime());
  if (!res.ok) throw new Error('Failed to fetch laws');
  return res.json();
}

export async function fetchFloorPlans(): Promise<FloorPlan[]> {
  const res = await fetch('/api/floorplans');
  if (!res.ok) throw new Error('Failed to fetch floor plans');
  return res.json();
}

export async function createFloorPlan(data: { factoryId: number; name: string; processName?: string }, file: File): Promise<FloorPlan> {
  const formData = new FormData();
  formData.append('factoryId', data.factoryId.toString());
  formData.append('name', data.name);
  if (data.processName) formData.append('processName', data.processName);
  formData.append('image', file);
  
  const res = await fetch('/api/floorplans', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    let errDetail = errText;
    try { errDetail = JSON.parse(errText).error; } catch(e) {}
    throw new Error(`Failed to create floor plan: ${errDetail || res.status}`);
  }
  return res.json();
}

export async function updateEquipmentLocation(id: number, data: { locationX?: number | null; locationY?: number | null; floorPlanId?: number | null }): Promise<Equipment> {
  const res = await fetch(`/api/equipment/${id}/location`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update equipment location');
  return res.json();
}

export async function deleteFloorPlan(id: number): Promise<void> {
  const res = await fetch(`/api/floorplans/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete floor plan');
}
