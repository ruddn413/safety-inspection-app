import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { X, ChevronLeft, ChevronRight, Save, Loader2, UploadCloud } from 'lucide-react';
import { updateEquipment, uploadQrImage } from '../api';
import type { Equipment } from '../api';

// Worker setup for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
  onComplete: () => void;
}

export function PdfSplitterModal({ isOpen, onClose, equipmentList, onComplete }: PdfSplitterModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocJs, setPdfDocJs] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEqId, setSelectedEqId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPdfDocJs(null);
      setPdfBytes(null);
      setNumPages(0);
      setCurrentPage(1);
      setSearchQuery('');
      setSelectedEqId(null);
    }
  }, [isOpen]);

  // Load PDF when file is selected
  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        setPdfBytes(bytes);

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        setPdfDocJs(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error loading PDF:", err);
        alert("PDF 파일을 불러오는 데 실패했습니다.");
      }
    };
    loadPdf();
  }, [file]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDocJs || !canvasRef.current) return;

    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      try {
        const page = await pdfDocJs.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        // Determine scale to fit within container
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = canvas.parentElement?.clientHeight || 800;
        
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(
          containerWidth / viewport.width,
          containerHeight / viewport.height
        ) * 0.95; // 95% of container to leave margin

        const scaledViewport = page.getViewport({ scale: Math.max(scale, 0.5) }); // ensure minimum scale
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        // Ignore render cancelled errors
      }
    };

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocJs, currentPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveAndNext = async () => {
    if (!pdfBytes || !selectedEqId) return;
    setIsProcessing(true);
    
    try {
      // 1. Load the original PDF with pdf-lib
      const originalPdf = await PDFDocument.load(pdfBytes);
      
      // 2. Create a new PDF and copy only the current page (0-indexed in pdf-lib)
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(originalPdf, [currentPage - 1]);
      newPdf.addPage(copiedPage);
      
      // 3. Serialize to Blob
      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const splitFile = new File([blob], `certificate_${selectedEqId}_page${currentPage}.pdf`, { type: 'application/pdf' });
      
      // 4. Upload to server
      const uploadUrl = await uploadQrImage(splitFile);
      
      // 5. Update equipment record
      await updateEquipment(selectedEqId, { certificateUrl: uploadUrl });
      
      // 6. Go to next page or finish
      if (currentPage < numPages) {
        setCurrentPage(prev => prev + 1);
        setSearchQuery(''); // reset search for next page
        setSelectedEqId(null);
      } else {
        alert('모든 페이지 분배가 완료되었습니다!');
        onComplete();
        onClose();
      }
    } catch (err) {
      console.error("Split error:", err);
      alert('서류 저장 및 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter equipment based on search query
  const filteredEq = equipmentList.filter(eq => 
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (eq.certificationNum && eq.certificationNum.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (eq.manufacturingNum && eq.manufacturingNum.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">초고속 서류 분배기 (PDF Split & Assign)</h2>
            <p className="text-sm text-gray-500 mt-1">대용량 스캔 PDF를 페이지별로 잘라서 각 설비에 배정합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {!file ? (
            // Upload Area
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
              <div className="w-full max-w-md bg-white p-8 rounded-3xl border-2 border-dashed border-indigo-200 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">통합 스캔 PDF 파일 업로드</h3>
                <p className="text-gray-500 text-sm mb-6">여러 장의 합격증이 하나로 스캔된 PDF 파일을 선택해주세요.</p>
                <label className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm">
                  PDF 파일 선택하기
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          ) : (
            <>
              {/* Left Panel: PDF Viewer */}
              <div className="flex-1 bg-gray-900/5 flex flex-col relative border-r border-gray-200">
                {/* PDF Toolbar */}
                <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
                  <div className="text-sm font-medium text-gray-600">
                    <span className="text-indigo-600 font-bold">{currentPage}</span> / {numPages} 페이지
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1 || isProcessing}
                      className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                      disabled={currentPage >= numPages || isProcessing}
                      className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Canvas Container */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  <canvas ref={canvasRef} className="bg-white shadow-lg border border-gray-200" />
                </div>
              </div>

              {/* Right Panel: Equipment Selection */}
              <div className="w-full md:w-96 bg-white flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100 bg-indigo-50/30">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">1</span>
                    대상 설비 찾기
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">현재 보고 있는 페이지의 대상 설비를 선택하세요.</p>
                  
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="설비명, 기기번호, 합격번호 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredEq.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 text-sm">검색 결과가 없습니다.</div>
                  ) : (
                    filteredEq.slice(0, 50).map(eq => (
                      <div 
                        key={eq.id}
                        onClick={() => setSelectedEqId(eq.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedEqId === eq.id 
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                            : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold text-gray-800 text-sm truncate">{eq.name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex gap-3">
                          {eq.manufacturingNum && <span>기기번호: {eq.manufacturingNum}</span>}
                          {eq.certificationNum && <span>합격번호: {eq.certificationNum}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleSaveAndNext}
                    disabled={!selectedEqId || isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        저장 및 업로드 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        현재 페이지만 떼어서 저장
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    저장 완료 시 다음 페이지로 자동 이동합니다.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
