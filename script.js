document.addEventListener('DOMContentLoaded', function() {
    const standardTbody = document.getElementById('standard-data');
    const extendedTbody = document.getElementById('extended-data');
    const searchFormElement = document.querySelector('custom-search-form');

    let df1 = [];  // Bộ dữ liệu chuẩn
    let df2 = [];  // Bộ dữ liệu mở rộng

    // BIẾN LƯU CHART
    let chartPriceHistogram = null;
    let chartTimelineValue = null;


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
                <td class="px-4 py-2">${item['ma_TBMT'] || ''}</td>
                <td class="px-4 py-2">${formatDate(item['Ngày phê duyệt'])}</td>
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
                <td class="px-4 py-2">${item['ma_TBMT'] || ''}</td>
                <td class="px-4 py-2">${formatDate(item['Ngày phê duyệt'])}</td>
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

        // Parse các query với syntax đặc biệt
        const parsedQueries = {
            drugName: parseSearchQuery(payload.drugName),
            activeIngredient: parseSearchQuery(payload.activeIngredient),
            concentration: parseSearchQuery(payload.concentration),
            route: parseSearchQuery(payload.route),              
            dosageForm: parseSearchQuery(payload.dosageForm),    
            specification: parseSearchQuery(payload.specification),
            drugGroup: parseSearchQuery(payload.drugGroup),
            regNo: parseSearchQuery(payload.regNo),
            manufacturer: parseSearchQuery(payload.manufacturer),
            country: parseSearchQuery(payload.country)
        };

        // DF1: Lọc theo TỪNG CỘT TƯƠNG ỨNG
        // if (payload.dateFrom || payload.dateTo) {
        //     const fromDate = payload.dateFrom ? new Date(payload.dateFrom) : null;
        //     const toDate = payload.dateTo ? new Date(payload.dateTo) : null;
            
        //     // Set time to end of day for toDate to include the whole day
        //     if (toDate) {
        //         toDate.setHours(23, 59, 59, 999);
        //     }

        //     filteredDf1 = filteredDf1.filter(d => {
        //         const itemDate = d['Ngày phê duyệt'];
        //         if (!itemDate) return false; // Bỏ qua dòng không có ngày
                
        //         const date = new Date(itemDate);
        //         if (isNaN(date.getTime())) return false;
                
        //         if (fromDate && date < fromDate) return false;
        //         if (toDate && date > toDate) return false;
                
        //         return true;
        //     });
        // }

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

    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8001' 
    : '';  // Production dùng relative URL

    // Load dữ liệu từ API
    Promise.all([
        fetch(`${API_BASE_URL}/api/df1`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/df2`).then(r => r.json())
    ]).then(([res1, res2]) => {
        df1 = res1.data || res1 || [];
        df2 = res2.data || res2 || [];
        
        console.log(`✅ Loaded df1: ${df1.length} records`);
        console.log(`✅ Loaded df2: ${df2.length} records`);
        
        if (df1.length > 0) console.log('📄 df1 sample:', df1[0]);
        if (df2.length > 0) console.log('📄 df2 sample:', df2[0]);

        // Hiện message trong chart khi chưa search
        initEmptyCharts();

    }).catch(err => {
        console.error('❌ Error loading data:', err);
        console.error('⚠️ Vui lòng chạy server.py trước khi mở trang này');
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
}

function drawCharts(df1Data, df2Data) {
    const totalRecords = (df1Data?.length || 0) + (df2Data?.length || 0);
    const noDataMsg = 'Chưa có dữ liệu. Vui lòng thực hiện tìm kiếm để xem biểu đồ.';

    destroyCharts();

    if (totalRecords === 0) {
        // ['chart-price-histogram', 'chart-timeline-value'].forEach(id => {
        //     const canvas = document.getElementById(id);
        //     if (canvas && canvas.parentElement) {
        //         canvas.parentElement.innerHTML = `<p style="font-size:11px;color:#94a3b8;padding:20px;text-align:center;line-height:1.6;">${noDataMsg}</p>`;
        //     }
        // });

        ['chart-price-histogram', 'chart-timeline-value'].forEach(id => {
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

    // ============ 1. HISTOGRAM GIÁ THUỐC ============
    // Lấy tất cả giá (mỗi giá là 1 bar riêng)
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

    console.log('📊 Price histogram data:', priceMap);

    // Sort theo giá tăng dần
    const sortedPrices = Object.entries(priceMap)
        .map(([priceNum, count]) => ({
            price: Number(priceNum),
            count
        }))
        .sort((a, b) => a.price - b.price);

    const priceLabels = sortedPrices.map(x => x.price.toLocaleString('vi-VN'));
    const priceCounts = sortedPrices.map(x => x.count);

    console.log('📊 Chart labels:', priceLabels);
    console.log('📊 Chart counts:', priceCounts);

    const ctxPriceCanvas = document.getElementById('chart-price-histogram');
    if (ctxPriceCanvas && priceLabels.length > 0) {
        const msg = ctxPriceCanvas.parentElement.querySelector('.no-data-msg');
        if (msg) {
            msg.classList.remove('visible');
        }
        ctxPriceCanvas.classList.remove('hidden');

        const ctxPrice = ctxPriceCanvas.getContext('2d');
        chartPriceHistogram = new Chart(ctxPrice, {
            type: 'bar',
            data: {
                labels: priceLabels,
                datasets: [{
                    label: 'Số lượng bản ghi',
                    data: priceCounts,
                    backgroundColor: '#5f3dc4',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => `Giá: ${items[0].label} VND`,
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
                            font: { size: 10 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    } else {
    console.warn('⚠️ Cannot draw price histogram - canvas:', ctxPriceCanvas, 'data length:', priceLabels.length);
    }

    // ============ 2. TRỊ GIÁ THEO THỜI GIAN ============
    // Group theo tháng (từ cột "Ngày phê duyệt")
    const monthlyValue = {};
    
    all.forEach(r => {
        const dateStr = r['Ngày phê duyệt'];
        const value = Number(r['Thành tiền (VND)']) || 0;
        
        if (!dateStr || value === 0) return;
        
        // Parse date - giả sử format: dd/mm/yyyy hoặc yyyy-mm-dd
        let monthKey;
        try {
            let dateObj;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    // dd/mm/yyyy
                    dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } else if (dateStr.includes('-')) {
                dateObj = new Date(dateStr);
            }  else if (dateStr instanceof Date) {
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

    console.log('📈 Timeline data:', monthlyValue);

    // Sort theo thời gian
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
        if (msg) {
            msg.classList.remove('visible');
        }
        ctxTimelineCanvas.classList.remove('hidden');
    
        const ctxTimeline = ctxTimelineCanvas.getContext('2d');
        chartTimelineValue = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Tổng trị giá (VND)',
                    data: monthValues,
                    backgroundColor: '#ffddddff',
                    borderColor: '#fa5252',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#fa5252'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const value = Number(item.raw);
                                return `Tổng: ${value.toLocaleString('vi-VN')} VND`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                if (value >= 1_000_000_000) {
                                    return (value / 1_000_000_000).toFixed(1) + 'B';
                                } else if (value >= 1_000_000) {
                                    return (value / 1_000_000).toFixed(1) + 'M';
                                }
                                return value.toLocaleString('vi-VN');
                            },
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    } else if (ctxTimelineCanvas) {
        // Nếu không có dữ liệu ngày tháng
        ctxTimelineCanvas.parentElement.innerHTML = '<p style="font-size:11px;color:#94a3b8;padding:20px;text-align:center;">Không có dữ liệu ngày phê duyệt</p>';
    }
}

});
