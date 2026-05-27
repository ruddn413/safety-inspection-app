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
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  status: string;
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

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch('/api/dashboard/summary');
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}
