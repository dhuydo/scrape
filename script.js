document.addEventListener('DOMContentLoaded', function() {
    restoreColumnOrderFromStorage();

    const standardTbody = document.getElementById('standard-data');
    const extendedTbody = document.getElementById('extended-data');
    const searchFormElement = document.querySelector('custom-search-form');

    let df1 = [];  // Bộ dữ liệu chuẩn
    let df2 = [];  // Bộ dữ liệu mở rộng

    // BIẾN LƯU FILTERED DATA
    let currentFilteredDf1 = [];
    let currentFilteredDf2 = [];

    // BIẾN LƯU THỨ TỰ CỘT
    const DF1_COLUMNS_ORDER = [
    'Mã TBMT',
    'Chủ đầu tư',
    'Số quyết định phê duyệt',
    'Ngày phê duyệt',
    'Ngày hết hiệu lực',
    'Đơn vị tính',
    'Số lượng',
    'Đơn giá trúng thầu (VND)',
    'Thành tiền (VND)',
    'Tên thuốc',
    'Tên hoạt chất/ Tên thành phần của thuốc',
    'Nồng độ, hàm lượng',
    'Đường dùng',
    'Dạng bào chế',
    'Quy cách',
    'Nhóm thuốc',
    'GĐKLH hoặc GPNK',
    'Cơ sở sản xuất',
    'Xuất xứ',
    'Nhà thầu trúng thầu',
    'Hình thức lựa chọn nhà thầu',
    'Địa điểm',
    'Tình trạng hiệu lực'
    ];

    const DF2_COLUMNS_ORDER = [
    'Mã TBMT',
    'Chủ đầu tư',
    'Số quyết định phê duyệt',
    'Ngày phê duyệt',
    'Ngày hết hiệu lực',
    'Đơn vị tính',
    'Khối lượng',
    'Đơn giá trúng thầu (VND)',
    'Thành tiền (VND)',
    'Tên hàng hóa',
    'Nhãn hiệu',
    'Ký mã hiệu',
    'Cấu hình, tính năng kỹ thuật cơ bản',
    'Xuất xứ',
    'Hãng sản xuất',
    'Nhà thầu trúng thầu',
    'Hình thức lựa chọn nhà thầu',
    'Địa điểm',
    'Tình trạng hiệu lực'
    ];
    let currentColumnOrderDf1 = [...DF1_COLUMNS_ORDER];
    let currentColumnOrderDf2 = [...DF2_COLUMNS_ORDER];

    // Khôi phục columns order của người dùng đã define
    function restoreColumnOrderFromStorage() {
        const saved1 = localStorage.getItem('columnOrderDf1');
        const saved2 = localStorage.getItem('columnOrderDf2');

        if (saved1) {
            try {
            currentColumnOrderDf1 = JSON.parse(saved1);
            console.log('✅ Khôi phục thứ tự cột DF1 từ storage:', currentColumnOrderDf1);
            } catch (e) {
            console.warn('Không parse được columnOrderDf1, dùng mặc định');
            }
        }

        if (saved2) {
            try {
            currentColumnOrderDf2 = JSON.parse(saved2);
            console.log('✅ Khôi phục thứ tự cột DF2 từ storage:', currentColumnOrderDf2);
            } catch (e) {
            console.warn('Không parse được columnOrderDf2, dùng mặc định');
            }
        }
        }

    // BIẾN LƯU CHART
    let chartPriceHistogram = null;
    let chartTimelineValue = null;
    let chartPriceBoxplot = null;      
    let chartSelectionMethod = null;    

    // ========== REORDER DATA THEO THỨ TỰ CỘT ==========
    function reorderDataByColumns(data, columnOrder) {
        if (!data || data.length === 0 || !columnOrder) {
            return data;
        }

        return data.map(row => {
            const reorderedRow = {};
            columnOrder.forEach(colName => {
            // Tìm cột thực tế trong object (so sánh theo text header)
            const actualColName = Object.keys(row).find(
                key => key.trim() === colName.trim()
            );
            reorderedRow[colName] = actualColName ? row[actualColName] : '';
            });
            return reorderedRow;
        });
    }

    // Lấy thứ tự cột hiện tại từ header table
    function getCurrentHeaderOrder(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return null;
        const headers = table.querySelectorAll('thead th');
        return Array.from(headers).map(h => h.textContent.trim());
    }

    // ========== METADATA FUNCTIONS - MỚI ==========
    let metadata = null;

    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s.toString().padStart(2, '0')}s`;
    }

    function formatRelative(lastStr) {
        const last = new Date(lastStr);
        const now = new Date();
        const diffMs = now - last;
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < 60) return `Cách đây ${diffMin} phút`;
        const diffH = Math.round(diffMin / 60);
        if (diffH < 24) return `Cách đây ${diffH} giờ`;
        return `Cách đây ${Math.round(diffH / 24)} ngày`;
    }

    async function loadMetadata() {
        try {
            console.log('🔄 Đang tải metadata...');
            const res = await fetch('/api/metadata');
            const meta = await res.json();
            
            console.log('📦 Response từ API:', meta);
            
            if (meta.success) {
                metadata = meta;
                console.log('✅ Load metadata thành công:', metadata);
            } else {
                console.warn('⚠️ API trả về success=false:', meta.message);
            }
        } catch (e) {
            console.error('❌ Load metadata error:', e);
        }
    }

    function showHistoryModal() {
        const modal = document.getElementById('history-modal');
        
        if (!metadata || !metadata.success || !metadata.history || metadata.history.length === 0) {
            document.getElementById('modal-last-update').textContent = 'Chưa có dữ liệu';
            document.getElementById('modal-freshness').textContent = '--';
            document.getElementById('modal-boxes-total').textContent = '0';
            document.getElementById('history-list').innerHTML = `
                <div class="history-empty">
                    <i data-feather="clock"></i>
                    <p>Chưa có lịch sử cập nhật dữ liệu</p>
                </div>
            `;
        } else {
            // Lấy lần chạy gần nhất (phần tử cuối)
            const history = metadata.history;
            const last = history[history.length - 1];
            const lastEnd = new Date(last.end_time);
            
            // Update summary với dữ liệu mới nhất
            document.getElementById('modal-last-update').textContent = 
                lastEnd.toLocaleString('vi-VN');
            document.getElementById('modal-freshness').textContent = 
                formatRelative(last.end_time);
            document.getElementById('modal-boxes-total').textContent = 
                last.boxes_selected.toLocaleString();
            
            // Render TẤT CẢ lịch sử (đảo ngược để mới nhất lên trên)
            const historyHTML = [...history].reverse().map(run => {
                const endTime = new Date(run.end_time);
                return `
                    <div class="history-item">
                        <div>
                            <div class="history-datetime">${endTime.toLocaleString('vi-VN')}</div>
                            <!-- <div class="history-duration">${formatDuration(run.duration_seconds)}</div> -->
                        </div>
                        <div class="history-boxes">${run.boxes_selected.toLocaleString()}</div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('history-list').innerHTML = historyHTML;
        }
        
        modal.classList.add('show');
        feather.replace(); // Refresh icons
    }


    // Event listeners
    document.getElementById('open-run-history')?.addEventListener('click', () => {
        showHistoryModal();
    });
    document.getElementById('close-history')?.addEventListener('click', () => {
        document.getElementById('history-modal').classList.remove('show');
    });

    document.querySelector('.history-overlay')?.addEventListener('click', () => {
        document.getElementById('history-modal').classList.remove('show');
    });

    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8001' 
    : window.location.origin;

    // TAB SWITCHING
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const exportBtn = document.getElementById('export-excel-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Bỏ qua nếu là nút metadata
            if (btn.id === 'open-run-history') {
                return;
            }
            
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Show/hide export button
            if (tabId === 'data-tab') {
                exportBtn.style.display = 'flex';
            } else {
                exportBtn.style.display = 'none';
            }
            
            // Re-render charts when switching to charts tab
            if (tabId === 'charts-tab') {
                drawCharts(currentFilteredDf1, currentFilteredDf2);
            }
        });
    });

    // ========== EXPORT TO EXCEL ==========
    document.getElementById('export-excel-btn').addEventListener('click', () => {
        if (currentFilteredDf1.length === 0 && currentFilteredDf2.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }
        
        // Lấy thứ tự cột thực tế từ DOM
        const headerOrderDf1 = getCurrentHeaderOrder('standard-table');
        const headerOrderDf2 = getCurrentHeaderOrder('extended-table');
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // DF1
        if (currentFilteredDf1.length > 0) {
            const orderedData1 = reorderDataByColumns(
            currentFilteredDf1,
            headerOrderDf1 || currentColumnOrderDf1
            );
            const ws1 = XLSX.utils.json_to_sheet(orderedData1);
            XLSX.utils.book_append_sheet(wb, ws1, 'Dữ liệu chuẩn');
            console.log('✅ DF1 export với thứ tự:', headerOrderDf1 || currentColumnOrderDf1);
        }

        // DF2
        if (currentFilteredDf2.length > 0) {
            const orderedData2 = reorderDataByColumns(
            currentFilteredDf2,
            headerOrderDf2 || currentColumnOrderDf2
            );
            const ws2 = XLSX.utils.json_to_sheet(orderedData2);
            XLSX.utils.book_append_sheet(wb, ws2, 'Dữ liệu tổng hợp');
            console.log('✅ DF2 export với thứ tự:', headerOrderDf2 || currentColumnOrderDf2);
        }
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
        const filename = `DuLieuTrungThau_${timestamp}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, filename);
        
        console.log(`✅ Exported ${currentFilteredDf1.length + currentFilteredDf2.length} records to ${filename}`);
    });

    // ============ RENDER DF1 - 16 CỘT ============
    function renderStandardData(data) {
        standardTbody.innerHTML = '';
        if (!data || data.length === 0) {
            standardTbody.innerHTML = '<tr><td colspan="16" style="text-align:center;color:#94a3b8;padding:20px;">Không có dữ liệu</td></tr>';
            return;
        }
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            tr.innerHTML = `
                <td class="px-4 py-2">${item['Mã TBMT'] || ''}</td>
                <td class="px-4 py-2">${item['Chủ đầu tư'] || ''}</td>
                <td class="px-4 py-2">${item['Số quyết định phê duyệt'] || ''}</td>
                <td class="px-4 py-2">${formatDate(item['Ngày phê duyệt'])}</td>
                <td class="px-4 py-2">${formatDate(item['Ngày hết hiệu lực'])}</td>
                <td class="px-4 py-2">${item['Đơn vị tính'] || ''}</td>
                <td class="px-4 py-2 text-right">${formatNumber(item['Số lượng'])}</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item['Đơn giá trúng thầu (VND)'])}</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item['Thành tiền (VND)'])}</td>
                <td class="px-4 py-2">${item['Tên thuốc'] || ''}</td>
                <td class="px-4 py-2">${item['Tên hoạt chất/ Tên thành phần của thuốc'] || ''}</td>
                <td class="px-4 py-2">${item['Nồng độ, hàm lượng'] || ''}</td>
                <td class="px-4 py-2">${item['Đường dùng'] || ''}</td>
                <td class="px-4 py-2">${item['Dạng bào chế'] || ''}</td>
                <td class="px-4 py-2">${item['Quy cách'] || ''}</td>
                <td class="px-4 py-2">${item['Nhóm thuốc'] || ''}</td>
                <td class="px-4 py-2">${item['GĐKLH hoặc GPNK'] || ''}</td>
                <td class="px-4 py-2">${item['Cơ sở sản xuất'] || ''}</td>
                <td class="px-4 py-2">${item['Xuất xứ'] || ''}</td>
                <td class="px-4 py-2">${item['Nhà thầu trúng thầu'] || ''}</td>
                <td class="px-4 py-2">${item['Hình thức lựa chọn nhà thầu'] || ''}</td>
                <td class="px-4 py-2">${item['Địa điểm'] || ''}</td>
                <td class="px-4 py-2">${item['Tình trạng hiệu lực'] || ''}</td>
            `;
            standardTbody.appendChild(tr);
        });
    }

    // ============ RENDER DF2 - 11 CỘT (không có search) ============
    function renderExtendedData(data) {
        extendedTbody.innerHTML = '';
        if (!data || data.length === 0) {
            extendedTbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:20px;">Không có dữ liệu</td></tr>';
            return;
        }
        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            tr.innerHTML = `
                <td class="px-4 py-2">${item['Mã TBMT'] || ''}</td>
                <td class="px-4 py-2">${item['Chủ đầu tư'] || ''}</td>
                <td class="px-4 py-2">${item['Số quyết định phê duyệt'] || ''}</td>
                <td class="px-4 py-2">${formatDate(item['Ngày phê duyệt'])}</td>
                <td class="px-4 py-2">${formatDate(item['Ngày hết hiệu lực'])}</td>
                <td class="px-4 py-2">${item['Đơn vị tính'] || ''}</td>
                <td class="px-4 py-2 text-right">${formatNumber(item['Khối lượng'])}</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item['Đơn giá trúng thầu (VND)'])}</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item['Thành tiền (VND)'])}</td>
                <td class="px-4 py-2">${item['Tên hàng hóa'] || ''}</td>
                <td class="px-4 py-2">${item['Nhãn hiệu'] || ''}</td>
                <td class="px-4 py-2">${item['Ký mã hiệu'] || ''}</td>
                <td class="px-4 py-2">${item['Cấu hình, tính năng kỹ thuật cơ bản'] || ''}</td>
                <td class="px-4 py-2">${item['Xuất xứ'] || ''}</td>
                <td class="px-4 py-2">${item['Hãng sản xuất'] || ''}</td>
                <td class="px-4 py-2">${item['Nhà thầu trúng thầu'] || ''}</td>   
                <td class="px-4 py-2">${item['Hình thức lựa chọn nhà thầu'] || ''}</td>
                <td class="px-4 py-2">${item['Địa điểm'] || ''}</td>
                <td class="px-4 py-2">${item['Tình trạng hiệu lực'] || ''}</td>            
            `;
            extendedTbody.appendChild(tr);
        });
    }


    function formatCurrency(v) {
    if (v === null || v === undefined || v === '') return '';

    const num = Number(v);
    if (isNaN(num)) return v;

    return num.toLocaleString('vi-VN', {
        maximumFractionDigits: 2
    });
    }

    function formatNumber(v) {
    if (v === null || v === undefined || v === '') return '';

    const num = Number(v);
    if (isNaN(num)) return v;

    return num.toLocaleString('vi-VN');
    }

    function normalizeStr(s) {
        return (s || '').toString().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function formatDate(dateValue) {
    if (!dateValue) return '';
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
}

    // Parse query search với syntax đặc biệt
function parseSearchQuery(query) {
    if (!query || !query.trim()) return null;
    
    const result = {
        mustHave: [],      // Các từ bắt buộc phải có (+)
        mustNotHave: [],   // Các từ bắt buộc không có (-)
        shouldHave: [],    // Các từ nên có (OR)
        phrases: []        // Các cụm chính xác ("...")
    };
    
    let remaining = query;
    
    // 1. Extract phrases "..." 
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
        result.phrases.push(normalizeStr(match[1]));
        remaining = remaining.replace(match[0], '');
    }
    
    // 2. Split by OR
    const orParts = remaining.split(/\s+OR\s+/i);
    
    if (orParts.length > 1) {
        // Có OR → xử lý từng phần
        orParts.forEach(part => {
            const terms = part.trim().split(/\s+/).filter(t => t);
            terms.forEach(term => {
                if (term.startsWith('-')) {
                    result.mustNotHave.push(normalizeStr(term.substring(1)));
                } else if (term.startsWith('+')) {
                    result.mustHave.push(normalizeStr(term.substring(1)));
                } else if (term) {
                    result.shouldHave.push(normalizeStr(term));
                }
            });
        });
    } else {
        // Không có OR → xử lý +/-/normal
        const terms = remaining.trim().split(/\s+/).filter(t => t);
        terms.forEach(term => {
            if (term.startsWith('-')) {
                result.mustNotHave.push(normalizeStr(term.substring(1)));
            } else if (term.startsWith('+')) {
                result.mustHave.push(normalizeStr(term.substring(1)));
            } else if (term) {
                result.mustHave.push(normalizeStr(term)); // Mặc định là AND
            }
        });
    }
    
    return result;
}

// Kiểm tra xem text có match với parsed query không
function matchQuery(text, parsedQuery) {
    if (!parsedQuery) return true;
    
    const normalizedText = normalizeStr(text || '');
    
    // 1. Check phrases (cụm chính xác)
    for (const phrase of parsedQuery.phrases) {
        if (!normalizedText.includes(phrase)) {
            return false;
        }
    }
    
    // 2. Check mustNotHave (từ cấm)
    for (const term of parsedQuery.mustNotHave) {
        if (normalizedText.includes(term)) {
            return false;
        }
    }
    
    // 3. Check mustHave (từ bắt buộc - AND)
    for (const term of parsedQuery.mustHave) {
        if (!normalizedText.includes(term)) {
            return false;
        }
    }
    
    // 4. Check shouldHave (từ tùy chọn - OR)
    if (parsedQuery.shouldHave.length > 0) {
        const hasAtLeastOne = parsedQuery.shouldHave.some(term => 
            normalizedText.includes(term)
        );
        if (!hasAtLeastOne) {
            return false;
        }
    }
    
    return true;
}


    // ============ FILTER LOGIC ============
    function applyFilters(payload) {
        console.log('🔍 Applying filters:', payload);
        console.log('📊 df1 length:', df1.length, 'df2 length:', df2.length);

        let filteredDf1 = df1.slice();
        let filteredDf2 = df2.slice();

        currentFilteredDf1 = filteredDf1;
        currentFilteredDf2 = filteredDf2;

        // Parse các query với syntax đặc biệt
        const parsedQueries = {
            investor: parseSearchQuery(payload.investor),
            selectionMethod: parseSearchQuery(payload.selectionMethod),
            approvalDecision: parseSearchQuery(payload.approvalDecision),
            drugName: parseSearchQuery(payload.drugName),
            activeIngredient: parseSearchQuery(payload.activeIngredient),
            concentration: parseSearchQuery(payload.concentration),
            route: parseSearchQuery(payload.route),              
            dosageForm: parseSearchQuery(payload.dosageForm),    
            specification: parseSearchQuery(payload.specification),
            drugGroup: parseSearchQuery(payload.drugGroup),
            regNo: parseSearchQuery(payload.regNo),
            manufacturer: parseSearchQuery(payload.manufacturer),
            country: parseSearchQuery(payload.country),
            place: parseSearchQuery(payload.place),
            validity: parseSearchQuery(payload.validity),
        };

        if (parsedQueries.investor) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Chủ đầu tư'], parsedQueries.investor)
            );
        }

        if (parsedQueries.selectionMethod && payload.selectionMethod) 
            filteredDf1 = filteredDf1.filter(d => d['Hình thức lựa chọn nhà thầu'] === payload.selectionMethod);

        if (parsedQueries.place && payload.place) 
            filteredDf1 = filteredDf1.filter(d => d['Địa điểm'] === payload.place);

        if (parsedQueries.validity && payload.validity) 
            filteredDf1 = filteredDf1.filter(d => d['Tình trạng hiệu lực'] === payload.validity);

        if (parsedQueries.approvalDecision) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Số quyết định phê duyệt'], parsedQueries.approvalDecision)
            );
        }

        if (parsedQueries.drugName) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Tên thuốc'], parsedQueries.drugName)
            );
        }
        
        if (parsedQueries.activeIngredient) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Tên hoạt chất/ Tên thành phần của thuốc'], parsedQueries.activeIngredient)
            );
        }
        
        if (parsedQueries.concentration) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Nồng độ, hàm lượng'], parsedQueries.concentration)
            );
        }
        
        if (parsedQueries.route) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Đường dùng'], parsedQueries.route)
            );
        }

        if (parsedQueries.dosageForm) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Dạng bào chế'], parsedQueries.dosageForm)
            );
        }
        
        if (parsedQueries.specification) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Quy cách'], parsedQueries.specification)
            );
        }
        
        if (parsedQueries.drugGroup) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Nhóm thuốc'], parsedQueries.drugGroup)
            );
        }
        
        if (parsedQueries.regNo) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['GĐKLH hoặc GPNK'], parsedQueries.regNo)
            );
        }
        
        if (parsedQueries.manufacturer) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Cơ sở sản xuất'], parsedQueries.manufacturer)
            );
        }
        
        if (parsedQueries.country) {
            filteredDf1 = filteredDf1.filter(d => 
                matchQuery(d['Xuất xứ'], parsedQueries.country)
            );
        }

        // DF2: TẤT CẢ FILTER ĐỀU TÌM TRONG CỘT "search" (multi-condition AND)
        filteredDf2 = filteredDf2.filter(d => {
            const searchText = d['search'] || '';
            
            if (!matchQuery(d['Chủ đầu tư'], parsedQueries.investor)) return false;
            if (!matchQuery(d['Số quyết định phê duyệt'], parsedQueries.approvalDecision)) return false;
            if (!matchQuery(d['Hình thức lựa chọn nhà thầu'], parsedQueries.selectionMethod)) return false;
            if (!matchQuery(d['Địa điểm'], parsedQueries.place)) return false;
            if (!matchQuery(d['Tình trạng hiệu lực'], parsedQueries.validity)) return false;

            if (!matchQuery(searchText, parsedQueries.drugName)) return false;
            if (!matchQuery(searchText, parsedQueries.activeIngredient)) return false;
            if (!matchQuery(searchText, parsedQueries.concentration)) return false;
            if (!matchQuery(searchText, parsedQueries.route)) return false;         
            if (!matchQuery(searchText, parsedQueries.dosageForm)) return false;   
            if (!matchQuery(searchText, parsedQueries.specification)) return false;
            if (!matchQuery(searchText, parsedQueries.drugGroup)) return false;
            if (!matchQuery(searchText, parsedQueries.regNo)) return false;
            if (!matchQuery(searchText, parsedQueries.manufacturer)) return false;
            if (!matchQuery(searchText, parsedQueries.country)) return false;
            
            return true;
        });

        // FILTER NGÀY
        if (payload.dateFrom || payload.dateTo) {
            const fromDate = payload.dateFrom ? new Date(payload.dateFrom) : null;
            const toDate = payload.dateTo ? new Date(payload.dateTo) : null;
            
            if (toDate) {
                toDate.setHours(23, 59, 59, 999);
            }

            filteredDf1 = filteredDf1.filter(d => {
                const itemDate = d['Ngày phê duyệt'];
                if (!itemDate) return false;
                
                const date = new Date(itemDate);
                if (isNaN(date.getTime())) return false;
                
                if (fromDate && date < fromDate) return false;
                if (toDate && date > toDate) return false;
                
                return true;
            });

            filteredDf2 = filteredDf2.filter(d => {
                const itemDate = d['Ngày phê duyệt'];
                if (!itemDate) return false;
                
                const date = new Date(itemDate);
                if (isNaN(date.getTime())) return false;
                
                if (fromDate && date < fromDate) return false;
                if (toDate && date > toDate) return false;
                
                return true;
            });
        }


        // if (payload.dateFrom || payload.dateTo) {
        //     const fromDate = payload.dateFrom ? new Date(payload.dateFrom) : null;
        //     const toDate = payload.dateTo ? new Date(payload.dateTo) : null;
            
        //     if (toDate) {
        //         toDate.setHours(23, 59, 59, 999);
        //     }

        //     filteredDf2 = filteredDf2.filter(d => {
        //         const itemDate = d['Ngày phê duyệt'];
        //         if (!itemDate) return false;
                
        //         const date = new Date(itemDate);
        //         if (isNaN(date.getTime())) return false;
                
        //         if (fromDate && date < fromDate) return false;
        //         if (toDate && date > toDate) return false;
                
        //         return true;
        //     });
        // }

        console.log('✅ Filtered df1:', filteredDf1.length, 'df2:', filteredDf2.length);

        // Sort theo ngày phê duyệt (mới nhất lên trước)
        filteredDf1 = sortByDate(filteredDf1);
        filteredDf2 = sortByDate(filteredDf2);
        
        // SAVE to global variables for export
        currentFilteredDf1 = filteredDf1;
        currentFilteredDf2 = filteredDf2;

        // Update counts
        document.getElementById('df1-count').textContent = filteredDf1.length;
        document.getElementById('df2-count').textContent = filteredDf2.length;

        // LUÔN render cả 2 bảng
        renderStandardData(filteredDf1);
        renderExtendedData(filteredDf2);
        drawCharts(filteredDf1, filteredDf2);
    }

    function sortByDate(data) {
        return data.sort((a, b) => {
            const dateA = a['Ngày phê duyệt'];
            const dateB = b['Ngày phê duyệt'];
            
            // Nếu không có ngày, đẩy xuống cuối
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            // Parse ngày (backend đã convert sang ISO string hoặc timestamp)
            const timeA = new Date(dateA).getTime();
            const timeB = new Date(dateB).getTime();
            
            // Sort giảm dần (mới nhất lên trước)
            return timeB - timeA;
        });
    }

    if (searchFormElement) {
        searchFormElement.addEventListener('apply-filters', (e) => applyFilters(e.detail));
        searchFormElement.addEventListener('reset-filters', () => {
            renderStandardData([]);
            renderExtendedData([]);
            drawCharts([], []);
        });
    }

    // Hàm fetch với retry
    async function fetchWithRetry(url, retries = 3, delay = 2000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                console.log(`⏳ Attempt ${i + 1}/${retries} failed, retrying...`);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Load dữ liệu từ API
    Promise.all([
        fetchWithRetry('/api/df1'),
        fetchWithRetry('/api/df2')
    ]).then(([res1, res2]) => {
        df1 = res1.data;
        df2 = res2.data;
        
        console.log(`✅ Loaded df1: ${df1.length} records`);
        console.log(`✅ Loaded df2: ${df2.length} records`);
        
        loadMetadata();

        if (df1.length > 0) console.log('📄 df1 sample:', df1[0]);
        if (df2.length > 0) console.log('📄 df2 sample:', df2[0]);

        // Hiện message trong chart khi chưa search
        initEmptyCharts();

    }).catch(err => {
        console.error('❌ Error loading data:', err);
        console.error('⚠️ Server có thể đang khởi động, vui lòng đợi 30s và refresh lại');
        loadMetadata();
        initEmptyCharts(); 
    });

    // Init message cho charts
function initEmptyCharts() {
    const noDataMsg = 'Chưa có dữ liệu. Vui lòng thực hiện tìm kiếm để xem biểu đồ.';

    // Không đụng vào cấu trúc .chart-block, .charts-grid
    ['chart-suppliers', 'chart-prices', 'chart-timeline', 'chart-dosage-forms'].forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Xóa nội dung canvas nếu có
        ctx.clearRect(0, 0, canvas.width || canvas.clientWidth || 300, canvas.height || canvas.clientHeight || 150);

        // Không ghi đè parent.innerHTML nữa để khỏi mất canvas
        // Nếu muốn message, nên làm riêng một div phía trên, không phá canvas
    });
}


function destroyCharts() {
    if (chartPriceHistogram) { chartPriceHistogram.destroy(); chartPriceHistogram = null; }
    if (chartTimelineValue) { chartTimelineValue.destroy(); chartTimelineValue = null; }
    if (chartPriceBoxplot) { chartPriceBoxplot.destroy(); chartPriceBoxplot = null; }    
    if (chartSelectionMethod) { chartSelectionMethod.destroy(); chartSelectionMethod = null; } 
    
}

function drawCharts(df1Data, df2Data) {
    const totalRecords = (df1Data?.length || 0) + (df2Data?.length || 0);
    const noDataMsg = 'Chưa có dữ liệu. Vui lòng thực hiện tìm kiếm để xem biểu đồ.';

    destroyCharts();

    if (totalRecords === 0) {
        ['chart-price-histogram', 'chart-price-boxplot', 'chart-timeline-value', 'chart-selection-method'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                canvas.classList.add('hidden');
                
                let msg = canvas.parentElement.querySelector('.no-data-msg');
                if (!msg) {
                    msg = document.createElement('p');
                    msg.className = 'no-data-msg';
                    msg.textContent = noDataMsg;
                    canvas.parentElement.appendChild(msg);
                }
                msg.classList.add('visible');
            }
        });
        return;
    }

    const all = [...df1Data, ...df2Data];

    // ============ 1. HISTOGRAM GIÁ ============
    const priceMap = {};
    all.forEach(r => {
        const price = Number(r['Đơn giá trúng thầu (VND)']);
        if (!isNaN(price) && price > 0) {
            if (!priceMap[price]) {
                priceMap[price] = 0;
            }
            priceMap[price]++;
        }
    });

    const sortedPrices = Object.entries(priceMap)
        .map(([priceNum, count]) => ({
            price: Number(priceNum),
            count
        }))
        .sort((a, b) => a.price - b.price);

    const priceLabels = sortedPrices.map(x => x.price.toLocaleString('vi-VN'));
    const priceCounts = sortedPrices.map(x => x.count);

    const ctxPriceCanvas = document.getElementById('chart-price-histogram');
    if (ctxPriceCanvas && priceLabels.length > 0) {
        const msg = ctxPriceCanvas.parentElement.querySelector('.no-data-msg');
        if (msg) msg.classList.remove('visible');
        ctxPriceCanvas.classList.remove('hidden');

        const ctxPrice = ctxPriceCanvas.getContext('2d');
        chartPriceHistogram = new Chart(ctxPrice, {
            type: 'bar',
            data: {
                labels: priceLabels,
                datasets: [{
                    label: 'Số lượng bản ghi',
                    data: priceCounts,
                    backgroundColor: '#6C5CE7',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => `Giá: ${items[0].label}`,
                            label: (item) => `Số bản ghi: ${item.formattedValue}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            autoSkip: true,
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 12 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 12 }
                        }
                    }
                },
                layout: {
                    padding: { top: 10, bottom: 10 }
                }
            }
        });
    }

    // ============ 2. BOXPLOT CHUẨN ============
    const prices = all
        .map(r => Number(r['Đơn giá trúng thầu (VND)']))
        .filter(p => !isNaN(p) && p > 0);

    const ctxBoxplotCanvas = document.getElementById('chart-price-boxplot');
    if (ctxBoxplotCanvas && prices.length > 0) {
        const msg = ctxBoxplotCanvas.parentElement.querySelector('.no-data-msg');
        if (msg) msg.classList.remove('visible');
        ctxBoxplotCanvas.classList.remove('hidden');

        const ctxBoxplot = ctxBoxplotCanvas.getContext('2d');
        chartPriceBoxplot = new Chart(ctxBoxplot, {
            type: 'boxplot',
            data: {
                labels: ['Giá'],
                datasets: [{
                    label: 'Phân bố giá',
                    data: [prices],
                    backgroundColor: 'rgba(108, 92, 231, 0.2)', // ĐỔI: cam → tím
                    borderColor: '#6C5CE7', // ĐỔI: #FF6B6B → #6C5CE7
                    borderWidth: 2,
                    outlierBackgroundColor: '#5f3dc4', // ĐỔI: #fa5252 → tím đậm
                    outlierBorderColor: '#5f3dc4', // ĐỔI: #fa5252 → tím đậm
                    itemRadius: 0,
                    outlierRadius: 3,
                    medianColor: '#7c6eea' // ĐỔI: #c92a2a → tím sáng
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',  // Tìm element gần nhất
                    axis: 'xy',       // Theo cả 2 trục
                    intersect: false  // QUAN TRỌNG: Không cần hover chính xác
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',    // Tooltip hiện cho element gần nhất
                        intersect: false,   // QUAN TRỌNG: Không cần intersect
                        axis: 'xy',
                        
                        // Tăng khoảng cách nhận diện hover
                        hitRadius: 30,      // THÊM: Tăng vùng nhận diện
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                if (value.min !== undefined) {
                                    return [
                                        `Max: ${value.max.toLocaleString('vi-VN')}`,
                                        `Q3: ${value.q3.toLocaleString('vi-VN')}`,
                                        `Median: ${value.median.toLocaleString('vi-VN')}`,
                                        `Q1: ${value.q1.toLocaleString('vi-VN')}`,
                                        `Min: ${value.min.toLocaleString('vi-VN')}`
                                    ];
                                }
                                return `${value.toLocaleString('vi-VN')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (value >= 1_000_000) {
                                    return (value / 1_000_000).toFixed(0).toLocaleString('vi-VN') + ' tr';
                                }
                                return value.toLocaleString('vi-VN');
                            },
                            font: { size: 12 }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 12 }
                        }
                    }
                },
                layout: {
                    padding: { top: 10, bottom: 10 }
                }
            }
        });
    }

    // ============ 3. TRỊ GIÁ THEO THỜI GIAN - TÍM ============
    const monthlyValue = {};
    
    all.forEach(r => {
        const dateStr = r['Ngày phê duyệt'];
        const value = Number(r['Thành tiền (VND)']) || 0;
        
        if (!dateStr || value === 0) return;
        
        let monthKey;
        try {
            let dateObj;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } else if (dateStr.includes('-')) {
                dateObj = new Date(dateStr);
            } else if (dateStr instanceof Date) {
                dateObj = dateStr;
            }
            
            if (dateObj && !isNaN(dateObj.getTime())) {
                monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            }
        } catch (e) {
            // Skip invalid dates
        }
        
        if (monthKey) {
            monthlyValue[monthKey] = (monthlyValue[monthKey] || 0) + value;
        }
    });

    const sortedMonths = Object.entries(monthlyValue)
        .sort((a, b) => a[0].localeCompare(b[0]));

    const monthLabels = sortedMonths.map(([month]) => {
        const [year, m] = month.split('-');
        return `${m}/${year}`;
    });
    const monthValues = sortedMonths.map(([, value]) => value);

    const ctxTimelineCanvas = document.getElementById('chart-timeline-value');
    if (ctxTimelineCanvas && monthLabels.length > 0) {
        const msg = ctxTimelineCanvas.parentElement.querySelector('.no-data-msg');
        if (msg) msg.classList.remove('visible');
        ctxTimelineCanvas.classList.remove('hidden');
    
        const ctxTimeline = ctxTimelineCanvas.getContext('2d');
        chartTimelineValue = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Tổng trị giá (VND)',
                    data: monthValues,
                    backgroundColor: 'rgba(255, 107, 107, 0.1)', // ĐỔI: tím → cam
                    borderColor: '#FF6B6B', // ĐỔI: #6C5CE7 → #FF6B6B
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#FF6B6B', // ĐỔI: tím → cam
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7, // THÊM: Tăng kích thước khi hover
                    pointHitRadius: 20 // THÊM: Tăng vùng nhận diện hover
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const value = Number(item.raw);
                                if (value >= 1_000_000_000) {
                                    const v = value / 1_000_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} tỷ`;
                                }

                                if (value >= 1_000_000) {
                                    const v = value / 1_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} triệu`;
                                }

                                return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 12 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (value >= 1_000_000_000) {
                                    const v = value / 1_000_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} tỷ`;
                                }

                                if (value >= 1_000_000) {
                                    const v = value / 1_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} triệu`;
                                }

                                return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
                            },
                            font: { size: 12 }
                        }
                    }
                },
                layout: {
                    padding: { top: 10, bottom: 10 }
                }
            }
        });
    }

    // ============ 4. THÀNH TIỀN THEO HÌNH THỨC - CAM ============
    const methodMap = {};

    all.forEach(r => {
        const method = r['Hình thức lựa chọn nhà thầu'] || 'Không xác định';
        const value = Number(r['Thành tiền (VND)']) || 0;
        
        if (value > 0) {
            if (!methodMap[method]) methodMap[method] = 0;
            methodMap[method] += value;
        }
    });

    const sortedMethods = Object.entries(methodMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const methodLabels = sortedMethods.map(x => {
        const label = x[0];
        return label.length > 25 ? label.substring(0, 25) + '...' : label;
    });
    const methodValues = sortedMethods.map(x => x[1]);

    const ctxMethodCanvas = document.getElementById('chart-selection-method');
    if (ctxMethodCanvas && methodLabels.length > 0) {
        const msg = ctxMethodCanvas.parentElement.querySelector('.no-data-msg');
        if (msg) msg.classList.remove('visible');
        ctxMethodCanvas.classList.remove('hidden');

        const ctxMethod = ctxMethodCanvas.getContext('2d');
        chartSelectionMethod = new Chart(ctxMethod, {
            type: 'bar',
            data: {
                labels: methodLabels,
                datasets: [{
                    label: 'Tổng thành tiền',
                    data: methodValues,
                    backgroundColor: [
                        '#FF6B6B',
                        '#FF8787',
                        '#FFA3A3',
                        '#FFBFBF',
                        '#FF6B6B',
                        '#FF8787',
                        '#FFA3A3',
                        '#FFBFBF'
                    ],
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                // indexAxis: 'x',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const value = Number(item.raw);
                                if (value >= 1_000_000_000) {
                                    const v = value / 1_000_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} tỷ`;
                                }

                                if (value >= 1_000_000) {
                                    const v = value / 1_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} triệu`;
                                }

                                return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (value >= 1_000_000_000) {
                                    const v = value / 1_000_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} tỷ`;
                                }

                                if (value >= 1_000_000) {
                                    const v = value / 1_000_000;
                                    return `${v.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} triệu`;
                                }

                                return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
                            },
                            font: { size: 12 }
                        }
                    }
                },
                layout: {
                    padding: { top: 10, bottom: 10 }
                }
            }
        });
    }
}

});


// ========== DIRECT TABLE COLUMN DRAG & DROP ==========
let draggedColumnIndex = null;
let draggedTable = null;

// Initialize drag and drop for table headers
function initTableColumnDragDrop() {
    console.log('🎯 Initializing column drag & drop...');
    initTableHeaderDrag('standard-table');
    initTableHeaderDrag('extended-table');
}

function initTableHeaderDrag(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.warn(`Table ${tableId} not found`);
        return;
    }
    
    const headers = table.querySelectorAll('thead th');
    console.log(`📋 Found ${headers.length} headers in ${tableId}`);
    
    headers.forEach((header, index) => {
        // Make draggable
        header.setAttribute('draggable', 'true');
        header.dataset.columnIndex = index;
        header.style.cursor = 'move';
        
        // Add visual drag indicator
        if (!header.querySelector('.drag-indicator')) {
            const dragIndicator = document.createElement('span');
            dragIndicator.className = 'drag-indicator';
            // dragIndicator.innerHTML = '⋮⋮';
            header.insertBefore(dragIndicator, header.firstChild);
        }
        
        // Remove old listeners if any
        header.removeEventListener('dragstart', handleColumnDragStart);
        header.removeEventListener('dragover', handleColumnDragOver);
        header.removeEventListener('drop', handleColumnDrop);
        header.removeEventListener('dragend', handleColumnDragEnd);
        header.removeEventListener('dragenter', handleColumnDragEnter);
        header.removeEventListener('dragleave', handleColumnDragLeave);
        
        // Add drag events
        header.addEventListener('dragstart', handleColumnDragStart);
        header.addEventListener('dragover', handleColumnDragOver);
        header.addEventListener('drop', handleColumnDrop);
        header.addEventListener('dragend', handleColumnDragEnd);
        header.addEventListener('dragenter', handleColumnDragEnter);
        header.addEventListener('dragleave', handleColumnDragLeave);
    });
    
    console.log(`✅ Drag & drop initialized for ${tableId}`);
}

function handleColumnDragStart(e) {
    draggedColumnIndex = parseInt(this.dataset.columnIndex);
    draggedTable = this.closest('table');
    
    console.log(`🎬 Drag start: column ${draggedColumnIndex}`);
    
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    
    draggedTable.classList.add('column-dragging');
}

function handleColumnDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleColumnDragEnter(e) {
    if (this.closest('table') === draggedTable && 
        parseInt(this.dataset.columnIndex) !== draggedColumnIndex) {
        this.classList.add('drag-over');
    }
}

function handleColumnDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleColumnDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const dropColumnIndex = parseInt(this.dataset.columnIndex);
    
    console.log(`📍 Drop: from ${draggedColumnIndex} to ${dropColumnIndex}`);
    
    // Only process if dropping on same table and different column
    if (this.closest('table') === draggedTable && draggedColumnIndex !== dropColumnIndex) {
        reorderTableColumns(draggedTable, draggedColumnIndex, dropColumnIndex);
    }
    
    return false;
}

function handleColumnDragEnd(e) {
    this.style.opacity = '1';
    
    console.log('🏁 Drag end');
    
    // Remove all drag-over classes
    if (draggedTable) {
        const headers = draggedTable.querySelectorAll('thead th');
        headers.forEach(header => {
            header.classList.remove('drag-over');
        });
        
        draggedTable.classList.remove('column-dragging');
    }
    
    draggedColumnIndex = null;
    draggedTable = null;
}

// CẬP NHẬT THỨ TỰ CỘT SAU KHI DRAG-DROP
function updateColumnOrder(table) {
  const tableId = table.id;
  const headers = table.querySelectorAll('thead th');
  const newOrder = Array.from(headers).map(h =>
    h.textContent.trim()
  );

  if (tableId === 'standard-table') {
    currentColumnOrderDf1 = newOrder;
    localStorage.setItem('columnOrderDf1', JSON.stringify(newOrder));
    console.log('✅ Cập nhật thứ tự cột DF1:', currentColumnOrderDf1);
  } else if (tableId === 'extended-table') {
    currentColumnOrderDf2 = newOrder;
    localStorage.setItem('columnOrderDf2', JSON.stringify(newOrder));
    console.log('✅ Cập nhật thứ tự cột DF2:', currentColumnOrderDf2);
  }
}

// Reorder columns in table DOM
function reorderTableColumns(table, fromIndex, toIndex) {
    console.log(`🔄 Reordering columns: ${fromIndex} → ${toIndex}`);
    
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = Array.from(row.children);
        
        if (fromIndex >= cells.length || toIndex >= cells.length) {
            return;
        }
        
        const draggedCell = cells[fromIndex];
        
        // Remove the dragged cell
        draggedCell.remove();
        
        // Insert at new position
        if (toIndex >= row.children.length) {
            row.appendChild(draggedCell);
        } else {
            const referenceCell = row.children[toIndex];
            row.insertBefore(draggedCell, referenceCell);
        }
    });
    
    // Update column indices after reorder
    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        header.dataset.columnIndex = index;
    });
    
    console.log('✅ Columns reordered successfully');

    // Cập nhật thứ tự cột toàn cục
    updateColumnOrder(table);
}

function applySavedColumnOrder(tableId, columnOrder) {
  const table = document.getElementById(tableId);
  if (!table || !columnOrder || columnOrder.length === 0) return;

  const headers = Array.from(table.querySelectorAll('thead th'));
  if (headers.length === 0) return;

  // Duyệt theo thứ tự mong muốn, với từng header name → tìm index hiện tại và move
  columnOrder.forEach((colName, targetIndex) => {
    const currentHeaders = Array.from(table.querySelectorAll('thead th'));
    const currentIndex = currentHeaders.findIndex(
      h => h.textContent.trim() === colName.trim()
    );
    if (currentIndex === -1 || currentIndex === targetIndex) return;
    reorderTableColumns(table, currentIndex, targetIndex);
  });
}

// Initialize on page load
window.addEventListener('load', function() {
    console.log('🚀 Window loaded, initializing drag & drop...');
    setTimeout(() => {
        initTableColumnDragDrop();
    }, 1000);
});
