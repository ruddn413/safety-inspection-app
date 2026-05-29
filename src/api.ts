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

export async function fetchFactories(): Promise<Factory[]> {
  const res = await fetch('/api/factories');
  if (!res.ok) throw new Error('Failed to fetch factories');
  return res.json();
}

export async function createFactory(data: { name: string; location?: string }): Promise<Factory> {
  const res = await fetch('/api/factories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create equipment');
  return res.json();
}

export async function updateEquipment(id: number, data: Partial<Equipment>): Promise<Equipment> {
  const res = await fetch(`/api/equipment/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update equipment');
  return res.json();
}

export async function deleteEquipment(ids: number[]): Promise<{ message: string }> {
  const res = await fetch('/api/equipment', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  if (!res.ok) throw new Error('Failed to delete equipment');
  return res.json();
}

export async function uploadExcel(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/equipment/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload excel');
  return res.json();
}

export async function uploadBulkEquipment(data: any[]): Promise<{ message: string }> {
  const res = await fetch('/api/equipment/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to upload bulk data');
  return res.json();
}

export async function uploadQrImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/equipment/qr-upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload QR image');
  return res.json();
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch('/api/dashboard/summary');
  if (!res.ok) throw new Error('Failed to fetch summary');
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
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to create floor plan');
  return res.json();
}

export async function updateEquipmentLocation(id: number, data: { locationX?: number | null; locationY?: number | null; floorPlanId?: number | null }): Promise<Equipment> {
  const res = await fetch(`/api/equipment/${id}/location`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update equipment location');
  return res.json();
}
