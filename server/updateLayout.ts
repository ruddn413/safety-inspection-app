import fs from 'fs';

function updateLayout() {
  const file = 'c:/Users/82106/safety-inspection-app/src/components/Dashboard.tsx';
  let content = fs.readFileSync(file, 'utf-8');
  
  // Create the new layout block
  const newBlock = `      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Col: Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">공정(팀)별 설비 보유 현황</h3>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => \`\${name} \${(percent * 100).toFixed(0)}%\`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle Col: Equipment by Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" /> 설비 종류별 현황
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {barData.map((item, idx) => {
              const colors = [
                { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-100', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
                { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-100', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
                { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-100', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
                { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-100', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
                { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-100', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
              ];
              const colorTheme = colors[idx % colors.length];
              
              const getIcon = () => {
                if (item.name.includes('컨베이어')) return <ConveyorIcon className={\`w-6 h-6 \${colorTheme.icon}\`} />;
                if (item.name.includes('로봇')) return <Bot className={\`w-6 h-6 \${colorTheme.icon}\`} />;
                if (item.name.includes('압력용기')) return <Cylinder className={\`w-6 h-6 \${colorTheme.icon}\`} />;
                return <Settings className={\`w-6 h-6 \${colorTheme.icon}\`} />;
              };

              return (
                <div 
                  key={item.name} 
                  className={\`bg-white rounded-2xl p-4 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default group overflow-hidden relative flex items-center justify-between \${colorTheme.border} \${colorTheme.hover}\`}
                >
                  <div className={\`absolute -right-4 -top-4 w-24 h-24 rounded-full \${colorTheme.bg} opacity-50 group-hover:scale-[2] transition-transform duration-700 ease-out\`}></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={\`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-white border \${colorTheme.border} group-hover:scale-110 transition-transform duration-300 shrink-0\`}>
                      {getIcon()}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-600">{item.name}</h4>
                  </div>
                  <div className="relative z-10 flex items-baseline gap-1.5 text-right">
                    <span className={\`text-2xl font-bold \${colorTheme.text}\`}>{item.count}</span>
                    <span className="text-xs font-medium text-gray-400">대</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: D-Day List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              검사 도래 임박 설비
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-semibold">Top 8</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {upcomingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
                <p>당분간 검사가 필요한 설비가 없습니다.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {upcomingList.map((eq, i) => {
                  const isUrgent = eq.dDay <= 30;
                  return (
                    <li key={eq.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-default">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate">{eq.name} <span className="text-gray-500 font-normal text-xs ml-1">({eq.specification || '-'})</span></span>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{eq.categoryMain || '미분류'}</span>
                          <span className="truncate text-indigo-600 font-medium">예정일: {eq.nextInspectionDate?.split('T')[0]}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          최근 합격번호: <span className="text-gray-600">{eq.recentPassNum || '-'}</span>
                        </div>
                      </div>
                      <div className={\`flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-sm \${
                        isUrgent ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }\`}>
                        D-{eq.dDay}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>`;

  const lines = content.split('\\n');
  const startIdx = lines.findIndex(l => l.includes('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">'));
  const modalIdx = lines.findIndex(l => l.includes('{/* Equipment List Modal */}'));
  
  if (startIdx !== -1 && modalIdx !== -1) {
    const before = lines.slice(0, startIdx).join('\\n');
    const after = lines.slice(modalIdx).join('\\n');
    fs.writeFileSync(file, before + '\\n' + newBlock + '\\n\\n      ' + after);
    console.log('Successfully updated layout');
  } else {
    console.log('Could not find indices');
  }
}

updateLayout();
